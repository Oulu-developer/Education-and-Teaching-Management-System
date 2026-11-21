/**
 * 荣誉积分服务：随机点名后的积分评定实时写入，并提供按班级的积分排名榜
 */
import { from, run } from '../config/db.js';
import { AppError } from '../utils/response.js';
import { toNumber } from '../utils/helpers.js';

/** 新增一条积分记录（点名后教师评定） */
export async function addPoints(raw) {
  const studentId = Number(raw?.student_id);
  const classId = Number(raw?.class_id);
  const points = toNumber(raw?.points, NaN);
  if (!studentId) throw new AppError('请选择学生');
  if (!classId) throw new AppError('缺少班级信息');
  if (!Number.isFinite(points) || points === 0) throw new AppError('积分不能为 0');
  return run(from('points').insert({
    student_id: studentId,
    class_id: classId,
    points,
    reason: String(raw?.reason ?? '').trim(),
  }).select().single(), '记录积分失败');
}

/** 积分排名榜：按班级聚合学生积分，从高到低排序 */
export async function getRanking(classId) {
  const cid = Number(classId);
  if (!cid) throw new AppError('请选择班级');
  const students = await run(from('student').select('*').eq('class_id', cid), '查询学生失败');
  const rows = await run(from('points').select('*').eq('class_id', cid), '查询积分失败');

  const map = {};
  (rows || []).forEach((p) => {
    map[p.student_id] = (map[p.student_id] || 0) + toNumber(p.points);
  });
  return (students || [])
    .map((s) => ({ student: s, totalPoints: map[s.id] || 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

/** 某学生积分明细（倒序） */
export async function getHistory(studentId) {
  const data = await run(
    from('points').select('*').eq('student_id', Number(studentId)).order('id', { ascending: false }),
    '查询积分明细失败',
  );
  return data || [];
}
