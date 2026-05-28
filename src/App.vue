<template>
  <main class="page">
    <section v-if="showAccessGate" class="entry-shell">
      <article class="entry-card">
        <div class="section-head">
          <div>
            <h2>连接飞书表格</h2>
            <p class="modal-desc">
              首次进入先填写 App ID、App Secret 和 spreadsheetToken。验证通过后再进入订单工作区。
            </p>
          </div>
          <span :class="['sync-status', syncTone]">{{ syncStatusText }}</span>
        </div>

        <form class="stack" @submit.prevent="handleAccessSubmit">
          <label>
            App ID
            <input v-model.trim="accessForm.appId" type="text" placeholder="例如：cli_xxx" required>
          </label>

          <label>
            App Secret
            <input v-model.trim="accessForm.appSecret" type="password" placeholder="请输入飞书应用的 App Secret" required>
          </label>

          <label>
            spreadsheetToken
            <input v-model.trim="accessForm.spreadsheetInput" type="text" placeholder="飞书表格分享链接或 spreadsheetToken" required>
          </label>

          <p class="field-tip">
            可直接粘贴飞书表格分享链接，系统会自动提取 spreadsheetToken；sheetId 会在首次连接时自动取第一个工作表。
          </p>

          <div class="actions">
            <button class="button primary" type="submit" :disabled="isAccessSubmitting">
              {{ isAccessSubmitting ? '验证中...' : '验证并进入' }}
            </button>
          </div>
        </form>
      </article>
    </section>

    <template v-else>
      <nav class="view-menu" aria-label="工作区菜单">
        <button
          v-for="item in viewMenus"
          :key="item.value"
          :class="['view-menu-button', { active: activeMenu === item.value }]"
          type="button"
          :aria-pressed="activeMenu === item.value"
          @click="activeMenu = item.value"
        >
          <UiIcon :name="item.icon" size="sm" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <section class="fun-tip-strip" aria-label="玩趣提示">
        <div class="fun-tip-head">
          <span class="fun-tip-badge">
            <UiIcon name="sparkles" size="sm" />
            派蒙小贴士
          </span>
          <p>一点轻松提示，不影响正事，但会让页面没那么板着脸。</p>
        </div>
        <div class="fun-tip-list">
          <article v-for="tip in activePlayfulTips" :key="tip.title" class="fun-tip-card">
            <span class="fun-tip-icon">
              <UiIcon :name="tip.icon" size="sm" />
            </span>
            <div>
              <strong>{{ tip.title }}</strong>
              <p>{{ tip.text }}</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="activeMenu === MENU_STATS" class="stats-view">
        <StatsGrid :items="statsItems" @action="handleStatsAction" />
        <StatsDashboard :orders="orders" :show-income="showIncomeStats" />
      </section>

      <section v-if="activeMenu === MENU_ORDERS" class="workspace form-closed">
        <article class="table-shell">
          <div class="section-head">
            <div>
              <h2 class="section-title-with-icon">
                <UiIcon name="map" size="sm" />
                <span>订单列表</span>
              </h2>
            </div>
          </div>

          <div class="toolbar">
            <div class="toolbar-group">
              <span :class="['sync-status', syncTone]">{{ syncStatusText }}</span>
              <button class="button ghost small" type="button" :disabled="!feishuReady" @click="reloadFromSource()">
                <UiIcon name="reload" size="sm" />
                重新拉取
              </button>
            </div>
            <div class="toolbar-group search-bar">
              <label class="search-input">
                <UiIcon name="search" size="sm" />
                <input v-model.trim="currentSearch" type="search" placeholder="搜索微信名 / 关卡 / 状态">
              </label>
              <button class="button primary small create-order-button" type="button" :disabled="!workspaceReady" @click="openCreateForm()">
                <UiIcon name="plus" size="sm" />
                新建订单
              </button>
            </div>
          </div>

          <div class="status-tabs" role="tablist" aria-label="订单状态切换">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['status-tab', { active: activeStatusTab === tab.value }]"
              type="button"
              :aria-pressed="activeStatusTab === tab.value"
              @click="activeStatusTab = tab.value"
            >
              <UiIcon :name="tab.icon" size="sm" />
              <span>{{ tab.label }}</span>
              <strong>{{ tab.count }}</strong>
            </button>
          </div>

          <OrdersTable
            :orders="listedOrders"
            :active-order-id="activeOrderId"
            :empty-message="tableEmptyMessage"
            @select="fillForm"
            @edit="fillForm"
            @start="handleStatusChange($event, STATUS_PENDING)"
            @finish="handleStatusChange($event, STATUS_FINISHED)"
            @cancel="handleStatusChange($event, STATUS_CANCELLED)"
            @remove="handleRemove"
          />
        </article>
      </section>

      <section v-if="activeMenu === MENU_CALENDAR" class="calendar-section">
        <CalendarBoard
          :days="calendarDays"
          :month-label="monthLabel"
          :summary="calendarSummary"
          :can-create="feishuReady"
          @prev="goPrevMonth"
          @today="goCurrentMonth"
          @next="goNextMonth"
          @create="handleCalendarCreate"
          @open="fillForm"
        />
      </section>

      <div v-if="isFormVisible" class="modal-backdrop order-form-backdrop" @click.self="resetForm">
        <OrderFormPanel
          class="modal-card form-modal-card"
          :value="formModel"
          :visible="isFormVisible"
          :duration-options="formDurationOptions"
          :can-delete="Boolean(activeOrderId)"
          :feishu-ready="feishuReady"
          :form-title="formTitle"
          :editing-hint="editingHint"
          @save="handleSave"
          @cancel="resetForm"
          @remove="handleDeleteSelected"
        />
      </div>
    </template>

    <footer class="page-footer">
      <div class="page-footer-signature">
        <UiIcon name="sparkles" size="sm" />
        <span>Author: xue.zhang</span>
      </div>
      <p>提瓦特委托台记录中，愿每一单都顺利结束。</p>
    </footer>

    <ToastMessage :visible="toast.visible" :message="toast.message" :tone="toast.tone" />
  </main>
