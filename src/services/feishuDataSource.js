import {
  columns,
  createOrder,
  displayDateTime,
  normalizeDurationMinutes,
  normalizeIncome,
  sanitizeText
} from '@/utils/order';

const FEISHU_CONFIG_KEY = 'genshin-order-manager-feishu-config-v1';
const FEISHU_TOKEN_SESSION_KEY = 'genshin-order-manager-feishu-token-v1';
const FEISHU_OPEN_API_PROXY_BASE = '/api/feishu-open-apis';

function getFeishuOpenApiBaseUrl() {
  return FEISHU_OPEN_API_PROXY_BASE;
}

function wrapFeishuFetchError(error, connectionType) {
  if (!(error instanceof TypeError) || !/Failed to fetch/i.test(error.message || '')) {
    return error;
  }

  if (connectionType === 'proxy') {
    return new Error('代理接口请求失败，请检查代理地址或本地网络。');
  }

  if (import.meta.env.DEV) {
    return new Error('飞书请求失败，请确认当前页面是通过 npm run dev 启动的开发服务访问，并重试。');
  }

  return new Error(`飞书开放接口已改为代理访问，请确认发布环境已提供同源代理接口 ${getFeishuOpenApiBaseUrl()}。本地验证请通过 npm run dev 使用开发代理。`);
}

function normalizeConnectionType(value) {
  return value === 'accessToken' || value === 'appCredentials' ? value : 'proxy';
}

function readStoredFeishuTokenEntry() {
  const cached = sessionStorage.getItem(FEISHU_TOKEN_SESSION_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed === 'object' && typeof parsed.token === 'string') {
      return {
        token: sanitizeText(parsed.token),
        expiresAt: Number(parsed.expiresAt) || 0
      };
    }
  } catch (error) {
    return {
      token: sanitizeText(cached),
      expiresAt: 0
    };
  }

  return null;
}

