<script setup>
/**
 * 通用弹窗：支持标题、宽度、底部操作插槽
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '640px' },
});
const emit = defineEmits(['update:modelValue', 'close']);

function close() {
  emit('update:modelValue', false);
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-mask" @click.self="close">
      <div class="modal" :style="{ maxWidth: width }">
        <div class="modal-head">
          <h3>{{ title }}</h3>
          <button type="button" class="icon-btn" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
