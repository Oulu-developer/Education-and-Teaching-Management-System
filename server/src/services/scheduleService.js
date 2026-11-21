/**
 * 课表服务：按「班级 × 星期 × 节次」存储课程格子
 * 课表内容可由教师手动编辑，或经前端 OCR 识别后整体保存。
 */
import { from, run } from '../config/db.js';
import { AppError } from '../utils/response.js';

/** 获取某班课表（返回原始格子数组） */
export async function getSchedule(classId) {
  const data = await run(
    from('schedule').select('*').eq('class_id', Number(classId)).order('week', { ascending: true }).order('period', { ascending: true }),
    '查询课表失败',
  );
  return data || [];
}

/** 批量保存课表：整体替换某班课表，只保留有课程内容的格子 */
export async function saveSchedule(classId, cells) {
  const cid = Number(classId);
  if (!cid) throw new AppError('请选择班级');
  await run(from('schedule').delete().eq('class_id', cid), '清理旧课表失败');

  const list = (Array.isArray(cells) ? cells : [])
    .filter((c) => c && String(c.course ?? '').trim() !== '')
    .map((c) => ({
      class_id: cid,
      week: Number(c.week),
      period: Number(c.period),
      course: String(c.course).trim(),
    }));
  if (list.length) {
    await run(from('schedule').insert(list).select('id'), '保存课表失败');
  }
  return getSchedule(cid);
}

/** 更新单个格子课程内容 */
export async function updateCell(id, raw) {
  const data = await run(
    from('schedule').update({ course: String(raw?.course ?? '').trim() }).eq('id', Number(id)).select().maybeSingle(),
    '更新课表失败',
  );
  if (!data) throw new AppError('课表项不存在', 404);
  return data;
}
