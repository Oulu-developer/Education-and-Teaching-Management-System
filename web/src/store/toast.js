/**
 * 全局轻提示（独立于 api，避免循环依赖）
 */
import { reactive } from 'vue';

export const toasts = reactive([]);
let seed = 0;

export function toast(message, type = 'info', duration = 3200) {
  const id = ++seed;
  toasts.push({ id, message: String(message || ''), type });
  window.setTimeout(() => {
    const index = toasts.findIndex((item) => item.id === id);
    if (index >= 0) toasts.splice(index, 1);
  }, duration);
}

export const toastSuccess = (message) => toast(message, 'success');
export const toastError = (message) => toast(message, 'error');
