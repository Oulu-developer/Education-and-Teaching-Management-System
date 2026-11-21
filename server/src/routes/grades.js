/**
 * 学生成绩路由
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/gradeService.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => ok(res, await service.listGrades(req.query.classId, req.query.examName))));
router.get('/exam-names', asyncHandler(async (req, res) => ok(res, await service.listExamNames(req.query.classId))));
router.post('/batch', asyncHandler(async (req, res) => ok(res, await service.batchCreateGrades(req.body.classId, req.body.examName, req.body.rows), '成绩已导入')));
router.delete('/:id', asyncHandler(async (req, res) => ok(res, await service.deleteGrade(req.params.id), '成绩已删除')));

export default router;
