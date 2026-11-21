/**
 * 首页概览路由：格言、待办、考试、首页聚合
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/dashboardService.js';

const router = Router();

router.get('/summary', asyncHandler(async (req, res) => ok(res, await service.summary())));

/* 每日格言 */
router.get('/quotes', asyncHandler(async (req, res) => ok(res, await service.listQuotes())));
router.post('/quotes', asyncHandler(async (req, res) => ok(res, await service.createQuote(req.body), '格言已添加')));
router.delete('/quotes/:id', asyncHandler(async (req, res) => ok(res, await service.deleteQuote(req.params.id), '格言已删除')));

/* 今日待办 */
router.get('/todos', asyncHandler(async (req, res) => ok(res, await service.listTodos())));
router.post('/todos', asyncHandler(async (req, res) => ok(res, await service.createTodo(req.body), '待办已添加')));
router.put('/todos/:id', asyncHandler(async (req, res) => ok(res, await service.updateTodo(req.params.id, req.body), '待办已更新')));
router.delete('/todos/:id', asyncHandler(async (req, res) => ok(res, await service.deleteTodo(req.params.id), '待办已删除')));

/* 考试倒计时 */
router.get('/exams', asyncHandler(async (req, res) => ok(res, await service.listExams())));
router.post('/exams', asyncHandler(async (req, res) => ok(res, await service.createExam(req.body), '考试已添加')));
router.put('/exams/:id', asyncHandler(async (req, res) => ok(res, await service.updateExam(req.params.id, req.body), '考试已更新')));
router.delete('/exams/:id', asyncHandler(async (req, res) => ok(res, await service.deleteExam(req.params.id), '考试已删除')));

export default router;
