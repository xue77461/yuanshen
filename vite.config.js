import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'path';

const feishuOpenApiProxyPrefix = '/api/feishu-open-apis';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
       'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  
  build: {
    // 确保不把 vue 当外部依赖，而是打包进 assets
    rollupOptions: {
      external: []
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      [feishuOpenApiProxyPrefix]: {
        target: 'https://open.feishu.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/feishu-open-apis/, '/open-apis')
      }
    }
  }
});
