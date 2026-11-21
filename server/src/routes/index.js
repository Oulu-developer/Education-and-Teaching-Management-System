/**
 * API 总路由 /api
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import { GRADES, WEEKDAYS, PERIODS, config } from '../config/index.js';
import { listClasses } from '../services/classService.js';
import { classRouter, studentRouter } from './classes.js';
import dashboardRouter from './dashboard.js';
import scheduleRouter from './schedule.js';
import pointsRouter from './points.js';
import gradesRouter from './grades.js';
import newsRouter from './news.js';
import importRouter from './import.js';

const router = Router();

/**
 * 业务字典：前端只依赖此接口，避免前后端字典重复维护。
 * 同时下发 cloud publicConfig（公开值）供前端初始化 SDK 调用免密钥视觉大模型（课表 OCR）。
 * 数据库未就绪时仍返回静态字典，页面不白屏，dbReady 用于提示。
 */
router.get('/meta', asyncHandler(async (req, res) => {
  let dbReady = true;
  let classes = [];
  try {
    classes = await listClasses();
  } catch {
    dbReady = false;
  }
  ok(res, {
    grades: GRADES,
    weekdays: WEEKDAYS,
    periods: PERIODS,
    classes,
    examLink: config.examLink,
    cloud: config.cloud,
    dbReady,
  });
}));

router.use('/classes', classRouter);
router.use('/students', studentRouter);
router.use('/dashboard', dashboardRouter);
router.use('/schedule', scheduleRouter);
router.use('/points', pointsRouter);
router.use('/grades', gradesRouter);
router.use('/news', newsRouter);
router.use('/import', importRouter);

export default router;
