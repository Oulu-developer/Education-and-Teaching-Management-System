/**
 * 统一响应结构与错误处理
 * 约定：成功 { code: 0, message: 'ok', data }；失败 { code: httpStatus, message, data }
 */

/** 业务异常，可携带 HTTP 状态码与附加明细 */
export class AppError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export const ok = (res, data = null, message = 'ok') =>
  res.json({ code: 0, message, data });

/** 包裹 async 路由，自动把异常交给错误中间件 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFoundMiddleware(req, res) {
  res.status(404).json({ code: 404, message: `接口不存在：${req.method} ${req.originalUrl}`, data: null });
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
  const status = err instanceof AppError ? err.status : 500;
  if (status >= 500) {
    console.error('[ERROR]', req.method, req.originalUrl, err);
  }
  let message = err.message || '服务器内部错误';
  if (err.name === 'MulterError') {
    // 文件上传相关错误（如超出大小限制）
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? '文件过大，最大支持 5MB' : '文件上传失败';
  } else if (!(err instanceof AppError) && status === 500) {
    message = '服务器内部错误，请查看服务端日志';
  }
  res.status(status).json({
    code: status,
    message,
    data: err instanceof AppError ? err.details : null,
  });
}
