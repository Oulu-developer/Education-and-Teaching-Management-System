<script setup>
/**
 * 智能组卷：以超链接形式集成独立的智能组卷系统
 */
import { meta } from '../store/index.js';
</script>

<template>
  <div class="card">
    <div class="card-body" style="text-align:center; padding: 70px 24px;">
      <div style="font-size:44px; font-weight:700; color:var(--primary-dark)">智能组卷</div>
      <p class="hint mt-14" style="max-width:460px; margin:14px auto 0; font-size:13px">
        智能组卷是独立的子系统，提供题库管理、自动抽题、试卷预览与 Word 导出等功能。
        点击下方按钮即可跳转到组卷系统。
      </p>
      <a
        :href="meta.examLink || '#'"
        target="_blank"
        rel="noopener"
        class="btn btn-primary mt-18"
        style="font-size:16px; padding:13px 30px;"
      >前往智能组卷 →</a>
      <div v-if="!meta.examLink" class="hint mt-14">未配置组卷链接，请联系管理员。</div>
    </div>
  </div>
</template>
