/**
 * 通用工具函数
 */

/** 整数收敛：非法/越界时回退到 fallback，并夹在 [min, max] 之间 */
export function clampInt(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** 安全解析 JSON 字符串，失败返回 fallback */
export function parseJson(str, fallback = null) {
  if (str == null) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/** 归一化数值：非法返回 fallback */
export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** 今天日期字符串 YYYY-MM-DD（本地时区） */
export function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * 距离目标日期的剩余天数（正数=未来，负数=已过去，0=今天）。
 * 入参为 YYYY-MM-DD 字符串，按本地时区计算。
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** 数字转中文，用于分数保留一位小数的展示（纯数字，直接返回） */
export function formatScore(score) {
  const n = toNumber(score);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
