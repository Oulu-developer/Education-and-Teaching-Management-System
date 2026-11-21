/**
 * 时政热点路由（懒加载抓取）
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/newsService.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => ok(res, await service.getTodayNews())));

export default router;
