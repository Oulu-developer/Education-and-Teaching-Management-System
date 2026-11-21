/**
 * 课表路由
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/scheduleService.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => ok(res, await service.getSchedule(req.query.classId))));
router.post('/', asyncHandler(async (req, res) => ok(res, await service.saveSchedule(req.body.classId, req.body.cells), '课表已保存')));
router.put('/:id', asyncHandler(async (req, res) => ok(res, await service.updateCell(req.params.id, req.body), '课表已更新')));

export default router;
