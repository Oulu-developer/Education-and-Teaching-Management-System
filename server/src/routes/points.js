/**
 * 荣誉积分路由
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/pointsService.js';

const router = Router();

router.get('/ranking', asyncHandler(async (req, res) => ok(res, await service.getRanking(req.query.classId))));
router.get('/history', asyncHandler(async (req, res) => ok(res, await service.getHistory(req.query.studentId))));
router.post('/', asyncHandler(async (req, res) => ok(res, await service.addPoints(req.body), '积分已记录')));

export default router;
