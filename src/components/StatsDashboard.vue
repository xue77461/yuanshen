<template>
  <section class="stats-dashboard">
    <div class="overview-grid">
      <article v-for="item in summaryCards" :key="item.label" class="overview-card">
        <span class="overview-icon">
          <UiIcon :name="item.icon" size="lg" />
        </span>
        <div class="overview-copy">
          <span class="overview-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.helper }}</small>
        </div>
      </article>
    </div>

    <div class="analytics-layout">
      <article class="analytics-panel analytics-panel-wide">
        <div class="analytics-head">
          <div>
            <h3>
              <UiIcon name="coin" size="sm" />
              近7日结束收入走势
            </h3>
            <p>按结束时间统计每日已结束订单收入</p>
          </div>
          <span class="analytics-chip">{{ displayAmount(weeklyIncomeTotal) }}</span>
        </div>

        <div v-if="hasDailyIncome" class="line-chart-shell">
          <svg viewBox="0 0 640 220" class="line-chart" role="img" aria-label="近7日结束收入折线图">
            <defs>
              <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(213, 103, 152, 0.36)" />
                <stop offset="100%" stop-color="rgba(213, 103, 152, 0.02)" />
              </linearGradient>
            </defs>
            <line
              v-for="row in chartGridRows"
              :key="row"
              x1="18"
              :y1="row"
              x2="622"
              :y2="row"
              class="chart-grid-line"
            />
            <polygon :points="areaPoints" class="chart-area" />
            <polyline :points="linePoints" class="chart-line" />
            <circle
              v-for="point in chartPoints"
              :key="point.label"
              :cx="point.x"
              :cy="point.y"
              r="4.5"
              class="chart-dot"
            />
          </svg>

          <div class="line-chart-footer">
            <article v-for="item in dailyIncomeSeries" :key="item.key" class="line-chart-meta">
              <span>{{ item.label }}</span>
              <strong>{{ displayCompactAmount(item.value) }}</strong>
            </article>
          </div>
        </div>
        <div v-else class="analytics-empty">最近 7 天还没有已结束订单收入。</div>
      </article>

      <article class="analytics-panel">
        <div class="analytics-head">
          <div>
            <h3>
              <UiIcon name="all" size="sm" />
              订单状态圆形图
            </h3>
            <p>按订单数量查看当前状态分布</p>
          </div>
        </div>

        <div class="donut-layout">
          <div class="donut-chart" :style="{ background: donutBackground }">
            <div class="donut-center">
              <strong>{{ orders.length }}</strong>
              <span>总订单</span>
            </div>
          </div>

          <ul class="donut-legend">
            <li v-for="item in statusSegments" :key="item.label" class="donut-legend-item">
              <span class="donut-dot" :style="{ background: item.color }"></span>
              <div>
                <strong>{{ item.label }}</strong>
                <span>{{ item.value }} 单 · {{ item.percent }}%</span>
              </div>
            </li>
          </ul>
        </div>
      </article>

      <article class="analytics-panel">
        <div class="analytics-head">
          <div>
            <h3>
              <UiIcon name="calendar" size="sm" />
              近6个月结束收入
            </h3>
            <p>按月查看已结束订单的收入变化</p>
          </div>
        </div>

        <div v-if="hasMonthlyIncome" class="month-bars">
          <article v-for="item in monthlyIncomeSeries" :key="item.key" class="month-bar-row">
            <div class="month-bar-head">
              <span>{{ item.label }}</span>
              <strong>{{ displayAmount(item.value) }}</strong>
            </div>
            <div class="month-bar-track">
              <span class="month-bar-fill" :style="{ width: getMonthlyBarWidth(item.value) }"></span>
            </div>
          </article>
        </div>
        <div v-else class="analytics-empty">最近 6 个月还没有已结束订单收入。</div>
      </article>
    </div>
  </section>
</template>

<script>
import UiIcon from '@/components/UiIcon.vue';
import { formatIncome, normalizeIncome, parseLocalDateTime } from '@/utils/order';

