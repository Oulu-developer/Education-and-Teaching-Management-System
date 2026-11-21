/**
 * 学生成绩路由
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/gradeService.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => ok(res, await service.listGrades(req.query.classId, req.query.examName))));
router.get('/exam-names', asyncHandler(async (req, res) => ok(res, await service.listExamNames(req.query.classId))));
router.get('/exam-types', asyncHandler(async (req, res) => ok(res, await service.listExamTypes())));
router.post('/exam-types', asyncHandler(async (req, res) => ok(res, await service.createExamType(req.body.name), '考试类型已添加')));
router.delete('/exam-types/:name', asyncHandler(async (req, res) => ok(res, await service.deleteExamType(req.params.name), '考试类型已删除')));
router.post('/batch', asyncHandler(async (req, res) => ok(res, await service.batchCreateGrades(req.body.classId, req.body.examName, req.body.rows), '成绩已导入')));
router.delete('/:id', asyncHandler(async (req, res) => ok(res, await service.deleteGrade(req.params.id), '成绩已删除')));

export default router;
