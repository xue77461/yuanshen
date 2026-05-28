<template>
  <section class="hero">
    <article class="hero-card">
      <div class="hero-layout">
        <div class="hero-copy">
          <span class="eyebrow">Order Magical Mode</span>
          <h1>原神代练接单管理</h1>
          <div class="actions">
            <button class="button primary" type="button" :disabled="!canCreate" @click="$emit('create')">
              新增订单
            </button>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <span class="hero-spark one"></span>
          <span class="hero-spark two"></span>
          <span class="hero-spark three"></span>
          <div class="mascot-shadow"></div>
          <div class="mascot">
            <div class="mascot-ribbon"></div>
            <div class="mascot-hair"></div>
            <div class="mascot-fringe"></div>
            <div class="mascot-head">
              <span class="mascot-eye left"></span>
              <span class="mascot-eye right"></span>
              <span class="mascot-blush left"></span>
              <span class="mascot-blush right"></span>
              <span class="mascot-mouth"></span>
            </div>
            <div class="mascot-body">
              <span class="mascot-collar"></span>
              <span class="mascot-skirt"></span>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script>
export default {
  name: 'HeroBanner',
  props: {
    canCreate: {
      type: Boolean,
      default: false
    }
  }
};
</script>
