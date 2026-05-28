<template>
  <article class="calendar-shell">
    <div class="section-head">
      <div>
        <h2 class="section-title-with-icon">
          <UiIcon name="calendar" size="sm" />
          <span>时间管理</span>
        </h2>
        <p>{{ summary }}</p>
      </div>
      <div class="calendar-controls">
        <button class="button secondary small" type="button" @click="$emit('prev')">
          <UiIcon name="left" size="sm" />
          上月
        </button>
        <strong class="calendar-month-label">{{ monthLabel }}</strong>
        <button class="button ghost small" type="button" @click="$emit('today')">
          <UiIcon name="traveler" size="sm" />
          本月
        </button>
        <button class="button secondary small" type="button" @click="$emit('next')">
          下月
          <UiIcon name="right" size="sm" />
        </button>
      </div>
    </div>

    <div class="calendar-scroll">
      <div class="calendar-board">
        <div class="calendar-weekdays">
          <span>星期一</span>
          <span>星期二</span>
          <span>星期三</span>
          <span>星期四</span>
          <span>星期五</span>
          <span>星期六</span>
          <span>星期日</span>
        </div>
        <div class="calendar-grid">
          <article
            v-for="day in days"
            :key="day.key"
            :class="['calendar-day', { outside: !day.isCurrentMonth, today: day.isToday, busy: day.itemsCount > 0 }]"
          >
            <div class="calendar-day-head">
              <div class="calendar-day-meta">
                <strong class="calendar-day-number">{{ day.dateNumber }}</strong>
                <span class="calendar-day-sub">{{ day.daySub }}</span>
              </div>
              <button
                class="button calendar-add"
                type="button"
                :disabled="!canCreate"
                :aria-label="`在 ${day.key} 新建订单`"
                @click="$emit('create', day.key)"
              >
                <UiIcon name="plus" size="sm" />
              </button>
            </div>
            <div class="calendar-event-list">
              <button
                v-for="item in day.previewItems"
                :key="item.id"
                :class="['calendar-event', item.eventClass]"
                type="button"
                @click="$emit('open', item.id)"
              >
                <span class="calendar-event-time">{{ item.timeLabel }}</span>
                <span class="calendar-event-title">{{ item.微信名 }}</span>
                <span class="calendar-event-stage">{{ item.关卡 }}</span>
              </button>
              <span v-if="!day.previewItems.length" class="calendar-empty">当天暂无预约</span>
              <div v-if="day.moreCount > 0" class="calendar-more">还有 {{ day.moreCount }} 条预约...</div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import UiIcon from '@/components/UiIcon.vue';

export default {
  name: 'CalendarBoard',
  components: {
    UiIcon
  },
  props: {
    days: {
      type: Array,
      required: true
    },
    monthLabel: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    canCreate: {
      type: Boolean,
      default: false
    }
  }
};
</script>
