<script setup>
/**
 * 班级选择器（可复用）：下拉选择班级 + 内嵌班级管理（新增/编辑/删除）
 * 用于课表安排、随机点名、学生成绩、荣誉积分等页面的「选择班级」。
 */
import { ref, onMounted, computed } from 'vue';
import { api } from '../api/index.js';
import { meta } from '../store/index.js';
import { toast } from '../store/toast.js';
import AppModal from './AppModal.vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '选择班级' },
});
const emit = defineEmits(['update:modelValue']);

const classes = ref([]);
const manageVisible = ref(false);
const classForm = ref({ name: '', grade: '' });
const editingId = ref(null);
const saving = ref(false);

async function loadClasses() {
  classes.value = await api.classes();
}
onMounted(loadClasses);

const currentId = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

function openCreate() {
  editingId.value = null;
  classForm.value = { name: '', grade: '' };
  manageVisible.value = true;
}
function openEdit(c) {
  editingId.value = c.id;
  classForm.value = { name: c.name, grade: c.grade };
  manageVisible.value = true;
}
async function saveClass() {
  if (!classForm.value.name.trim()) { toast('班级名称不能为空', 'error'); return; }
  saving.value = true;
  try {
    if (editingId.value) await api.updateClass(editingId.value, classForm.value);
    else {
      const created = await api.createClass(classForm.value);
      currentId.value = created.id;
    }
    manageVisible.value = false;
    await loadClasses();
    toast('班级已保存', 'success');
  } finally {
    saving.value = false;
  }
}
async function removeClass(c) {
  if (!confirm(`确定删除班级「${c.name}」？该班学生、成绩、积分、课表将一并删除。`)) return;
  await api.deleteClass(c.id);
  if (String(currentId.value) === String(c.id)) currentId.value = '';
  await loadClasses();
  toast('班级已删除', 'success');
}
</script>

<template>
  <div class="field" style="min-width:240px">
    <label class="field-label">{{ label }}</label>
    <div class="row" style="gap:6px; flex-wrap:nowrap">
      <select v-model="currentId" class="select" style="min-width:170px">
        <option value="">请选择班级</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}{{ c.grade ? '（' + c.grade + '）' : '' }}</option>
      </select>
      <button class="btn btn-ghost btn-sm" title="新增班级" @click="openCreate">＋</button>
      <button class="btn btn-ghost btn-sm" title="管理班级" @click="manageVisible = true">管理</button>
    </div>
  </div>

  <AppModal v-model="manageVisible" title="管理班级" width="560px">
    <div class="row" style="gap:8px; margin-bottom:14px">
      <input v-model="classForm.name" class="input" placeholder="班级名称，如：初一（2）班" style="flex:1" />
      <select v-model="classForm.grade" class="select" style="width:120px">
        <option value="">选择年级</option>
        <option v-for="g in meta.grades" :key="g" :value="g">{{ g }}</option>
      </select>
      <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveClass">
        {{ editingId ? '保存' : '新增' }}
      </button>
    </div>
    <div v-if="classes.length === 0" class="empty">暂无班级，请在上方新增。</div>
    <div v-for="c in classes" :key="c.id" class="row class-manage-item">
      <span class="tag tag-blue">{{ c.name }}{{ c.grade ? '（' + c.grade + '）' : '' }}</span>
      <span class="hint" style="flex:1">{{ c.studentCount }} 人</span>
      <button class="btn-link" @click="openEdit(c)">编辑</button>
      <button class="btn-link danger" @click="removeClass(c)">删除</button>
    </div>
    <template #footer>
      <button class="btn btn-ghost" @click="manageVisible = false">完成</button>
    </template>
  </AppModal>
</template>
