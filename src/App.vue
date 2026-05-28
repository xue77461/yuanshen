<template>
  <main class="page">
    <HeroBanner :can-create="workspaceReady" @create="openCreateForm" />

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
      <StatsGrid :items="statsItems" />

      <section :class="['workspace', isFormVisible ? 'form-open' : 'form-closed']">
        <div v-if="isFormVisible" class="form-column">
          <OrderFormPanel
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

        <article class="table-shell">
          <div class="section-head">
            <div>
              <h2>订单列表</h2>
            </div>
          </div>

          <div class="toolbar">
            <div class="toolbar-group">
              <span :class="['sync-status', syncTone]">{{ syncStatusText }}</span>
              <button class="button ghost small" type="button" :disabled="!feishuReady" @click="reloadFromSource()">
                重新拉取
              </button>
            </div>
            <div class="toolbar-group search-bar">
              <input v-model.trim="currentSearch" type="search" placeholder="搜索微信名 / 关卡 / 状态">
            </div>
          </div>

          <OrdersTable
            :orders="filteredOrders"
            :active-order-id="activeOrderId"
            :empty-message="tableEmptyMessage"
            @select="fillForm"
            @edit="fillForm"
            @finish="handleStatusChange($event, '结束')"
            @cancel="handleStatusChange($event, '取消')"
            @remove="handleRemove"
          />
        </article>
      </section>

      <section class="calendar-section">
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
    </template>

    <ToastMessage :visible="toast.visible" :message="toast.message" :tone="toast.tone" />
  </main>
</template>

<script>
import CalendarBoard from '@/components/CalendarBoard.vue';
import HeroBanner from '@/components/HeroBanner.vue';
import OrderFormPanel from '@/components/OrderFormPanel.vue';
import OrdersTable from '@/components/OrdersTable.vue';
import StatsGrid from '@/components/StatsGrid.vue';
import ToastMessage from '@/components/ToastMessage.vue';
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
  displayDateTime,
  difficultyOptions,
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

export default {
  name: 'App',
  components: {
    CalendarBoard,
    HeroBanner,
    OrderFormPanel,
    OrdersTable,
    StatsGrid,
    ToastMessage
  },
  data() {
    const today = new Date();
    const initialConfig = buildAppCredentialConfig(loadFeishuConfig());
    const hasStoredConfig = isFeishuConfigReady(initialConfig);
    return {
      orders: [],
      activeOrderId: null,
      isFormVisible: false,
      currentSearch: '',
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
      const pending = this.orders.filter((item) => item.状态 === '待开始').length;
      const finished = this.orders.filter((item) => item.状态 === '结束').length;
      const income = this.orders
        .filter((item) => item.状态 !== '取消')
        .reduce((sum, item) => sum + normalizeIncome(item.收入), 0);

      return [
        { label: '总订单数', value: String(total) },
        { label: '待开始', value: String(pending) },
        { label: '已结束', value: String(finished) },
        { label: '总收入', value: formatIncome(income) }
      ];
    },
    filteredOrders() {
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
      return this.feishuReady
        ? '当前飞书表中没有匹配订单，试试新增一条，或者清空搜索条件。'
        : '尚未完成飞书验证，请先输入 App ID、App Secret 和 spreadsheetToken。';
    },
    monthLabel() {
      return getMonthLabel(this.calendarCursor);
    },
    calendarDays() {
      const monthDate = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth(), 1);
      const eventMap = buildCalendarEventMap(this.filteredOrders);
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
      if (current.状态 === '结束' && nextStatus === '取消') {
        this.showToast('已结束订单不能再取消。', 'error');
        return;
      }

      const now = getCurrentDateTime();
      const updated = createOrder({
        ...current,
        状态: nextStatus,
        结束时间: nextStatus === '结束' ? now : '',
        取消时间: nextStatus === '取消' ? now : ''
      });

      const nextOrders = this.orders.map((item, itemIndex) => (itemIndex === index ? updated : item));
      const saved = await this.persistOrders(nextOrders);
      if (!saved) {
        return;
      }

      if (this.activeOrderId === id) {
        this.fillForm(updated);
      }

      this.showToast(`订单已标记为${nextStatus}。`, 'success');
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
