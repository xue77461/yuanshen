<template>
  <section class="stats" aria-label="统计信息">
    <article v-for="item in items" :key="item.label" :class="['stats-card', item.tone, { interactive: Boolean(item.action) }]">
      <span class="stats-icon">
        <UiIcon :name="item.icon || 'sparkles'" size="lg" />
      </span>
      <div class="stats-copy">
        <span class="label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.helper }}</small>
        <button v-if="item.action" class="stats-action" type="button" @click="$emit('action', item.action)">
          {{ item.actionLabel }}
        </button>
      </div>
    </article>
  </section>
</template>

<script>
import UiIcon from '@/components/UiIcon.vue';

export default {
  name: 'StatsGrid',
  components: {
    UiIcon
  },
  props: {
    items: {
      type: Array,
      required: true
    }
  }
};
</script>
