/**
 * 文件导入路由：上传 Excel/CSV 解析学生名单或成绩
 */
import { Router } from 'express';
import multer from 'multer';
import { ok, asyncHandler, AppError } from '../utils/response.js';
import { parseStudents, parseGrades, buildTemplate } from '../services/importService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(xlsx|xls|csv)$/i.test(file.originalname || '')) cb(null, true);
    else cb(new AppError('仅支持 .xlsx / .xls / .csv 格式'));
  },
});

const router = Router();

/** 下载导入模板（.xlsx） */
router.get('/template', asyncHandler(async (req, res) => {
  const type = req.query.type === 'grades' || req.query.type === 'grades-long' ? req.query.type : 'students';
  const buf = buildTemplate(type);
  const names = { students: '学生名单导入模板.xlsx', grades: '成绩导入模板.xlsx', 'grades-long': '成绩导入模板-长表.xlsx' };
  const filename = encodeURIComponent(names[type]);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(buf);
}));

/** 解析学生名单文件 */
router.post('/students', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('请选择文件');
  const students = parseStudents(req.file.buffer);
  ok(res, { total: students.length, students }, `解析完成：共 ${students.length} 名学生`);
}));

/** 解析成绩文件 */
router.post('/grades', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('请选择文件');
  const rows = parseGrades(req.file.buffer);
  ok(res, { total: rows.length, rows }, `解析完成：共 ${rows.length} 条成绩`);
}));

export default router;
