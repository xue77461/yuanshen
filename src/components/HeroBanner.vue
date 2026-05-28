<template>
  <section class="hero">
    <article class="hero-card">
      <div class="hero-layout">
        <div class="hero-copy">
          <span class="eyebrow">
            <UiIcon name="sparkles" size="sm" />
            Teyvat Dispatch Board
          </span>
          <h1>原神代练接单管理</h1>
          <p class="hero-desc">
            把派蒙的待开始提醒、芙宁娜的预约排期和胡桃的冲刺收尾统一收进一个委托工作台里。
          </p>
          <div class="hero-highlights">
            <span class="hero-pill">
              <UiIcon name="pending" size="sm" />
              待开始优先
            </span>
            <span class="hero-pill">
              <UiIcon name="calendar" size="sm" />
              日历排期
            </span>
            <span class="hero-pill">
              <UiIcon name="coin" size="sm" />
              收入同步统计
            </span>
          </div>
          <div class="actions">
            <button class="button primary" type="button" :disabled="!canCreate" @click="$emit('create')">
              <UiIcon name="sparkles" size="sm" />
              新增订单
            </button>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <span class="vision-ring"></span>
          <span class="vision-sigil sigil-top">
            <UiIcon name="guide" size="lg" />
          </span>
          <span class="vision-sigil sigil-left">
            <UiIcon name="hydro" size="lg" />
          </span>
          <span class="vision-sigil sigil-right">
            <UiIcon name="pyro" size="lg" />
          </span>

          <article v-for="role in featuredRoles" :key="role.name" :class="['character-card', role.theme]">
            <div class="character-emblem">
              <UiIcon :name="role.icon" size="xl" />
            </div>
            <div class="character-copy">
              <strong>{{ role.name }}</strong>
              <span>{{ role.title }}</span>
              <p>{{ role.summary }}</p>
            </div>
          </article>
        </div>
      </div>
    </article>
  </section>
</template>

<script>
import UiIcon from '@/components/UiIcon.vue';

export default {
  name: 'HeroBanner',
  components: {
    UiIcon
  },
  props: {
    canCreate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      featuredRoles: [
        {
          name: '派蒙',
          title: '向导总览位',
          summary: '优先盯住待开始委托，补空档、追进度都更顺手。',
          icon: 'guide',
          theme: 'guide'
        },
        {
          name: '芙宁娜',
          title: '档期管理位',
          summary: '预约时间直接映射到日历，排班冲突一眼就能看清。',
          icon: 'hydro',
          theme: 'hydro'
        },
        {
          name: '胡桃',
          title: '冲刺收尾位',
          summary: '结束、取消和重新开始切换更明确，处理尾单不再打结。',
          icon: 'pyro',
          theme: 'pyro'
        }
      ]
    };
  }
};
</script>
