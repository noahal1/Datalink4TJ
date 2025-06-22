// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Layouts from 'vite-plugin-vue-layouts'
import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'

// Utilities
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { splitVendorChunkPlugin } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      // Vue Router
      VueRouter({
        // 路由规则
        routesFolder: 'src/pages',
        extensions: ['.vue'],
        dts: './src/typed-router.d.ts',
      }),

      // Vue
      Vue({
        script: {
          defineModel: true,
          propsDestructure: true,
        },
      }),

      // Layouts
      Layouts(),

      // Vuetify
      Vuetify({
        autoImport: true,
        styles: { configFile: 'src/styles/settings.scss' },
      }),

      // 自动导入
      Components({
        dirs: ['src/components'],
        dts: 'src/components.d.ts',
      }),

      // 自动导入API
      AutoImport({
        imports: [
          'vue',
          VueRouterAutoImports,
          {
            'vue-router/auto': ['useLink'],
          },
          '@vueuse/core',
          'pinia'
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/stores/**', 'src/composables/**', 'src/utils/**'],
      }),
      
      // 分割代码块
      splitVendorChunkPlugin(),
      
      // 生产环境压缩
      compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 10240, // 只有大于10kb的文件才会被压缩
      }),
    ],
    
    // 定义路径别名
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      },
    },
    
    // Sass现代API配置
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern",
          silenceDeprecations: ['legacy-js-api']
        }
      }
    },
    
    // 服务器配置
    server: {
      port: parseInt(env.VITE_PORT || '3000'),
      host: env.VITE_HOST || '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    
    // 构建配置
    build: {
      // 设置文件大小警告阈值
      chunkSizeWarningLimit: 1600,
      // 将大的依赖模块拆分
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia', '@vueuse/core'],
            'ui-vendor': ['vuetify'],
            'chart-vendor': ['echarts', 'd3'],
            'date-vendor': ['date-fns', 'v-calendar', '@vuepic/vue-datepicker'],
          },
          // 使用内容哈希使文件名永远不会重复
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        },
      },
      // 开启source map
      sourcemap: mode === 'development',
      // 最小化混淆
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境去除console
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
      // 生产环境禁用CSS源映射
      cssCodeSplit: true,
      cssMinify: mode === 'production',
    },
    
    // 性能优化
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vuetify',
        'echarts',
        '@vueuse/core'
      ],
      // 排除不需要预构建的依赖
      exclude: ['@vueuse/motion'],
    },
    
    // 预构建缓存控制
    cacheControl: {
      hash: true,
      maxAge: 31536000, // 1年
    },
  }
})
