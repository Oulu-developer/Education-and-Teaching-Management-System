/**
 * 服务入口
 * 单端口部署：Express 同时提供 REST API 与前端静态页面（build 产物位于 server/public）。
 * 监听 process.env.PORT（发布环境注入）并绑定 0.0.0.0。
 */
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import router from './routes/index.js';
import { ok, notFoundMiddleware, errorMiddleware } from './utils/response.js';

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, '../public');

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// 健康检查：不依赖数据库，便于部署探活与联调排障
app.get('/api/health', (req, res) => ok(res, {
  service: 'edu-management-server',
  time: new Date().toISOString(),
  database: 'cloud-service',
}));

app.use('/api', router);

// 托管前端构建产物（前后端同源，单端口）
app.use(express.static(publicDir));

// SPA 回退：非 /api 的 GET 请求统一返回 index.html，支持前端路由刷新
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`✓ 教育教学管理系统服务已启动：http://localhost:${config.port}`);
  console.log(`  云数据库：${config.cloud.endpoint}`);
  console.log(`  智能组卷链接：${config.examLink}`);
});

export default app;
