/**
 * 班级与学生服务：多班级维度下的班级、学生增删改查
 * 数据访问统一走云数据库 SDK（from/run），外部输入经查询构建器过滤，不参与任何 SQL 拼接。
 */
import { from, run } from '../config/db.js';
import { AppError } from '../utils/response.js';

/** 班级列表（附带每班学生数） */
export async function listClasses() {
  const classes = await run(
    from('class').select('*').order('id', { ascending: true }),
    '查询班级失败',
  );
  const students = await run(from('student').select('class_id'), '统计学生失败');
  const countMap = {};
  (students || []).forEach((s) => {
    countMap[s.class_id] = (countMap[s.class_id] || 0) + 1;
  });
  return (classes || []).map((c) => ({ ...c, studentCount: countMap[c.id] || 0 }));
}

export async function createClass(raw) {
  const name = String(raw?.name ?? '').trim();
  const grade = String(raw?.grade ?? '').trim();
  if (!name) throw new AppError('班级名称不能为空');
  return run(from('class').insert({ name, grade }).select().single(), '新增班级失败');
}

export async function updateClass(id, raw) {
  const name = String(raw?.name ?? '').trim();
  if (!name) throw new AppError('班级名称不能为空');
  const data = await run(
    from('class').update({ name, grade: String(raw?.grade ?? '').trim() })
      .eq('id', Number(id)).select().maybeSingle(),
    '更新班级失败',
  );
  if (!data) throw new AppError('班级不存在', 404);
  return data;
}

/** 删除班级：级联清理该班学生的积分/成绩、课表、学生，再删班级 */
export async function deleteClass(id) {
  const classId = Number(id);
  const students = await run(
    from('student').select('id').eq('class_id', classId),
    '查询班级学生失败',
  );
  const studentIds = (students || []).map((s) => Number(s.id));
  if (studentIds.length) {
    await run(from('points').delete().in('student_id', studentIds), '清理积分失败');
    await run(from('grade').delete().in('student_id', studentIds), '清理成绩失败');
  }
  await run(from('schedule').delete().eq('class_id', classId), '清理课表失败');
  await run(from('student').delete().eq('class_id', classId), '删除班级学生失败');
  const data = await run(from('class').delete().eq('id', classId).select('id'), '删除班级失败');
  if (!data || data.length === 0) throw new AppError('班级不存在', 404);
  return { id: classId };
}

/** 学生列表（可按班级过滤） */
export async function listStudents(classId) {
  let builder = from('student').select('*').order('id', { ascending: true });
  if (classId) builder = builder.eq('class_id', Number(classId));
  return run(builder, '查询学生失败') || [];
}

export async function createStudent(raw) {
  const name = String(raw?.name ?? '').trim();
  const classId = Number(raw?.class_id);
  if (!name) throw new AppError('学生姓名不能为空');
  if (!classId) throw new AppError('请选择所属班级');
  return run(from('student').insert({
    class_id: classId,
    name,
    gender: String(raw?.gender ?? '').trim(),
    parent_contact: String(raw?.parent_contact ?? '').trim(),
  }).select().single(), '新增学生失败');
}

export async function updateStudent(id, raw) {
  const data = await run(
    from('student').update({
      name: String(raw?.name ?? '').trim(),
      gender: String(raw?.gender ?? '').trim(),
      parent_contact: String(raw?.parent_contact ?? '').trim(),
    }).eq('id', Number(id)).select().maybeSingle(),
    '更新学生失败',
  );
  if (!data) throw new AppError('学生不存在', 404);
  return data;
}

/** 删除学生：同步清理其积分、成绩，保持数据一致 */
export async function deleteStudent(id) {
  const studentId = Number(id);
  await run(from('points').delete().eq('student_id', studentId), '清理积分失败');
  await run(from('grade').delete().eq('student_id', studentId), '清理成绩失败');
  const data = await run(from('student').delete().eq('id', studentId).select('id'), '删除学生失败');
  if (!data || data.length === 0) throw new AppError('学生不存在', 404);
  return { id: studentId };
}