const STATUS_PENDING = '待开始';
const STATUS_FINISHED = '结束';
const STATUS_CANCELLED = '取消';
const dayMs = 24 * 60 * 60 * 1000;
const donutPalette = {
  [STATUS_PENDING]: '#f0b35e',
  [STATUS_FINISHED]: '#6fc895',
  [STATUS_CANCELLED]: '#df7e92'
};

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function buildMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export default {
  name: 'StatsDashboard',
  components: {
    UiIcon
  },
  props: {
    orders: {
      type: Array,
      required: true
    },
    showIncome: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    finishedOrders() {
      return this.orders.filter((item) => item.状态 === STATUS_FINISHED && parseLocalDateTime(item.结束时间));
    },
    pendingAmount() {
      return this.orders
        .filter((item) => item.状态 === STATUS_PENDING)
        .reduce((sum, item) => sum + normalizeIncome(item.收入), 0);
    },
    todayFinishedIncome() {
      const today = new Date();
      return this.finishedOrders.reduce((sum, item) => {
        const finishedAt = parseLocalDateTime(item.结束时间);
        return finishedAt && isSameDay(finishedAt, today) ? sum + normalizeIncome(item.收入) : sum;
      }, 0);
    },
    monthFinishedIncome() {
      const today = new Date();
      return this.finishedOrders.reduce((sum, item) => {
        const finishedAt = parseLocalDateTime(item.结束时间);
        return finishedAt && isSameMonth(finishedAt, today) ? sum + normalizeIncome(item.收入) : sum;
      }, 0);
    },
    monthFinishedCount() {
      const today = new Date();
      return this.finishedOrders.filter((item) => {
        const finishedAt = parseLocalDateTime(item.结束时间);
        return finishedAt && isSameMonth(finishedAt, today);
      }).length;
    },
    summaryCards() {
      return [
        {
          label: '待开始金额',
          value: this.displayAmount(this.pendingAmount),
          helper: '待开始订单的累计待收金额',
          icon: 'pending'
        },
        {
          label: '今日结束收入',
          value: this.displayAmount(this.todayFinishedIncome),
          helper: '今日已结束订单带来的收入',
          icon: 'coin'
        },
        {
          label: '本月结束收入',
          value: this.displayAmount(this.monthFinishedIncome),
          helper: '本月所有已结束订单收入',
          icon: 'calendar'
        },
        {
          label: '本月结束单数',
          value: `${this.monthFinishedCount} 单`,
          helper: '本月已完成并结束的订单数量',
          icon: 'finished'
        }
      ];
    },
    dailyIncomeSeries() {
      const today = new Date();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      const bucket = new Map();

      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start.getTime() + index * dayMs);
        bucket.set(buildDayKey(date), {
          key: buildDayKey(date),
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          value: 0
        });
        return date;
      });

      this.finishedOrders.forEach((item) => {
        const finishedAt = parseLocalDateTime(item.结束时间);
        if (!finishedAt || finishedAt < start || finishedAt > end) {
          return;
        }
        const key = buildDayKey(finishedAt);
        const current = bucket.get(key);
        if (current) {
          current.value += normalizeIncome(item.收入);
        }
      });

      return Array.from(bucket.values());
    },
    weeklyIncomeTotal() {
      return this.dailyIncomeSeries.reduce((sum, item) => sum + item.value, 0);
    },
    hasDailyIncome() {
      return this.dailyIncomeSeries.some((item) => item.value > 0);
    },
    monthlyIncomeSeries() {
      const today = new Date();
      const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
        return {
          key: buildMonthKey(date),
          label: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
          value: 0
        };
      });
      const bucket = new Map(months.map((item) => [item.key, item]));

      this.finishedOrders.forEach((item) => {
        const finishedAt = parseLocalDateTime(item.结束时间);
        if (!finishedAt) {
          return;
        }
        const current = bucket.get(buildMonthKey(finishedAt));
        if (current) {
          current.value += normalizeIncome(item.收入);
        }
      });

      return months;
    },
    hasMonthlyIncome() {
      return this.monthlyIncomeSeries.some((item) => item.value > 0);
    },
    maxMonthlyIncome() {
      return Math.max(...this.monthlyIncomeSeries.map((item) => item.value), 0);
    },
    statusSegments() {
      const total = this.orders.length || 1;
      return [STATUS_PENDING, STATUS_FINISHED, STATUS_CANCELLED].map((status) => {
        const value = this.orders.filter((item) => item.状态 === status).length;
        return {
          label: status,
          value,
          color: donutPalette[status],
          percent: Math.round((value / total) * 100)
        };
      });
    },
    donutBackground() {
      const total = this.statusSegments.reduce((sum, item) => sum + item.value, 0);
      if (!total) {
        return 'conic-gradient(rgba(216, 93, 148, 0.12) 0deg 360deg)';
      }

      let start = 0;
      const parts = this.statusSegments.map((item) => {
        const angle = (item.value / total) * 360;
        const end = start + angle;
        const part = `${item.color} ${start}deg ${end}deg`;
        start = end;
        return part;
      });
      return `conic-gradient(${parts.join(', ')})`;
    },
    chartGeometry() {
      const width = 640;
      const height = 220;
      const paddingX = 18;
      const top = 20;
      const bottom = 34;
      const baseY = height - bottom;
      const maxValue = Math.max(...this.dailyIncomeSeries.map((item) => item.value), 1);
      const spanX = width - paddingX * 2;
      const spanY = baseY - top;
      const divisor = Math.max(this.dailyIncomeSeries.length - 1, 1);
      const points = this.dailyIncomeSeries.map((item, index) => ({
        ...item,
        x: paddingX + (spanX * index) / divisor,
        y: baseY - (item.value / maxValue) * spanY
      }));

      return {
        top,
        baseY,
        points
      };
    },
    chartPoints() {
      return this.chartGeometry.points;
    },
    linePoints() {
      return this.chartPoints.map((item) => `${item.x},${item.y}`).join(' ');
    },
    areaPoints() {
      if (!this.chartPoints.length) {
        return '';
      }

      const first = this.chartPoints[0];
      const last = this.chartPoints[this.chartPoints.length - 1];
      return `${first.x},${this.chartGeometry.baseY} ${this.linePoints} ${last.x},${this.chartGeometry.baseY}`;
    },
    chartGridRows() {
      const span = this.chartGeometry.baseY - this.chartGeometry.top;
      return Array.from({ length: 4 }, (_, index) => this.chartGeometry.top + (span * index) / 3);
    }
  },
  methods: {
    displayAmount(value) {
      return this.showIncome ? formatIncome(value) : '******';
    },
    displayCompactAmount(value) {
      if (!this.showIncome) {
        return '***';
      }

      if (value >= 10000) {
        return `¥${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}w`;
      }

      return `¥${Math.round(value)}`;
    },
    getMonthlyBarWidth(value) {
      if (!value || !this.maxMonthlyIncome) {
        return '0%';
      }
      return `${Math.max((value / this.maxMonthlyIncome) * 100, 14)}%`;
    }
  }
};
</script>