</template>

<script>
import CalendarBoard from '@/components/CalendarBoard.vue';
import OrderFormPanel from '@/components/OrderFormPanel.vue';
import OrdersTable from '@/components/OrdersTable.vue';
import StatsDashboard from '@/components/StatsDashboard.vue';
import StatsGrid from '@/components/StatsGrid.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import UiIcon from '@/components/UiIcon.vue';
import {
  buildFeishuStatusText,
  isFeishuConfigReady,
  loadFeishuConfig,
  loadOrdersFromFeishu,
  parseSpreadsheetToken,
  saveFeishuConfig,
  saveOrdersToFeishu,
  storeFeishuToken
} from '@/services/feishuDataSource';
import {
  buildCalendarEventMap,
  buildEmptyForm,
  createOrder,
  durationOptions,
  ensureDurationInOptions,
  formatDateKey,
  formatIncome,
  formatTimeOnly,
  getCalendarStartDate,
  getCurrentDateTime,
  getMonthLabel,
  normalizeDateTime,
  normalizeDurationMinutes,
  normalizeIncome,
  sanitizeText,
  statusClassMap
} from '@/utils/order';

const STATUS_PENDING = '待开始';
const STATUS_FINISHED = '结束';
const STATUS_CANCELLED = '取消';
const STATUS_ALL = '全部';
const MENU_ORDERS = 'orders';
const MENU_CALENDAR = 'calendar';
const MENU_STATS = 'stats';
const statusTabOrder = [STATUS_PENDING, STATUS_ALL, STATUS_FINISHED, STATUS_CANCELLED];
const statusTabIconMap = {
  [STATUS_PENDING]: 'pending',
  [STATUS_ALL]: 'all',
  [STATUS_FINISHED]: 'finished',
  [STATUS_CANCELLED]: 'cancelled'
};
const playfulTipMap = {
  [MENU_ORDERS]: [
    { title: '派蒙催单中', text: '先把待开始的单子清一轮，再开新单，节奏会稳很多。', icon: 'guide' },
    { title: '胡桃提醒', text: '取消单可以重新开始，结束单可别再回头折腾。', icon: 'sparkles' },
    { title: '凯瑟琳速报', text: '搜索框支持微信名、关卡和状态混合检索，翻单子更快。', icon: 'search' }
  ],
  [MENU_CALENDAR]: [
    { title: '芙宁娜排期建议', text: '把高难单错峰排开，日历一平整，心态也会平整。', icon: 'calendar' },
    { title: '今日不爆单', text: '点日历里的 + 可以直接落单到当天，空档时间别浪费。', icon: 'plus' },
    { title: '时间守护中', text: '点日历事件会直接跳回订单表单，不用来回翻。', icon: 'reload' }
  ],
  [MENU_STATS]: [
    { title: '摩拉小剧场', text: '收入默认躲起来了，点一下查看，摩拉才肯露脸。', icon: 'coin' },
    { title: '数据会说话', text: '折线图看近 7 天，圆形图看状态分布，适合追趋势。', icon: 'all' },
    { title: '月度复盘时间', text: '月底翻一眼月收入条形图，哪天该加单一清二楚。', icon: 'calendar' }
  ]
};

