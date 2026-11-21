/**
 * 班级与学生路由（两个独立挂载点：/classes 与 /students）
 */
import { Router } from 'express';
import { ok, asyncHandler } from '../utils/response.js';
import * as service from '../services/classService.js';

export const classRouter = Router();
export const studentRouter = Router();

/* 班级 */
classRouter.get('/', asyncHandler(async (req, res) => ok(res, await service.listClasses())));
classRouter.post('/', asyncHandler(async (req, res) => ok(res, await service.createClass(req.body), '班级已创建')));
classRouter.put('/:id', asyncHandler(async (req, res) => ok(res, await service.updateClass(req.params.id, req.body), '班级已更新')));
classRouter.delete('/:id', asyncHandler(async (req, res) => ok(res, await service.deleteClass(req.params.id), '班级已删除')));

/* 学生 */
studentRouter.get('/', asyncHandler(async (req, res) => ok(res, await service.listStudents(req.query.classId))));
studentRouter.post('/', asyncHandler(async (req, res) => ok(res, await service.createStudent(req.body), '学生已添加')));
studentRouter.put('/:id', asyncHandler(async (req, res) => ok(res, await service.updateStudent(req.params.id, req.body), '学生已更新')));
studentRouter.delete('/:id', asyncHandler(async (req, res) => ok(res, await service.deleteStudent(req.params.id), '学生已删除')));