<style scoped>
.stats-dashboard {
  display: grid;
  gap: 14px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-card,
.analytics-panel {
  border: 1px solid rgba(211, 128, 165, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 38px rgba(213, 103, 152, 0.08);
  backdrop-filter: blur(14px);
}

.overview-card {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
}

.overview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: rgba(255, 240, 247, 0.9);
  color: #d56798;
}

.overview-copy {
  display: grid;
  gap: 4px;
}

.overview-label {
  color: #9c7286;
  font-size: 12px;
}

.overview-copy strong {
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: clamp(20px, 2vw, 30px);
  color: #4b2f40;
}

.overview-copy small {
  color: #9c7286;
  font-size: 11px;
  line-height: 1.6;
}

.analytics-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.analytics-panel {
  padding: 18px;
}

.analytics-panel-wide {
  grid-column: 1 / -1;
}

.analytics-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.analytics-head h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  color: #4b2f40;
}

.analytics-head h3 :deep(.ui-icon) {
  color: #d56798;
}

.analytics-head p {
  margin: 4px 0 0;
  color: #9c7286;
  font-size: 12px;
  line-height: 1.6;
}

.analytics-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(216, 93, 148, 0.08);
  color: #d56798;
  font-size: 12px;
  font-weight: 700;
}

.line-chart-shell {
  display: grid;
  gap: 12px;
}

.line-chart {
  width: 100%;
  height: auto;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 243, 249, 0.75), rgba(255, 255, 255, 0.6));
}

.chart-grid-line {
  stroke: rgba(211, 128, 165, 0.16);
  stroke-width: 1;
}

.chart-area {
  fill: url(#line-fill);
}

.chart-line {
  fill: none;
  stroke: #d56798;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-dot {
  fill: #ffffff;
  stroke: #d56798;
  stroke-width: 3;
}

.line-chart-footer {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.line-chart-meta {
  padding: 10px 8px;
  border-radius: 14px;
  background: rgba(255, 247, 251, 0.78);
  text-align: center;
}

.line-chart-meta span,
.line-chart-meta strong {
  display: block;
}

.line-chart-meta span {
  color: #9c7286;
  font-size: 11px;
}

.line-chart-meta strong {
  margin-top: 4px;
  color: #4b2f40;
  font-size: 12px;
}

.donut-layout {
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr;
  gap: 18px;
  align-items: center;
}

.donut-chart {
  position: relative;
  width: min(220px, 100%);
  aspect-ratio: 1;
  border-radius: 50%;
  justify-self: center;
}

.donut-chart::after {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
}

.donut-center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  text-align: center;
}

.donut-center strong {
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: clamp(28px, 3vw, 34px);
  color: #4b2f40;
}

.donut-center span {
  color: #9c7286;
  font-size: 12px;
}

.donut-legend {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.donut-legend-item {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 10px;
  align-items: center;
}

.donut-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.donut-legend-item strong,
.donut-legend-item span {
  display: block;
}

.donut-legend-item strong {
  color: #4b2f40;
  font-size: 13px;
}

.donut-legend-item span {
  margin-top: 2px;
  color: #9c7286;
  font-size: 11px;
}

.month-bars {
  display: grid;
  gap: 12px;
}

.month-bar-row {
  display: grid;
  gap: 8px;
}

.month-bar-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: #4b2f40;
  font-size: 12px;
}

.month-bar-head span {
  color: #9c7286;
}

.month-bar-head strong {
  font-size: 12px;
}

.month-bar-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: rgba(216, 93, 148, 0.08);
  overflow: hidden;
}

.month-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #d56798, #ef99bb);
}

.analytics-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  border-radius: 18px;
  background: rgba(255, 247, 251, 0.72);
  color: #9c7286;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .analytics-layout {
    grid-template-columns: 1fr;
  }

  .analytics-panel-wide {
    grid-column: auto;
  }

  .donut-layout {
    grid-template-columns: 1fr;
  }

  .line-chart-footer {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-card {
    grid-template-columns: 46px 1fr;
    padding: 14px;
  }

  .line-chart-footer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>