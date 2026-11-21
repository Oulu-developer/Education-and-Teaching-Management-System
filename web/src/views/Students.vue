<script setup>
/**
 * 学生信息：多班级管理、学生增删改、导入学生名单
 */
import { ref, onMounted, watch } from 'vue';
import { api, downloadTemplate } from '../api/index.js';
import { meta } from '../store/index.js';
import { toast } from '../store/toast.js';
import AppModal from '../components/AppModal.vue';

const classes = ref([]);
const classId = ref('');
const students = ref([]);

const classVisible = ref(false);
const classForm = ref({ name: '', grade: '' });
const editingClassId = ref(null);

const studentVisible = ref(false);
const studentForm = ref({ class_id: null, name: '', gender: '男', parent_contact: '' });
const editingStudentId = ref(null);

const importVisible = ref(false);
const importPreview = ref([]);
const importing = ref(false);

async function loadClasses() {
  classes.value = await api.classes();
}
async function loadStudents() {
  students.value = [];
  if (!classId.value) return;
  students.value = await api.students(classId.value);
}
async function refreshAll() {
  await loadClasses();
  await loadStudents();
}
onMounted(async () => {
  await loadClasses();
  if (classes.value.length) classId.value = classes.value[0].id;
  await loadStudents();
});
watch(classId, loadStudents);

/* 班级 */
function openCreateClass() {
  editingClassId.value = null;
  classForm.value = { name: '', grade: '' };
  classVisible.value = true;
}
function openEditClass(c) {
  editingClassId.value = c.id;
  classForm.value = { name: c.name, grade: c.grade };
  classVisible.value = true;
}
async function saveClass() {
  if (!classForm.value.name.trim()) { toast('班级名称不能为空', 'error'); return; }
  if (editingClassId.value) await api.updateClass(editingClassId.value, classForm.value);
  else await api.createClass(classForm.value);
  classVisible.value = false;
  await loadClasses();
}
async function removeClass(c) {
  if (!confirm(`确定删除班级「${c.name}」？该班学生、成绩、积分、课表将一并删除。`)) return;
  await api.deleteClass(c.id);
  if (classId.value === c.id) classId.value = '';
  await refreshAll();
}

/* 学生 */
function openCreateStudent() {
  editingStudentId.value = null;
  studentForm.value = { class_id: Number(classId.value), name: '', gender: '男', parent_contact: '' };
  studentVisible.value = true;
}
function openEditStudent(s) {
  editingStudentId.value = s.id;
  studentForm.value = { class_id: s.class_id, name: s.name, gender: s.gender || '男', parent_contact: s.parent_contact };
  studentVisible.value = true;
}
async function saveStudent() {
  if (!studentForm.value.name.trim()) { toast('学生姓名不能为空', 'error'); return; }
  if (editingStudentId.value) await api.updateStudent(editingStudentId.value, studentForm.value);
  else await api.createStudent(studentForm.value);
  studentVisible.value = false;
  await refreshAll();
}
async function removeStudent(s) {
  if (!confirm(`确定删除学生「${s.name}」？其积分与成绩将一并删除。`)) return;
  await api.deleteStudent(s.id);
  await loadStudents();
}

