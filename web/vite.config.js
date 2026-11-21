import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 开发期把 /api 代理到 Node 服务；生产构建输出到 server/public，由 Express 同源托管（单端口部署）
export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
});
