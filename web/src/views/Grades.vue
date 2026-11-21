<script setup>
/**
 * 学生成绩：导入成绩文件（Excel），按总分自动排序，展示各科成绩
 */
import { ref, watch, onMounted } from 'vue';
import { api, downloadTemplate } from '../api/index.js';
import { toast } from '../store/toast.js';
import AppModal from '../components/AppModal.vue';
import ClassSelect from '../components/ClassSelect.vue';

const classId = ref('');
const examName = ref('');
const grades = ref([]);
const examNames = ref([]);
const subjects = ref([]);

const examTypes = ref([]);
const examTypeVisible = ref(false);
const examTypeName = ref('');
const examTypeSaving = ref(false);

const importVisible = ref(false);
const importFile = ref(null);
const parsedRows = ref([]);
const importExamName = ref('');
const importing = ref(false);

async function load() {
  grades.value = [];
  subjects.value = [];
  if (!classId.value) return;
  const [g, names] = await Promise.all([
    api.grades(classId.value, examName.value),
    api.examNames(classId.value),
  ]);
  grades.value = g;
  examNames.value = names;
  const set = new Set();
  g.forEach((row) => row.subjects.forEach((s) => set.add(s.subject)));
  subjects.value = [...set];
}
watch(classId, () => { examName.value = ''; load(); });
watch(examName, load);

/* ---- 考试类型增删 ---- */
async function loadExamTypes() {
  examTypes.value = await api.examTypes();
}
onMounted(loadExamTypes);

async function addExamType() {
  const n = examTypeName.value.trim();
  if (!n) { toast('请输入考试类型名称', 'error'); return; }
  examTypeSaving.value = true;
  try {
    await api.createExamType(n);
    examTypeName.value = '';
    await loadExamTypes();
    examName.value = n;
    toast('考试类型已添加', 'success');
  } catch (err) {
    toast(err.message || '添加失败', 'error');
  } finally {
    examTypeSaving.value = false;
  }
}

async function removeExamType(name) {
  if (!confirm(`确定删除考试类型「${name}」？该名称下的成绩记录将一并删除。`)) return;
  await api.deleteExamType(name);
  if (examName.value === name) examName.value = '';
  await loadExamTypes();
  if (classId.value) load();
  toast('考试类型已删除', 'success');
}

function scoreOf(row, subject) {
  const s = row.subjects.find((x) => x.subject === subject);
  return s ? s.score : '';
}

async function onFileChange(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  importFile.value = file;
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.importGradesParse(fd);
  parsedRows.value = res.rows;
  if (res.rows.length === 0) toast('未解析到成绩数据，请检查文件格式', 'error');
}

async function doImport() {
  if (!classId.value || !parsedRows.value.length) return;
  importing.value = true;
  try {
    const res = await api.importGrades({
      classId: Number(classId.value),
      examName: importExamName.value || examName.value || '默认考试',
      rows: parsedRows.value,
    });
    examName.value = importExamName.value || examName.value || '默认考试';
    toast(`已导入 ${res.count} 条成绩`, 'success');
    importVisible.value = false;
    parsedRows.value = [];
    importExamName.value = '';
    load();
  } finally {
    importing.value = false;
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
            <div class="field">
              <label class="field-label">考试名称</label>
              <div class="row" style="gap:6px; flex-wrap:nowrap">
                <select v-model="examName" class="select" style="min-width:160px">
                  <option value="">全部考试</option>
                  <option v-for="n in examNames" :key="n" :value="n">{{ n }}</option>
                </select>
                <button class="btn btn-ghost btn-sm" title="新增考试类型" @click="examTypeName = ''; examTypeVisible = true">＋</button>
                <button class="btn btn-ghost btn-sm" title="管理考试类型" @click="examTypeVisible = true">管理</button>
              </div>
            </div>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-primary" :disabled="!classId" @click="importVisible = true">导入成绩文件</button>
          </div>
        </div>
        <div class="hint mt-8">支持 Excel 导入（「姓名 + 各科成绩」或「姓名/科目/分数」格式），按总分从高到低自动排序。</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px">排名</th>
              <th>姓名</th>
              <th v-for="s in subjects" :key="s" class="text-center">{{ s }}</th>
              <th class="text-center">总分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in grades" :key="row.student.id">
              <td>
                <span class="rank-badge" :class="{ 'rank-1': i === 0, 'rank-2': i === 1, 'rank-3': i === 2 }">{{ i + 1 }}</span>
              </td>
              <td>{{ row.student.name }}</td>
              <td v-for="s in subjects" :key="s" class="text-center">{{ scoreOf(row, s) }}</td>
              <td class="text-center"><strong>{{ row.total }}</strong></td>
            </tr>
            <tr v-if="grades.length === 0">
              <td :colspan="subjects.length + 3" class="empty">暂无成绩数据，请先导入。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="examTypeVisible" title="管理考试类型" width="520px">
      <div class="row" style="gap:8px; margin-bottom:14px">
        <input v-model="examTypeName" class="input" placeholder="考试类型名称，如：期中考试" style="flex:1" @keyup.enter="addExamType" />
        <button class="btn btn-primary btn-sm" :disabled="examTypeSaving" @click="addExamType">新增</button>
      </div>
      <div v-if="examTypes.length === 0" class="empty">暂无考试类型，请在上方新增。</div>
      <div v-for="t in examTypes" :key="t.id" class="row class-manage-item">
        <span class="tag tag-blue">{{ t.name }}</span>
        <span style="flex:1"></span>
        <button class="btn-link danger" @click="removeExamType(t.name)">删除</button>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="examTypeVisible = false">完成</button>
      </template>
    </AppModal>

    <AppModal v-model="importVisible" title="导入成绩文件" width="560px">
      <div class="field">
        <label class="field-label">考试名称</label>
        <input v-model="importExamName" class="input" placeholder="例如：期中考试（留空则沿用当前筛选）" />
      </div>
      <div class="field mt-14">
        <label class="field-label">选择文件<span class="req">*</span></label>
        <input type="file" accept=".xlsx,.xls,.csv" class="input" @change="onFileChange" />
      </div>
      <div class="hint mt-8">支持「姓名 + 各科成绩」宽表 或「姓名/科目/分数」长表两种格式。</div>
      <div class="row mt-8" style="gap:12px">
        <button class="btn-link" @click="downloadTemplate('grades')">⬇ 下载宽表模板</button>
        <button class="btn-link" @click="downloadTemplate('grades-long')">⬇ 下载长表模板</button>
      </div>
      <div v-if="parsedRows.length" class="mt-14">
        <div class="section-title">解析预览（{{ parsedRows.length }} 条）</div>
        <div class="table-wrap" style="max-height:240px; overflow-y:auto">
          <table class="table">
            <thead><tr><th>学生姓名</th><th>科目</th><th>分数</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in parsedRows.slice(0, 30)" :key="i">
                <td>{{ r.studentName }}</td><td>{{ r.subject }}</td><td>{{ r.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="parsedRows.length > 30" class="hint mt-8">仅预览前 30 条。</div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="importVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="importing || !parsedRows.length" @click="doImport">导入</button>
      </template>
    </AppModal>
  </div>
</template>
