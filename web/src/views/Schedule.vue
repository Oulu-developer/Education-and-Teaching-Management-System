<script setup>
/**
 * 课表安排：选择班级、导入图片（OCR 视觉大模型识别）、在线编辑、保存
 */
import { ref, computed, watch } from 'vue';
import { api } from '../api/index.js';
import { meta } from '../store/index.js';
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import { toast } from '../store/toast.js';
import ClassSelect from '../components/ClassSelect.vue';

const classId = ref('');
const cells = ref({});
const recognizing = ref(false);
const saving = ref(false);
const fileInput = ref(null);

const weekdays = computed(() => meta.value.weekdays);
const periods = computed(() => Array.from({ length: meta.value.periods }, (_, i) => i + 1));

function cellKey(week, period) { return `${week}-${period}`; }
function getCourse(week, period) {
  const key = cellKey(week, period);
  return cells.value[key]?.course || '';
}
function setCourse(week, period, course) {
  const key = cellKey(week, period);
  if (!cells.value[key]) cells.value[key] = { id: null, course: '' };
  cells.value[key].course = course;
}

async function load() {
  cells.value = {};
  if (!classId.value) return;
  const rows = await api.schedule(classId.value);
  const map = {};
  rows.forEach((r) => { map[cellKey(r.week, r.period)] = { id: r.id, course: r.course }; });
  cells.value = map;
}
watch(classId, load);

async function save() {
  if (!classId.value) { toast('请先选择班级', 'error'); return; }
  saving.value = true;
  try {
    const list = [];
    Object.keys(cells.value).forEach((key) => {
      const [w, p] = key.split('-').map(Number);
      if (cells.value[key].course.trim()) list.push({ week: w, period: p, course: cells.value[key].course.trim() });
    });
    await api.saveSchedule(classId.value, list);
    toast('课表已保存', 'success');
    load();
  } finally {
    saving.value = false;
  }
}

/* 图片转 base64 */
function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

/* 从模型输出中提取 JSON：兼容 ```json 代码块等干扰 */
function extractJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
  throw new Error('识别结果无法解析');
}

/* 课程名规范化：去掉行列标签、归一化分隔符 */
function normalizeCourse(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  s = s.replace(/^(上午|下午|早晨|中午|晚上)\s*[:：]?/i, '');
  s = s.replace(/第[一二三四五六七八九十\d]{1,2}节/g, '');
  s = s.replace(/[，,、;；|]/g, '/');
  s = s.replace(/\s+/g, '');
  s = s.replace(/^[/]+|[/]+$/g, '');
  return s.trim();
}

/* 调用单个视觉模型，返回完整文本 */
async function callVision(cloud, model, imageDataUrl) {
  let answer = '';
  for await (const chunk of cloud.llm.chat.completions.create({
    model: model.id,
    messages: [
      { role: 'system', content: '你是专业的课程表 OCR 识别助手。请仔细识别图片中的课程表，提取每个格子的课程名称，按「星期 × 节次」输出。\n识别规则：\n1. 只提取课程名称，忽略表头与行列标签（如「星期一/周一」「第X节」「上午」「下午」「午休」「课间操」等）。\n2. 同一课程若占用连续多节（连堂课），在每一节都填写该课程。\n3. 一个格子含多个课程时用斜杠「/」连接，例如「语文/数学」。\n4. 标注「单周/双周/单双周」等保留在括号内，例如「数学（单周）」。\n5. 空白或非课程格子不要输出。\n6. 课程名规范去空格，如「英语」「体育」「信息技术」。\nweek 取值 1~7（1=周一，2=周二……7=周日），period 从 1 开始（第 1 节=1）。\n输出严格 JSON，格式：{"cells":[{"week":1,"period":1,"course":"语文"}]}\n只输出 JSON，不要任何解释文字。' },
      { role: 'user', content: [
        { type: 'text', text: '请识别这张课表图片，提取每个星期、每个节次的课程。' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ] },
    ],
    stream: true,
    response_format: { type: 'json_object' },
  })) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) answer += delta;
  }
  return answer;
}

/* 依次尝试可用视觉模型，首个成功解析即返回 */
async function recognizeSchedule(imageDataUrl) {
  if (!meta.value.cloud) throw new Error('云服务尚未就绪，请刷新页面');
  const cloud = createWorkBuddyCloud({
    endpoint: meta.value.cloud.endpoint,
    publishableKey: meta.value.cloud.publishableKey,
  });
  const models = await cloud.llm.models.list();
  const visionModels = models.filter((m) => m.supportsImages === true && m.disabled !== true);
  const candidates = [...visionModels, ...models.filter((m) => m.disabled !== true && !visionModels.includes(m))];
  if (!candidates.length) throw new Error('暂无可用的视觉模型');

  let lastErr = null;
  for (const model of candidates.slice(0, 3)) {
    try {
      const answer = await callVision(cloud, model, imageDataUrl);
      return extractJson(answer);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('识别失败');
}

async function onFileChange(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  recognizing.value = true;
  try {
    const dataUrl = await toDataUrl(file);
    const result = await recognizeSchedule(dataUrl);
    const list = Array.isArray(result?.cells) ? result.cells : [];
    // 规范化 + 去重（同星期同节次取后者）+ 范围校验 + 去空
    const seen = new Set();
    let filled = 0;
    let skipped = 0;
    list.forEach((c) => {
      const w = Number(c.week);
      const p = Number(c.period);
      const course = normalizeCourse(c.course);
      if (!Number.isInteger(w) || !Number.isInteger(p)) { skipped++; return; }
      if (w < 1 || w > 7 || p < 1 || p > (meta.value.periods || 8)) { skipped++; return; }
      if (!course) { skipped++; return; }
      const key = `${w}-${p}`;
      if (seen.has(key)) return;
      seen.add(key);
      setCourse(w, p, course);
      filled++;
    });
    if (!filled) { toast('未识别到有效课程，请更换清晰图片重试', 'error'); return; }
    const msg = skipped ? `识别完成：填充 ${filled} 个格子，忽略 ${skipped} 个无效项，请核对后保存` : `识别完成，共填充 ${filled} 个课程格子，请核对后保存`;
    toast(msg, 'success');
  } catch (err) {
    toast(err.message || '课表识别失败', 'error');
  } finally {
    recognizing.value = false;
  }
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="toolbar">
          <div class="toolbar-left">
            <ClassSelect v-model="classId" />
          </div>
          <div class="toolbar-right">
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
            <button class="btn btn-soft" :disabled="!classId || recognizing" @click="fileInput.click()">
              {{ recognizing ? '识别中…' : '📷 导入课表图片' }}
            </button>
            <button class="btn btn-primary" :disabled="!classId || saving" @click="save">保存课表</button>
          </div>
        </div>
        <div class="hint mt-8">
          上传课表图片，系统自动识别并填充到下方表格；也可直接在表格中点击单元格修改课程。识别结果需点击「保存课表」才会入库。
        </div>
      </div>
    </div>

    <div v-if="!classId" class="card"><div class="empty">请先选择班级</div></div>
    <div v-else class="card">
      <div class="table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="period-col">节次</th>
              <th v-for="w in weekdays" :key="w.value">{{ w.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in periods" :key="p">
              <th class="period-col">第 {{ p }} 节</th>
              <td v-for="w in weekdays" :key="w.value" class="schedule-cell">
                <input :value="getCourse(w.value, p)" :placeholder="'—'" @input="setCourse(w.value, p, $event.target.value)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
