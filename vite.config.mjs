// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Layouts(),
    Vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
      ],
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    // 启用源码映射以便于生产环境调试
    sourcemap: false,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 压缩代码
    minify: 'terser',
    // Terser 选项
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 分块策略
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
          'ui-vendor': ['element-plus', 'vuetify', '@mdi/font'],
          'echarts-vendor': ['echarts', 'vue-echarts'],
        },
      },
    },
    // 设置较大的警告限制，以避免大包警告
    chunkSizeWarningLimit: 1000,
  },
  // 加速开发模式的热更新
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'vuetify',
      'echarts',
      'vue-echarts',
    ],
  },
})
