<script setup>
/**
 * 荣誉积分：按班级实时展示积分排名榜（数据来自随机点名评定）
 */
import { ref, watch } from 'vue';
import { api } from '../api/index.js';
import ClassSelect from '../components/ClassSelect.vue';

const classId = ref('');
const ranking = ref([]);
const loading = ref(false);

async function load() {
  ranking.value = [];
  if (!classId.value) return;
  loading.value = true;
  try {
    ranking.value = await api.ranking(classId.value);
  } finally {
    loading.value = false;
  }
}
watch(classId, load);

function rankClass(i) {
  if (i === 0) return 'rank-1';
  if (i === 1) return 'rank-2';
  if (i === 2) return 'rank-3';
  return '';
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="toolbar">
          <ClassSelect v-model="classId" />
          <div class="hint" style="align-self:center">积分实时来自「随机点名」中的评定</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">积分排名榜</div>
        <span class="hint">按积分从高到低</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th style="width:70px">排名</th><th>姓名</th><th>性别</th><th class="text-center">积分</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in ranking" :key="row.student.id">
              <td><span class="rank-badge" :class="rankClass(i)">{{ i + 1 }}</span></td>
              <td>{{ row.student.name }}</td>
              <td>{{ row.student.gender || '—' }}</td>
              <td class="text-center"><strong style="color:var(--primary-dark); font-size:16px">{{ row.totalPoints }}</strong></td>
            </tr>
            <tr v-if="ranking.length === 0 && !loading">
              <td colspan="4" class="empty">{{ classId ? '暂无积分数据，请先在「随机点名」中评定。' : '请先选择班级。' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
