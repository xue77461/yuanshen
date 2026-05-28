<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>微信名</th>
          <th>创建时间</th>
          <th>预约时间</th>
          <th>关卡</th>
          <th>状态</th>
          <th>记录时间</th>
          <th>难易程度</th>
          <th>预计需要时长</th>
          <th>收入</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!orders.length">
          <td colspan="10" class="empty-state">{{ emptyMessage }}</td>
        </tr>
        <tr
          v-for="item in orders"
          v-else
          :key="item.id"
          :class="{ selected: item.id === activeOrderId }"
          @click="$emit('select', item.id)"
        >
          <td>{{ item.微信名 }}</td>
          <td>{{ displayDateTime(item.创建时间) }}</td>
          <td>{{ displayDateTime(item.预约时间) }}</td>
          <td>{{ item.关卡 }}</td>
          <td>
            <div class="status-cell">
              <span :class="['badge', statusClassMap[item.状态] || 'pending']">
                <UiIcon :name="statusIconMap[item.状态] || 'pending'" size="sm" />
                {{ item.状态 }}
              </span>
              <div class="status-actions">
                <button
                  class="button secondary small"
                  type="button"
                  :disabled="item.状态 !== '取消'"
                  @click.stop="$emit('start', item.id)"
                >
                  <UiIcon name="sparkles" size="sm" />
                  开始
                </button>
                <button
                  class="button gold small"
                  type="button"
                  :disabled="item.状态 === '结束' || item.状态 === '取消'"
                  @click.stop="$emit('finish', item.id)"
                >
                  <UiIcon name="finished" size="sm" />
                  结束
                </button>
                <button
                  class="button danger small"
                  type="button"
                  :disabled="item.状态 === '取消' || item.状态 === '结束'"
                  @click.stop="$emit('cancel', item.id)"
                >
                  <UiIcon name="cancelled" size="sm" />
                  取消
                </button>
              </div>
            </div>
          </td>
          <td>
            <div class="record-time">
              <span><strong>结束</strong> {{ displayDateTime(item.结束时间) }}</span>
              <span><strong>取消</strong> {{ displayDateTime(item.取消时间) }}</span>
            </div>
          </td>
          <td>{{ item.难易程度 }}</td>
          <td>{{ displayDuration(item.预计需要时长) }}</td>
          <td class="income">{{ formatIncome(item.收入) }}</td>
          <td>
            <div class="row-actions">
              <button class="button secondary small" type="button" @click.stop="$emit('edit', item.id)">
                <UiIcon name="edit" size="sm" />
                编辑
              </button>
              <button class="button danger small" type="button" @click.stop="$emit('remove', item.id)">
                <UiIcon name="trash" size="sm" />
                删除
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import UiIcon from '@/components/UiIcon.vue';
import { displayDateTime, displayDuration, formatIncome, statusClassMap } from '@/utils/order';

const statusIconMap = {
  待开始: 'pending',
  结束: 'finished',
  取消: 'cancelled'
};

export default {
  name: 'OrdersTable',
  components: {
    UiIcon
  },
  props: {
    orders: {
      type: Array,
      required: true
    },
    activeOrderId: {
      type: String,
      default: ''
    },
    emptyMessage: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      statusClassMap,
      statusIconMap
    };
  },
  methods: {
    displayDateTime,
    displayDuration,
    formatIncome
  }
};
</script>
