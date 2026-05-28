<template>
  <section class="stats" aria-label="统计信息">
    <article v-for="item in items" :key="item.label" class="stats-card">
      <span class="label">{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </section>
</template>

<script>
export default {
  name: 'StatsGrid',
  props: {
    items: {
      type: Array,
      required: true
    }
  }
};
</script>
