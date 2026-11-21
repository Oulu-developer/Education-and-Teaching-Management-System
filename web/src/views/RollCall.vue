<script setup>
/**
 * 随机点名：选择班级，从学生名单随机抽取（单个 / 5 个 / 10 个），点名后评定积分实时记入荣誉积分
 */
import { ref, watch } from 'vue';
import { api } from '../api/index.js';
import { meta } from '../store/index.js';
import { toast } from '../store/toast.js';

const classId = ref('');
const students = ref([]);
const result = ref([]);
const pointValue = ref(1);
const awarding = ref(false);

async function loadStudents() {
  result.value = [];
  students.value = [];
  if (!classId.value) return;
  students.value = await api.students(classId.value);
}
watch(classId, loadStudents);

/** 随机抽取 n 名学生（不足则全取） */
function pick(n) {
  if (!students.value.length) {
    toast('该班级暂无学生，请先到「学生信息」添加或导入', 'error');
    return;
  }
  const pool = [...students.value];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  result.value = pool.slice(0, Math.min(n, pool.length));
}

/** 为被点名学生评定积分，实时记入荣誉积分 */
async function awardPoints() {
  if (!result.value.length) return;
  const points = Number(pointValue.value);
  if (!Number.isFinite(points) || points === 0) {
    toast('请输入有效的积分值', 'error');
    return;
  }
  awarding.value = true;
  try {
    for (const s of result.value) {
      await api.addPoints({ student_id: s.id, class_id: Number(classId.value), points, reason: '随机点名' });
    }
    toast(`已为 ${result.value.length} 名学生记录 ${points > 0 ? '+' : ''}${points} 分`, 'success');
  } finally {
    awarding.value = false;
  }
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="toolbar">
          <div class="field">
            <label class="field-label">选择班级</label>
            <select v-model="classId" class="select" style="min-width:200px">
              <option value="">请选择班级</option>
              <option v-for="c in meta.classes" :key="c.id" :value="c.id">{{ c.name }}{{ c.grade ? '（' + c.grade + '）' : '' }}</option>
            </select>
          </div>
          <div class="hint" style="align-self:center">共 {{ students.length }} 名学生（来自学生信息）</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="rollcall-stage">
          <div v-if="result.length" class="rollcall-names">
            <div v-for="s in result" :key="s.id" class="rollcall-name">{{ s.name }}</div>
          </div>
          <div v-else class="rollcall-empty">点击下方按钮随机抽取学生</div>
        </div>

        <div class="row mt-18" style="justify-content:center">
          <button class="btn btn-soft" @click="pick(1)">抽 1 个</button>
          <button class="btn btn-soft" @click="pick(5)">抽 5 个</button>
          <button class="btn btn-soft" @click="pick(10)">抽 10 个</button>
        </div>

        <div v-if="result.length" class="divider" />
        <div v-if="result.length" class="row mt-8" style="justify-content:center">
          <div class="field">
            <label class="field-label">为以上学生评定积分</label>
            <input v-model="pointValue" type="number" class="input" style="width:120px" />
          </div>
          <button class="btn btn-primary" :disabled="awarding" @click="awardPoints">记录积分</button>
        </div>
      </div>
    </div>
  </div>
</template>
