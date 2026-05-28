<template>
  <div :class="['toast', tone, { show: visible }]" role="status" aria-live="polite">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'ToastMessage',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    tone: {
      type: String,
      default: 'success'
    }
  }
};
</script>