export function loadFeishuConfig() {
  const cached = localStorage.getItem(FEISHU_CONFIG_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return {
      connectionType: normalizeConnectionType(parsed.connectionType),
      proxyBaseUrl: sanitizeText(parsed.proxyBaseUrl),
      spreadsheetToken: sanitizeText(parsed.spreadsheetToken),
      sheetId: sanitizeText(parsed.sheetId),
      appId: sanitizeText(parsed.appId),
      appSecret: sanitizeText(parsed.appSecret)
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function saveFeishuConfig(config) {
  if (!config) {
    localStorage.removeItem(FEISHU_CONFIG_KEY);
    return null;
  }

  const normalized = {
    connectionType: normalizeConnectionType(config.connectionType),
    proxyBaseUrl: sanitizeText(config.proxyBaseUrl),
    spreadsheetToken: sanitizeText(config.spreadsheetToken),
    sheetId: sanitizeText(config.sheetId),
    appId: sanitizeText(config.appId),
    appSecret: sanitizeText(config.appSecret)
  };

  localStorage.setItem(FEISHU_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getStoredFeishuToken() {
  const entry = readStoredFeishuTokenEntry();
  if (!entry?.token) {
    return '';
  }

  if (entry.expiresAt && Date.now() >= entry.expiresAt) {
    sessionStorage.removeItem(FEISHU_TOKEN_SESSION_KEY);
    return '';
  }

  return entry.token;
}

export function storeFeishuToken(token, expireInSeconds = 0) {
  const normalized = sanitizeText(token);
  if (!normalized) {
    sessionStorage.removeItem(FEISHU_TOKEN_SESSION_KEY);
    return;
  }

  const safeExpireInSeconds = Number(expireInSeconds) || 0;
  const bufferSeconds = safeExpireInSeconds > 120 ? 60 : 0;
  const expiresAt = safeExpireInSeconds > 0
    ? Date.now() + Math.max(safeExpireInSeconds - bufferSeconds, 1) * 1000
    : 0;

  sessionStorage.setItem(FEISHU_TOKEN_SESSION_KEY, JSON.stringify({
    token: normalized,
    expiresAt
  }));
}

export function normalizeProxyBaseUrl(value) {
  return sanitizeText(value).replace(/\/+$/, '');
}

function normalizeSpreadsheetTokenCandidate(value) {
  const normalized = sanitizeText(value).replace(/^:/, '');
  if (!normalized) {
    return '';
  }

  if (/^(spreadsheet_token|sheet_id)$/i.test(normalized)) {
    return '';
  }

  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : '';
}

export function parseSpreadsheetToken(value) {
  const input = sanitizeText(value);
  if (!input) {
    return '';
  }

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const queryToken = normalizeSpreadsheetTokenCandidate(
        url.searchParams.get('spreadsheet_token') || url.searchParams.get('spreadsheetToken') || ''
      );
      if (queryToken) {
        return queryToken;
      }

      const segments = url.pathname.split('/').filter(Boolean);
      const spreadsheetsIndex = segments.indexOf('spreadsheets');
      if (spreadsheetsIndex >= 0) {
        const token = normalizeSpreadsheetTokenCandidate(segments[spreadsheetsIndex + 1] || '');
        if (token) {
          return token;
        }
      }

      const sheetsIndex = segments.indexOf('sheets');
      if (sheetsIndex >= 0) {
        const nextSegment = segments[sheetsIndex + 1] || '';
        if (!/^v\d+$/i.test(nextSegment)) {
          const token = normalizeSpreadsheetTokenCandidate(nextSegment);
          if (token) {
            return token;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  const matched = input.match(/\/spreadsheets\/([^/?#]+)/i) || input.match(/\/sheets\/([^/?#]+)/i);
  if (matched) {
    return normalizeSpreadsheetTokenCandidate(matched[1]);
  }

  return normalizeSpreadsheetTokenCandidate(input);
}

export function isFeishuConfigReady(config) {
  if (!config || !config.spreadsheetToken) {
    return false;
  }

  if (config.connectionType === 'proxy') {
    return Boolean(config.proxyBaseUrl);
  }

  if (config.connectionType === 'appCredentials') {
    return Boolean(config.appId && config.appSecret);
  }

  return Boolean(getStoredFeishuToken());
}

export function buildFeishuStatusText(config) {
  if (!config || !config.spreadsheetToken) {
    return '飞书未配置，请先点击配置飞书';
  }

  const tokenLabel = config.spreadsheetToken.slice(0, 8);
  if (config.connectionType === 'proxy') {
    return `当前数据源：飞书代理 ${tokenLabel}...`;
  }

  if (config.connectionType === 'appCredentials') {
    return `当前数据源：飞书应用直连 ${tokenLabel}...`;
  }

  return `当前数据源：飞书直连 ${tokenLabel}...`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (!response.ok) {
      throw new Error(text || `请求失败：${response.status}`);
    }
    throw error;
  }
}

function ensureFeishuSuccess(payload) {
  if (payload && Number(payload.code) === 0) {
    return payload;
  }
  throw new Error(payload?.msg || payload?.message || '飞书接口调用失败。');
}

async function requestFeishuProxy(config, action, payload) {
  try {
    const response = await fetch(config.proxyBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        action,
        spreadsheetToken: config.spreadsheetToken,
        sheetId: config.sheetId,
        ...payload
      })
    });

    const json = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(json?.msg || json?.message || `代理请求失败：${response.status}`);
    }
    return ensureFeishuSuccess(json);
  } catch (error) {
    throw wrapFeishuFetchError(error, 'proxy');
  }
}

async function requestTenantAccessToken(config) {
  const appId = sanitizeText(config.appId);
  const appSecret = sanitizeText(config.appSecret);
  if (!appId || !appSecret) {
    throw new Error('App ID 或 App Secret 为空，请重新配置。');
  }

  try {
    const response = await fetch(`${getFeishuOpenApiBaseUrl()}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const json = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(json?.msg || json?.message || `飞书鉴权失败：${response.status}`);
    }

    ensureFeishuSuccess(json);
    const accessToken = sanitizeText(json.tenant_access_token);
    if (!accessToken) {
      throw new Error('飞书未返回 tenant_access_token。');
    }

    storeFeishuToken(accessToken, Number(json.expire) || 0);
    return accessToken;
  } catch (error) {
    throw wrapFeishuFetchError(error, config.connectionType);
  }
}

async function getFeishuOpenApiToken(config, forceRefresh = false) {
  if (config.connectionType === 'appCredentials') {
    if (!forceRefresh) {
      const cachedToken = getStoredFeishuToken();
      if (cachedToken) {
        return cachedToken;
      }
    }
    return requestTenantAccessToken(config);
  }

  const accessToken = getStoredFeishuToken();
  if (!accessToken) {
    throw new Error('飞书 access token 不存在，请重新配置。');
  }
  return accessToken;
}

async function requestFeishuOpenApi(config, method, path, body) {
  const attempts = config.connectionType === 'appCredentials' ? 2 : 1;
  let lastMessage = '飞书请求失败。';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const accessToken = await getFeishuOpenApiToken(config, attempt > 0);
    try {
      const response = await fetch(`${getFeishuOpenApiBaseUrl()}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const json = await readJsonResponse(response);
      if (response.ok && Number(json?.code) === 0) {
        return json;
      }

      lastMessage = json?.msg || json?.error_description || json?.message || `飞书请求失败：${response.status}`;
      if (config.connectionType === 'appCredentials' && attempt === 0) {
        storeFeishuToken('');
        continue;
      }

      throw new Error(lastMessage);
    } catch (error) {
      if (config.connectionType === 'appCredentials' && attempt === 0 && !(error instanceof TypeError)) {
        storeFeishuToken('');
        continue;
      }

      throw wrapFeishuFetchError(error, config.connectionType);
    }
  }

  throw new Error(lastMessage);
}

export async function requestFeishu(config, action, payload = {}) {
  if (!config) {
    throw new Error('飞书配置不存在。');
  }

  if (config.connectionType === 'proxy') {
    return requestFeishuProxy(config, action, payload);
  }

  if (action === 'querySheet') {
    return requestFeishuOpenApi(
      config,
      'GET',
      `/sheets/v3/spreadsheets/${encodeURIComponent(config.spreadsheetToken)}/sheets/query`
    );
  }

  if (action === 'readRange') {
    return requestFeishuOpenApi(
      config,
      'GET',
      `/sheets/v2/spreadsheets/${encodeURIComponent(config.spreadsheetToken)}/values/${encodeURIComponent(payload.range)}?valueRenderOption=ToString&dateTimeRenderOption=FormattedString`
    );
  }

  if (action === 'writeRange') {
    return requestFeishuOpenApi(
      config,
      'PUT',
      `/sheets/v2/spreadsheets/${encodeURIComponent(config.spreadsheetToken)}/values`,
      {
        valueRange: {
          range: payload.range,
          values: payload.values
        }
      }
    );
  }

  throw new Error('不支持的飞书操作。');
}

export async function resolveFeishuSheetId(config) {
  const workingConfig = { ...config };
  if (workingConfig.sheetId) {
    return { config: workingConfig, sheetId: workingConfig.sheetId };
  }

  const result = await requestFeishu(workingConfig, 'querySheet');
  const sheets = result?.data?.sheets || [];
  const firstSheet = sheets.find((item) => !item.hidden) || sheets[0];
  if (!firstSheet?.sheet_id) {
    throw new Error('没有在飞书电子表格中找到可用工作表。');
  }

  workingConfig.sheetId = sanitizeText(firstSheet.sheet_id);
  return {
    config: workingConfig,
    sheetId: workingConfig.sheetId
  };
}

function getFeishuSheetValue(sourceRow, headerIndex, name, fallbackIndex) {
  const explicitIndex = Object.prototype.hasOwnProperty.call(headerIndex, name) ? headerIndex[name] : fallbackIndex;
  return sourceRow?.[explicitIndex] ?? '';
}

function parseOrdersFromFeishuValues(values) {
  if (!Array.isArray(values) || !values.length) {
    return { orders: [], rowCount: 2 };
  }

  const headerRow = values[0].map((item) => sanitizeText(item));
  const headerIndex = {};
  headerRow.forEach((name, index) => {
    if (name) {
      headerIndex[name] = index;
    }
  });

  const hasHeader = columns.some((name) => Object.prototype.hasOwnProperty.call(headerIndex, name));
  const dataRows = hasHeader ? values.slice(1) : values;

  const orders = dataRows.map((row) => createOrder({
    微信名: getFeishuSheetValue(row, headerIndex, '微信名', 0),
    创建时间: getFeishuSheetValue(row, headerIndex, '创建时间', 1),
    预约时间: getFeishuSheetValue(row, headerIndex, '预约时间', 2),
    关卡: getFeishuSheetValue(row, headerIndex, '关卡', 3),
    状态: getFeishuSheetValue(row, headerIndex, '状态', 4),
    结束时间: getFeishuSheetValue(row, headerIndex, '结束时间', 5),
    取消时间: getFeishuSheetValue(row, headerIndex, '取消时间', 6),
    难易程度: getFeishuSheetValue(row, headerIndex, '难易程度', 7),
    预计需要时长: getFeishuSheetValue(row, headerIndex, '预计需要时长', 8),
    收入: getFeishuSheetValue(row, headerIndex, '收入', 9)
  })).filter((item) => item.微信名 || item.关卡);

  return {
    orders,
    rowCount: Math.max(values.length, 2)
  };
}

function buildFeishuSheetValues(sourceOrders, totalRowCount) {
  const rows = [
    [...columns],
    ...sourceOrders.map((item) => [
      item.微信名,
      displayDateTime(item.创建时间),
      displayDateTime(item.预约时间),
      item.关卡,
      item.状态,
      displayDateTime(item.结束时间),
      displayDateTime(item.取消时间),
      item.难易程度,
      normalizeDurationMinutes(item.预计需要时长),
      normalizeIncome(item.收入)
    ])
  ];

  while (rows.length < totalRowCount) {
    rows.push(Array(columns.length).fill(''));
  }

  return rows;
}

export async function loadOrdersFromFeishu(config) {
  if (!isFeishuConfigReady(config)) {
    throw new Error('飞书配置不完整，请重新配置。');
  }

  const resolved = await resolveFeishuSheetId(config);
  const result = await requestFeishu(resolved.config, 'readRange', {
    range: `${resolved.sheetId}!A1:J5000`
  });

  const parsed = parseOrdersFromFeishuValues(result?.data?.valueRange?.values || []);
  return {
    orders: parsed.orders,
    rowCount: parsed.rowCount,
    config: resolved.config
  };
}

export async function saveOrdersToFeishu(config, sourceOrders, lastRowCount = 2) {
  if (!isFeishuConfigReady(config)) {
    throw new Error('飞书配置不完整，请重新配置。');
  }

  const resolved = await resolveFeishuSheetId(config);
  const targetRowCount = Math.max(sourceOrders.length + 1, lastRowCount, 2);
  const values = buildFeishuSheetValues(sourceOrders, targetRowCount);

  await requestFeishu(resolved.config, 'writeRange', {
    range: `${resolved.sheetId}!A1:J${targetRowCount}`,
    values
  });

  return {
    rowCount: targetRowCount,
    config: resolved.config
  };
}
