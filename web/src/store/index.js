/**
 * 轻量全局状态：业务字典、云服务 publicConfig（供前端 OCR 视觉大模型调用）
 * 字典统一取后端 /api/meta；服务不可达时用内置兜底值，保证页面不白屏。
 */
import { reactive, computed } from 'vue';
import { api } from '../api/index.js';

export const DEFAULT_META = {
  grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三', '大一', '大二', '大三', '大四'],
  weekdays: [
    { value: 1, label: '周一' }, { value: 2, label: '周二' }, { value: 3, label: '周三' },
    { value: 4, label: '周四' }, { value: 5, label: '周五' }, { value: 6, label: '周六' },
    { value: 7, label: '周日' },
  ],
  periods: 8,
  classes: [],
  examLink: '',
  cloud: null,
  dbReady: false,
};

export const store = reactive({ meta: null });

/** 组件中通过 meta.value.xxx 使用 */
export const meta = computed(() => store.meta || DEFAULT_META);

let metaPromise = null;
export function loadMeta(force = false) {
  if (force) {
    metaPromise = null;
    store.meta = null;
  }
  if (!metaPromise) {
    metaPromise = api.meta()
      .then((data) => { store.meta = data; return data; })
      .catch(() => { metaPromise = null; return DEFAULT_META; });
  }
  return metaPromise;
}

/** 年级标签（用于班级分组展示） */
export function gradeLabel(grade) {
  return grade || '';
}

/** 星期标签 */
export function weekdayLabel(value) {
  const w = meta.value.weekdays.find((item) => item.value === Number(value));
  return w ? w.label : String(value);
}
