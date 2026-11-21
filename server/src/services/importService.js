/**
 * 文件导入服务：解析 Excel/CSV，提取学生名单或成绩
 * 依赖 xlsx（纯 JS），支持 .xlsx / .xls / .csv。
 */
import * as XLSX from 'xlsx';
import { AppError } from '../utils/response.js';
import { toNumber } from '../utils/helpers.js';

/** 解析上传 buffer，返回二维数组（首行为表头，可能为空） */
export function parseSheet(buffer) {
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new AppError('文件无法解析，请上传有效的 Excel/CSV 文件');
  }
  if (!wb.SheetNames.length) throw new AppError('文件中没有工作表');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

/** 解析学生名单：优先识别「姓名」列，否则取第一列非空值 */
export function parseStudents(buffer) {
  const rows = parseSheet(buffer);
  if (!rows.length) throw new AppError('文件中没有数据');

  const header = rows[0].map((h) => String(h).trim());
  const nameIdx = header.findIndex((h) => /姓名|名字|name/i.test(h));
  const names = [];

  if (nameIdx >= 0) {
    rows.slice(1).forEach((row) => {
      const name = String(row[nameIdx] ?? '').trim();
      if (name) names.push(name);
    });
  } else {
    rows.forEach((row) => {
      const name = String(row[0] ?? '').trim();
      if (name && !/姓名|名字/i.test(name)) names.push(name);
    });
  }
  return [...new Set(names)].map((name) => ({ name, gender: '', parent_contact: '' }));
}

/**
 * 解析成绩：支持两种格式
 * 1. 长表：姓名 | 科目 | 分数
 * 2. 宽表：第一列姓名，其余列为各科成绩
 * 返回 [{ studentName, subject, score }]
 */
export function parseGrades(buffer) {
  const rows = parseSheet(buffer);
  if (!rows.length) throw new AppError('文件中没有数据');
  const header = rows[0].map((h) => String(h).trim());

  const nameIdx = header.findIndex((h) => /姓名|名字|name/i.test(h));
  const subjectIdx = header.findIndex((h) => /科目|学科|subject/i.test(h));
  const scoreIdx = header.findIndex((h) => /分数|成绩|得分|score/i.test(h));

  // 长表：同时含「科目」与「分数」列
  if (subjectIdx >= 0 && scoreIdx >= 0) {
    const nIdx = nameIdx >= 0 ? nameIdx : 0;
    return rows.slice(1)
      .map((row) => ({
        studentName: String(row[nIdx] ?? '').trim(),
        subject: String(row[subjectIdx] ?? '').trim(),
        score: toNumber(row[scoreIdx], NaN),
      }))
      .filter((r) => r.studentName && r.subject && Number.isFinite(r.score));
  }

  // 宽表：姓名列 + 各科列
  const nIdx = nameIdx >= 0 ? nameIdx : 0;
  const subjectCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => i !== nIdx && h !== '');
  if (!subjectCols.length) throw new AppError('未识别到成绩列，请用「姓名 + 各科成绩」或「姓名/科目/分数」格式');

  const result = [];
  rows.slice(1).forEach((row) => {
    const studentName = String(row[nIdx] ?? '').trim();
    if (!studentName) return;
    subjectCols.forEach(({ h, i }) => {
      const score = toNumber(row[i], NaN);
      if (Number.isFinite(score)) result.push({ studentName, subject: h, score });
    });
  });
  return result;
}

/**
 * 生成导入模板（.xlsx buffer）
 * @param {'students'|'grades'|'grades-long'} type
 *  - students：姓名/性别/家长联系方式（学生名单）
 *  - grades：宽表「姓名 + 各科成绩」
 *  - grades-long：长表「姓名/科目/分数」
 */
export function buildTemplate(type = 'students') {
  const wb = XLSX.utils.book_new();

  if (type === 'grades-long') {
    const rows = [
      ['姓名', '科目', '分数'],
      ['张三', '语文', 92],
      ['张三', '数学', 88],
      ['李四', '语文', 85],
      ['李四', '数学', 95],
      ['王五', '英语', 90],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, '成绩长表');
  } else if (type === 'grades') {
    const rows = [
      ['姓名', '语文', '数学', '英语'],
      ['张三', 92, 88, 95],
      ['李四', 85, 95, 90],
      ['王五', 78, 82, 88],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, '成绩宽表');
  } else {
    const rows = [
      ['姓名', '性别', '家长联系方式'],
      ['张三', '男', '13800000000'],
      ['李四', '女', '13900000000'],
      ['王五', '男', '13700000000'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, '学生名单');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
