<template>
  <article class="form-card">
    <div class="section-head">
      <div>
        <h2>{{ formTitle }}</h2>
      </div>
      <div class="section-head-actions">
        <span class="helper">{{ editingHint }}</span>
        <button class="button secondary small" type="button" @click="$emit('cancel')">收起表单</button>
      </div>
    </div>

    <form class="field-grid" @submit.prevent="submitForm">
      <label>
        微信名
        <input ref="wechatNameInput" v-model.trim="localForm.wechatName" type="text" placeholder="例如：风起云涌" required>
      </label>

      <label>
        预约时间
        <input v-model="localForm.scheduleTime" type="datetime-local" required>
      </label>

      <label>
        关卡
        <input v-model.trim="localForm.stage" type="text" placeholder="例如：深境螺旋 12 层满星" required>
      </label>

      <div class="field-grid two-col">
        <label>
          难易程度
          <select v-model="localForm.difficulty" required>
            <option v-for="option in difficultyOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label>
          预计需要时长（分钟）
          <select v-model="localForm.duration" required>
            <option v-for="option in durationOptions" :key="option" :value="String(option)">
              {{ option }} 分钟
            </option>
          </select>
        </label>
      </div>

      <div class="field-grid two-col">
        <label>
          收入
          <input v-model="localForm.income" type="number" min="0" step="0.01" placeholder="例如：128" required>
        </label>
      </div>

      <div class="actions">
        <button class="button primary" type="submit" :disabled="!feishuReady">保存订单</button>
        <button class="button secondary" type="button" @click="$emit('cancel')">取消</button>
        <button class="button danger" type="button" :disabled="!canDelete" @click="$emit('remove')">
          删除当前订单
        </button>
      </div>
    </form>
  </article>
</template>

<script>
import { buildEmptyForm, difficultyOptions } from '@/utils/order';

export default {
  name: 'OrderFormPanel',
  props: {
    value: {
      type: Object,
      required: true
    },
    durationOptions: {
      type: Array,
      required: true
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    feishuReady: {
      type: Boolean,
      default: false
    },
    formTitle: {
      type: String,
      required: true
    },
    editingHint: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      difficultyOptions,
      localForm: this.cloneForm(this.value)
    };
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(nextValue) {
        this.localForm = this.cloneForm(nextValue);
      }
    },
    visible(nextValue) {
      if (nextValue) {
        this.$nextTick(() => {
          if (this.$refs.wechatNameInput) {
            this.$refs.wechatNameInput.focus();
          }
        });
      }
    }
  },
  methods: {
    cloneForm(formValue) {
      return {
        ...buildEmptyForm(),
        ...formValue
      };
    },
    submitForm() {
      this.$emit('save', { ...this.localForm });
    }
  }
};
</script>