/* 导入学生名单 */
async function onImportFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.importStudents(fd);
  importPreview.value = res.students;
}
async function doImport() {
  if (!classId.value || !importPreview.value.length) return;
  importing.value = true;
  try {
    let count = 0;
    for (const s of importPreview.value) {
      await api.createStudent({ class_id: Number(classId.value), name: s.name, gender: s.gender, parent_contact: s.parent_contact });
      count++;
    }
    toast(`已导入 ${count} 名学生`, 'success');
    importVisible.value = false;
    importPreview.value = [];
    await refreshAll();
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div>
    <!-- 班级管理 -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">班级管理</div>
        <button class="btn btn-soft btn-sm" @click="openCreateClass">＋ 新增班级</button>
      </div>
      <div class="card-body">
        <div class="row" style="gap:8px">
          <span
            v-for="c in classes"
            :key="c.id"
            class="tag"
            :class="classId === c.id ? 'tag-blue' : 'tag-gray'"
            style="cursor:pointer; font-size:13px; padding:6px 14px"
            @click="classId = c.id"
          >{{ c.name }}{{ c.grade ? '（' + c.grade + '）' : '' }} · {{ c.studentCount }}人</span>
          <span v-if="classes.length === 0" class="hint">暂无班级，请先新增。</span>
        </div>
        <div v-if="classId" class="row mt-14">
          <button class="btn-link" @click="openEditClass(classes.find(c => c.id === classId))">编辑当前班级</button>
          <button class="btn-link danger" @click="removeClass(classes.find(c => c.id === classId))">删除当前班级</button>
        </div>
      </div>
    </div>

    <!-- 学生列表 -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">学生信息（{{ students.length }} 人）</div>
        <div class="row">
          <button class="btn btn-ghost btn-sm" :disabled="!classId" @click="importVisible = true">导入学生名单</button>
          <button class="btn btn-primary btn-sm" :disabled="!classId" @click="openCreateStudent">＋ 添加学生</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th style="width:70px">序号</th><th>姓名</th><th>性别</th><th>家长联系方式</th><th class="text-right">操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in students" :key="s.id">
              <td>{{ i + 1 }}</td>
              <td>{{ s.name }}</td>
              <td><span class="tag" :class="s.gender === '女' ? 'tag-green' : 'tag-blue'">{{ s.gender || '男' }}</span></td>
              <td>{{ s.parent_contact || '—' }}</td>
              <td class="text-right actions">
                <button class="btn-link" @click="openEditStudent(s)">编辑</button>
                <button class="btn-link danger" @click="removeStudent(s)">删除</button>
              </td>
            </tr>
            <tr v-if="students.length === 0">
              <td colspan="5" class="empty">{{ classId ? '该班级暂无学生，可添加或导入。' : '请先选择班级。' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 班级弹窗 -->
    <AppModal v-model="classVisible" :title="editingClassId ? '编辑班级' : '新增班级'" width="480px">
      <div class="field">
        <label class="field-label">班级名称<span class="req">*</span></label>
        <input v-model="classForm.name" class="input" placeholder="例如：初一（1）班" />
      </div>
      <div class="field mt-14">
        <label class="field-label">年级</label>
        <select v-model="classForm.grade" class="select">
          <option value="">选择年级</option>
          <option v-for="g in meta.grades" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="classVisible = false">取消</button>
        <button class="btn btn-primary" @click="saveClass">保存</button>
      </template>
    </AppModal>

    <!-- 学生弹窗 -->
    <AppModal v-model="studentVisible" :title="editingStudentId ? '编辑学生' : '添加学生'" width="480px">
      <div class="field">
        <label class="field-label">姓名<span class="req">*</span></label>
        <input v-model="studentForm.name" class="input" placeholder="学生姓名" />
      </div>
      <div class="form-grid mt-14">
        <div class="field">
          <label class="field-label">性别</label>
          <select v-model="studentForm.gender" class="select">
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">家长联系方式</label>
          <input v-model="studentForm.parent_contact" class="input" placeholder="手机号" />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="studentVisible = false">取消</button>
        <button class="btn btn-primary" @click="saveStudent">保存</button>
      </template>
    </AppModal>

    <!-- 导入弹窗 -->
    <AppModal v-model="importVisible" title="导入学生名单" width="560px">
      <div class="field">
        <label class="field-label">选择文件<span class="req">*</span></label>
        <input type="file" accept=".xlsx,.xls,.csv" class="input" @change="onImportFile" />
      </div>
      <div class="hint mt-8">Excel/CSV 需包含「姓名」列（或第一列为姓名），将批量导入到当前班级。</div>
      <div class="row mt-8">
        <button class="btn-link" @click="downloadTemplate('students')">⬇ 下载学生名单模板</button>
      </div>
      <div v-if="importPreview.length" class="mt-14">
        <div class="section-title">解析预览（{{ importPreview.length }} 名学生）</div>
        <div class="row" style="gap:6px">
          <span v-for="(s, i) in importPreview.slice(0, 60)" :key="i" class="tag tag-gray">{{ s.name }}</span>
          <span v-if="importPreview.length > 60" class="hint">…等 {{ importPreview.length }} 人</span>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="importVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="importing || !importPreview.length" @click="doImport">导入 {{ importPreview.length }} 人</button>
      </template>
    </AppModal>
  </div>
</template>
