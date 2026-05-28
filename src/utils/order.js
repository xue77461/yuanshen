export const columns = ['微信名', '创建时间', '预约时间', '关卡', '状态', '结束时间', '取消时间', '难易程度', '预计需要时长', '收入'];

export const statusClassMap = {
  待开始: 'pending',
  结束: 'finished',
  取消: 'cancelled'
};

export const difficultyOptions = ['低', '中', '高'];
export const durationOptions = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360];

export function sanitizeText(value) {
  return String(value ?? '').trim();
}

export function normalizeIncome(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

export function normalizeDateTime(value) {
  const text = sanitizeText(value);
  if (!text || text === '-') {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(text)) {
    return text.replace(' ', 'T');
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function displayDateTime(value) {
  const normalized = normalizeDateTime(value);
  return normalized ? normalized.replace('T', ' ') : '-';
}

export function getCurrentDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function normalizeDurationMinutes(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const text = sanitizeText(value);
  if (!text) {
    return 60;
  }

  if (/^\d+$/.test(text)) {
    return Math.max(0, Number.parseInt(text, 10));
  }

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*小时/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*分钟/);

  if (hourMatch) {
    return Math.max(0, Math.round(Number.parseFloat(hourMatch[1]) * 60));
  }

  if (minuteMatch) {
    return Math.max(0, Math.round(Number.parseFloat(minuteMatch[1])));
  }

  const fallback = Number.parseFloat(text);
  return Number.isFinite(fallback) ? Math.max(0, Math.round(fallback)) : 60;
}

export function displayDuration(value) {
  return `${normalizeDurationMinutes(value)} 分钟`;
}

export function parseLocalDateTime(value) {
  const normalized = normalizeDateTime(value);
  if (!normalized) {
    return null;
  }

  const [datePart, timePart = '00:00'] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOnly(value) {
  const normalized = normalizeDateTime(value);
  return normalized ? normalized.slice(11, 16) : '--:--';
}

export function getMonthLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function getCalendarStartDate(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const dayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - dayOffset);
  return start;
}

export function buildCalendarEventMap(sourceOrders) {
  const map = new Map();
  sourceOrders
    .filter((item) => normalizeDateTime(item.预约时间))
    .sort((left, right) => {
      const leftDate = parseLocalDateTime(left.预约时间);
      const rightDate = parseLocalDateTime(right.预约时间);
      return (leftDate?.getTime() || 0) - (rightDate?.getTime() || 0);
    })
    .forEach((item) => {
      const date = parseLocalDateTime(item.预约时间);
      if (!date) {
        return;
      }
      const key = formatDateKey(date);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
  return map;
}

export function formatIncome(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2
  }).format(normalizeIncome(value));
}

function generateOrderId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `order_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createOrder(data = {}) {
  const status = ['待开始', '结束', '取消'].includes(data.状态) ? data.状态 : '待开始';
  const createdAt = normalizeDateTime(data.创建时间 || data.createdAt) || getCurrentDateTime();
  const finishedAt = normalizeDateTime(data.结束时间 || data.finishedAt);
  const cancelledAt = normalizeDateTime(data.取消时间 || data.cancelledAt);

  return {
    id: data.id || generateOrderId(),
    创建时间: createdAt,
    微信名: sanitizeText(data.微信名),
    预约时间: normalizeDateTime(data.预约时间),
    关卡: sanitizeText(data.关卡),
    状态: status,
    结束时间: status === '结束' ? finishedAt : '',
    取消时间: status === '取消' ? cancelledAt : '',
    难易程度: difficultyOptions.includes(data.难易程度) ? data.难易程度 : '中',
    预计需要时长: normalizeDurationMinutes(data.预计需要时长),
    收入: normalizeIncome(data.收入)
  };
}

export function buildEmptyForm() {
  return {
    wechatName: '',
    scheduleTime: '',
    stage: '',
    difficulty: '中',
    duration: '60',
    income: ''
  };
}

export function ensureDurationInOptions(minutes, currentOptions = durationOptions) {
  const normalized = normalizeDurationMinutes(minutes);
  const options = Array.from(new Set([...currentOptions, normalized]));
  return options.sort((left, right) => left - right);
}