function buildAppCredentialConfig(config) {
  if (!config) {
    return null;
  }

  return {
    connectionType: 'appCredentials',
    proxyBaseUrl: '',
    spreadsheetToken: sanitizeText(config.spreadsheetToken),
    sheetId: sanitizeText(config.sheetId),
    appId: sanitizeText(config.appId),
    appSecret: sanitizeText(config.appSecret)
  };
}

function buildAccessDraft(config) {
  return {
    appId: sanitizeText(config?.appId),
    appSecret: sanitizeText(config?.appSecret),
    spreadsheetInput: sanitizeText(config?.spreadsheetToken)
  };
}

function prioritizePendingOrders(sourceOrders) {
  return sourceOrders
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftPriority = left.item.状态 === STATUS_PENDING ? 0 : 1;
      const rightPriority = right.item.状态 === STATUS_PENDING ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.index - right.index;
    })
    .map(({ item }) => item);
}

export default {
  name: 'App',
  components: {
    CalendarBoard,
    OrderFormPanel,
    OrdersTable,
    StatsDashboard,
    StatsGrid,
    ToastMessage,
    UiIcon
  },
  data() {
    const today = new Date();
    const initialConfig = buildAppCredentialConfig(loadFeishuConfig());
    const hasStoredConfig = isFeishuConfigReady(initialConfig);
    return {
      STATUS_PENDING,
      STATUS_FINISHED,
      STATUS_CANCELLED,
      MENU_ORDERS,
      MENU_CALENDAR,
      MENU_STATS,
      orders: [],
      activeOrderId: null,
      isFormVisible: false,
      currentSearch: '',
      activeStatusTab: STATUS_PENDING,
      activeMenu: MENU_ORDERS,
      calendarCursor: new Date(today.getFullYear(), today.getMonth(), 1),
      formModel: buildEmptyForm(),
      feishuConfig: initialConfig,
      lastFeishuSheetRowCount: 2,
      syncStatusText: hasStoredConfig
        ? '已读取本地飞书凭证，正在验证连接'
        : '请先输入 App ID、App Secret 和 spreadsheetToken',
      syncTone: hasStoredConfig ? 'syncing' : 'error',
      accessForm: buildAccessDraft(initialConfig),
      hasValidatedAccess: false,
      isAccessSubmitting: false,
      showIncomeStats: false,
      toast: {
        visible: false,
        message: '',
        tone: 'success'
      },
      toastTimer: null
    };
  },
  computed: {
    feishuReady() {
      return isFeishuConfigReady(this.feishuConfig);
    },
    workspaceReady() {
      return this.hasValidatedAccess && this.feishuReady;
    },
    showAccessGate() {
      return !this.hasValidatedAccess;
    },
    statsItems() {
      const total = this.orders.length;
      const pending = this.orders.filter((item) => item.状态 === STATUS_PENDING).length;
      const finished = this.orders.filter((item) => item.状态 === STATUS_FINISHED).length;
      const income = this.orders
        .filter((item) => item.状态 !== STATUS_CANCELLED)
        .reduce((sum, item) => sum + normalizeIncome(item.收入), 0);

      return [
        { label: '总订单数', value: String(total), icon: 'all', helper: '飞书中的全部委托', tone: 'rose' },
        { label: '待开始', value: String(pending), icon: 'pending', helper: '默认优先展示的订单', tone: 'amber' },
        { label: '已结束', value: String(finished), icon: 'finished', helper: '已经交付完成的单子', tone: 'jade' },
        {
          label: '总收入',
          value: this.showIncomeStats ? formatIncome(income) : '******',
          icon: 'coin',
          helper: this.showIncomeStats ? '取消单不会计入收入' : '默认隐藏金额',
          tone: 'gold',
          action: 'toggle-income',
          actionLabel: this.showIncomeStats ? '点击隐藏' : '点击查看'
        }
      ];
    },
    viewMenus() {
      return [
        { value: MENU_ORDERS, label: '订单列表', icon: 'map' },
        { value: MENU_CALENDAR, label: '日历', icon: 'calendar' },
        { value: MENU_STATS, label: '数据统计', icon: 'all' }
      ];
    },
    activePlayfulTips() {
      return playfulTipMap[this.activeMenu] || playfulTipMap[MENU_ORDERS];
    },
    statusTabs() {
      const counts = this.orders.reduce((result, item) => {
        result[item.状态] = (result[item.状态] || 0) + 1;
        return result;
      }, {
        [STATUS_PENDING]: 0,
        [STATUS_FINISHED]: 0,
        [STATUS_CANCELLED]: 0
      });

      return statusTabOrder.map((status) => ({
        value: status,
        label: status,
        icon: statusTabIconMap[status],
        count: status === STATUS_ALL ? this.orders.length : counts[status] || 0
      }));
    },
    searchedOrders() {
      const keyword = this.currentSearch.trim().toLowerCase();
      if (!keyword) {
        return this.orders;
      }

      return this.orders.filter((item) => {
        return [item.微信名, item.关卡, item.状态, item.难易程度]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      });
    },
    listedOrders() {
      const statusScopedOrders = this.activeStatusTab === STATUS_ALL
        ? this.searchedOrders
        : this.searchedOrders.filter((item) => item.状态 === this.activeStatusTab);

      return prioritizePendingOrders(statusScopedOrders);
    },
    formTitle() {
      return this.activeOrderId ? '编辑订单' : '新增订单';
    },
    editingHint() {
      if (!this.workspaceReady) {
        return '请先完成飞书首屏验证';
      }
      return this.activeOrderId ? '当前正在编辑所选订单' : '当前未选中订单';
    },
    formDurationOptions() {
      return ensureDurationInOptions(this.formModel.duration, durationOptions);
    },
    tableEmptyMessage() {
      const currentScope = this.activeStatusTab === STATUS_ALL ? '当前筛选' : `${this.activeStatusTab}状态`;
      return this.feishuReady
        ? `${currentScope}下没有匹配订单，试试切换状态或清空搜索条件。`
        : '尚未完成飞书验证，请先输入 App ID、App Secret 和 spreadsheetToken。';
    },
    monthLabel() {
      return getMonthLabel(this.calendarCursor);
    },
    calendarDays() {
      const monthDate = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth(), 1);
      const eventMap = buildCalendarEventMap(this.searchedOrders);
      const startDate = getCalendarStartDate(monthDate);
      const todayKey = formatDateKey(new Date());

      return Array.from({ length: 42 }, (_, index) => {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + index);
        const key = formatDateKey(cellDate);
        const items = eventMap.get(key) || [];
        const previewItems = items.slice(0, 3).map((item) => ({
          ...item,
          eventClass: statusClassMap[item.状态] || 'pending',
          timeLabel: formatTimeOnly(item.预约时间)
        }));
        const isCurrentMonth = cellDate.getMonth() === monthDate.getMonth();

        return {
          key,
          dateNumber: cellDate.getDate(),
          isCurrentMonth,
          isToday: key === todayKey,
          daySub: isCurrentMonth ? `${items.length} 项预约` : `${cellDate.getMonth() + 1} 月`,
          previewItems,
          itemsCount: items.length,
          moreCount: Math.max(items.length - 3, 0)
        };
      });
    },
    calendarSummary() {
      if (!this.workspaceReady) {
        return '请先完成飞书验证，日历会按飞书中的预约时间展示。';
      }

      const monthEventCount = this.calendarDays
        .filter((day) => day.isCurrentMonth)
        .reduce((sum, day) => sum + day.itemsCount, 0);
      return `${this.monthLabel}共 ${monthEventCount} 条预约，点击日历项可编辑订单，点 + 可在当天新建。`;
    }
  },
  mounted() {
    this.loadInitialData();
  },
  beforeDestroy() {
    window.clearTimeout(this.toastTimer);
  },
  methods: {
    handleStatsAction(action) {
      if (action === 'toggle-income') {
        this.showIncomeStats = !this.showIncomeStats;
      }
    },
    setSyncStatus(message, tone = '') {
      this.syncStatusText = message;
      this.syncTone = tone;
    },
    applyResolvedConfig(config) {
      const normalizedConfig = buildAppCredentialConfig(config);
      if (!normalizedConfig) {
        return;
      }
      this.feishuConfig = saveFeishuConfig(normalizedConfig);
    },
    showToast(message, tone = 'success') {
      this.toast.visible = true;
      this.toast.message = message;
      this.toast.tone = tone;
      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toast.visible = false;
      }, 2600);
    },
    openCreateForm(initialDateTime) {
      if (!this.feishuReady) {
        this.showToast('请先完成飞书验证。', 'error');
        return;
      }

      this.activeMenu = MENU_ORDERS;
      this.activeOrderId = null;
      this.formModel = buildEmptyForm();
      if (initialDateTime) {
        this.formModel.scheduleTime = normalizeDateTime(initialDateTime) || initialDateTime;
      }
      this.isFormVisible = true;
    },
    resetForm() {
      this.activeOrderId = null;
      this.formModel = buildEmptyForm();
      this.isFormVisible = false;
    },
    fillForm(orderId) {
      const order = typeof orderId === 'string'
        ? this.orders.find((item) => item.id === orderId)
        : orderId;
      if (!order) {
        return;
      }

      this.activeMenu = MENU_ORDERS;
      this.formModel = {
        wechatName: order.微信名,
        scheduleTime: normalizeDateTime(order.预约时间),
        stage: order.关卡,
        difficulty: order.难易程度,
        duration: String(normalizeDurationMinutes(order.预计需要时长)),
        income: String(order.收入)
      };
      this.activeOrderId = order.id;
      this.isFormVisible = true;
    },
    async persistOrders(nextOrders) {
      if (!this.feishuReady) {
        this.setSyncStatus('飞书未完成验证，不能保存订单', 'error');
        this.showToast('请先完成飞书验证，再保存订单。', 'error');
        return false;
      }

      const normalizedOrders = nextOrders.map((item) => createOrder(item));
      this.setSyncStatus('正在同步到飞书', 'syncing');
      try {
        const result = await saveOrdersToFeishu(this.feishuConfig, normalizedOrders, this.lastFeishuSheetRowCount);
        this.orders = normalizedOrders;
        this.lastFeishuSheetRowCount = result.rowCount;
        this.applyResolvedConfig(result.config);
        this.setSyncStatus(buildFeishuStatusText(this.feishuConfig), 'connected');
        return true;
      } catch (error) {
        console.error(error);
        this.setSyncStatus('同步飞书失败，请检查权限或代理配置', 'error');
        this.showToast(error.message || '同步飞书失败。', 'error');
        return false;
      }
    },
    async loadInitialData() {
      if (!this.feishuReady) {
        this.orders = [];
        this.setSyncStatus('请先输入 App ID、App Secret 和 spreadsheetToken', 'error');
        return;
      }
      this.hasValidatedAccess = await this.reloadFromSource(true);
    },
    async reloadFromSource(silent = false) {
      if (!this.feishuReady) {
        this.orders = [];
        this.resetForm();
        this.hasValidatedAccess = false;
        this.setSyncStatus('请先输入 App ID、App Secret 和 spreadsheetToken', 'error');
        if (!silent) {
          this.showToast('请先完成飞书首屏验证。', 'error');
        }
        return false;
      }

      this.setSyncStatus('正在从飞书拉取数据', 'syncing');
      try {
        const result = await loadOrdersFromFeishu(this.feishuConfig);
        this.orders = result.orders;
        this.lastFeishuSheetRowCount = result.rowCount;
        this.applyResolvedConfig(result.config);
        this.resetForm();
        this.hasValidatedAccess = true;
        this.setSyncStatus(buildFeishuStatusText(this.feishuConfig), 'connected');
        if (!silent) {
          this.showToast(`已从飞书拉取 ${this.orders.length} 条订单。`, 'success');
        }
        return true;
      } catch (error) {
        console.error(error);
        this.setSyncStatus('飞书拉取失败，请检查权限或代理配置', 'error');
        if (!silent) {
          this.showToast(error.message || '飞书读取失败。', 'error');
        }
        return false;
      }
    },
    async handleAccessSubmit() {
      const appId = sanitizeText(this.accessForm.appId);
      const appSecret = sanitizeText(this.accessForm.appSecret);
      const spreadsheetToken = parseSpreadsheetToken(this.accessForm.spreadsheetInput);

      if (!appId || !appSecret) {
        this.showToast('App ID 和 App Secret 不能为空。', 'error');
        return;
      }

      if (!spreadsheetToken) {
        this.showToast('没有识别到有效的 spreadsheetToken，请填写飞书表格分享链接或直接填写 token。', 'error');
        return;
      }

      const nextConfig = {
        connectionType: 'appCredentials',
        spreadsheetToken,
        sheetId: sanitizeText(this.feishuConfig?.sheetId),
        proxyBaseUrl: '',
        appId,
        appSecret
      };

      this.accessForm.spreadsheetInput = spreadsheetToken;
      storeFeishuToken('');
      this.applyResolvedConfig(nextConfig);
      this.setSyncStatus('正在验证飞书连接', 'syncing');
      this.isAccessSubmitting = true;
      try {
        await this.reloadFromSource();
      } finally {
        this.isAccessSubmitting = false;
      }
    },
    async handleSave(formData) {
      const existingOrder = this.orders.find((item) => item.id === this.activeOrderId);
      const payload = createOrder({
        ...(existingOrder || {}),
        id: this.activeOrderId || undefined,
        微信名: formData.wechatName,
        预约时间: formData.scheduleTime,
        关卡: formData.stage,
        难易程度: formData.difficulty,
        预计需要时长: formData.duration,
        收入: formData.income
      });

      if (!payload.微信名 || !payload.预约时间 || !payload.关卡) {
        this.showToast('请把订单信息填写完整。', 'error');
        return;
      }

      const existingIndex = this.orders.findIndex((item) => item.id === payload.id);
      const nextOrders = existingIndex >= 0
        ? this.orders.map((item, index) => (index === existingIndex ? payload : item))
        : [payload, ...this.orders];

      const saved = await this.persistOrders(nextOrders);
      if (!saved) {
        return;
      }

      this.showToast(existingIndex >= 0 ? '订单已更新。' : '订单已新增。', 'success');
      this.resetForm();
    },
    async handleStatusChange(id, nextStatus) {
      const index = this.orders.findIndex((item) => item.id === id);
      if (index < 0) {
        return;
      }

      const current = this.orders[index];
      if (current.状态 === nextStatus) {
        return;
      }

      if (current.状态 === STATUS_CANCELLED && nextStatus === STATUS_FINISHED) {
        this.showToast('已取消订单不能直接结束，请先重新开始。', 'error');
        return;
      }

      if (current.状态 === STATUS_FINISHED && nextStatus === STATUS_CANCELLED) {
        this.showToast('已结束订单不能再取消。', 'error');
        return;
      }

      if (current.状态 !== STATUS_CANCELLED && nextStatus === STATUS_PENDING) {
        this.showToast('只有已取消订单才能重新开始。', 'error');
        return;
      }

      const now = getCurrentDateTime();
      const updated = createOrder({
        ...current,
        状态: nextStatus,
        结束时间: nextStatus === STATUS_FINISHED ? now : '',
        取消时间: nextStatus === STATUS_CANCELLED ? now : ''
      });

      const nextOrders = this.orders.map((item, itemIndex) => (itemIndex === index ? updated : item));
      const saved = await this.persistOrders(nextOrders);
      if (!saved) {
        return;
      }

      if (this.activeOrderId === id) {
        this.fillForm(updated);
      }

      this.showToast(nextStatus === STATUS_PENDING ? '订单已重新开始。' : `订单已标记为${nextStatus}。`, 'success');
    },
    async handleRemove(id) {
      const order = this.orders.find((item) => item.id === id);
      if (!order) {
        return;
      }

      const confirmed = window.confirm(`确认删除 ${order.微信名 || '该订单'} 吗？`);
      if (!confirmed) {
        return;
      }

      const nextOrders = this.orders.filter((item) => item.id !== id);
      const saved = await this.persistOrders(nextOrders);
      if (!saved) {
        return;
      }

      if (this.activeOrderId === id) {
        this.resetForm();
      }

      this.showToast('订单已删除。', 'success');
    },
    async handleDeleteSelected() {
      if (!this.activeOrderId) {
        return;
      }
      await this.handleRemove(this.activeOrderId);
    },
    goPrevMonth() {
      this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() - 1, 1);
    },
    goCurrentMonth() {
      const today = new Date();
      this.calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    },
    goNextMonth() {
      this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() + 1, 1);
    },
    handleCalendarCreate(dateKey) {
      this.openCreateForm(`${dateKey}T09:00`);
    }
  }
};
</script>
