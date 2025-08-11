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
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      // Vue Router
      VueRouter({
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
          sassOptions: {
            api: "modern-compiler",
            quietDeps: true
          }
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
          secure: false,
          rewrite: (path) => {
            // 只对不是以 /api/v1 开头的路径进行重写
            if (path.startsWith('/api/v1')) {
              console.log(`代理请求 (无需重写): ${path}`);
              return path;
            } else {
              const newPath = path.replace(/^\/api/, '/api/v1');
              console.log(`代理请求 (重写): ${path} -> ${newPath}`);
              return newPath;
            }
          },
        },
      },
    },
    
    // 构建配置 - 性能优化
    build: {
      // 设置文件大小警告阈值
      chunkSizeWarningLimit: 1600,
      // 目标浏览器
      target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
      // 将大的依赖模块拆分
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vue生态系统 - 保持在一起避免循环依赖
            if (id.includes('node_modules/vue') ||
                id.includes('node_modules/vue-router') ||
                id.includes('node_modules/pinia') ||
                id.includes('node_modules/pinia-plugin-persistedstate') ||
                id.includes('node_modules/@vueuse/core')) {
              return 'vue-core';
            }

            // UI框架 - 统一打包避免依赖问题
            if (id.includes('node_modules/vuetify')) {
              if (id.includes('vuetify/lib/components')) {
                return 'ui-components';
              }
              return 'ui-core';
            }

            // 图表相关 - 统一打包避免初始化问题
            if (id.includes('node_modules/echarts') ||
                id.includes('node_modules/vue-echarts') ||
                id.includes('node_modules/zrender')) {
              return 'chart-core';
            }

            // 日期处理
            if (id.includes('node_modules/date-fns') ||
                id.includes('node_modules/v-calendar') ||
                id.includes('node_modules/@vuepic/vue-datepicker')) {
              return 'date-vendor';
            }

            // 工具库
            if (id.includes('node_modules/lodash') ||
                id.includes('node_modules/axios') ||
                id.includes('node_modules/crypto-js')) {
              return 'utils-vendor';
            }

            // 其他node_modules依赖
            if (id.includes('node_modules')) {
              return 'vendors';
            }

            return null;
          },
          // 优化文件命名
          entryFileNames: (chunkInfo) => {
            return `assets/entry-[name].[hash].js`;
          },
          chunkFileNames: (chunkInfo) => {
            return `assets/chunk-[name].[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `assets/css/[name].[hash].${ext}`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return `assets/images/[name].[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `assets/fonts/[name].[hash].${ext}`;
            }
            return `assets/[name].[hash].${ext}`;
          }
        },
        // 外部依赖优化
        external: (id) => {
          // 在生产环境中，可以考虑将某些大型库设为外部依赖
          return false;
        }
      },
      // 开启source map（仅开发环境）
      sourcemap: mode === 'development',
      // 最小化混淆 - 增强配置
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
          // 移除未使用的代码
          dead_code: true,
          // 优化条件表达式
          conditionals: true,
          // 优化比较操作
          comparisons: true,
          // 优化求值
          evaluate: true,
          // 优化布尔值
          booleans: true,
          // 优化循环
          loops: true,
          // 移除未使用的函数参数
          unused: true,
          // 内联函数
          inline: 2,
        },
        mangle: {
          // 保留类名
          keep_classnames: false,
          // 保留函数名
          keep_fnames: false,
        },
        format: {
          // 移除注释
          comments: false,
        },
      },
      // CSS代码分离和压缩
      cssCodeSplit: true,
      cssMinify: mode === 'production',
      // 报告压缩详情
      reportCompressedSize: mode === 'production',
      // 写入文件系统缓存
      write: true,
      // 清空输出目录
      emptyOutDir: true,
    },
    
    // 性能优化 - 依赖预构建
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'pinia-plugin-persistedstate',
        'vuetify',
        'vuetify/components',
        'vuetify/directives',
        'echarts',
        'echarts/core',
        'echarts/charts',
        'echarts/charts/BarChart',
        'echarts/charts/LineChart',
        'echarts/charts/PieChart',
        'echarts/charts/RadarChart',
        'echarts/charts/ScatterChart',
        'echarts/components',
        'echarts/components/GridComponent',
        'echarts/components/TooltipComponent',
        'echarts/components/LegendComponent',
        'echarts/components/RadarComponent',
        'echarts/components/MarkPointComponent',
        'echarts/components/MarkLineComponent',
        'echarts/components/DataZoomComponent',
        'echarts/components/BrushComponent',
        'echarts/components/ToolboxComponent',
        'echarts/renderers',
        'echarts/renderers/CanvasRenderer',
        'vue-echarts',
        '@vueuse/core',
        '@vueuse/shared',
        'axios',
        'date-fns',
        'lodash-es',
        'crypto-js'
      ],
      exclude: [
        '@vueuse/motion',
        'vue-demi'
      ],
      // 强制预构建
      force: false,
      // 预构建缓存目录
      cacheDir: 'node_modules/.vite',
    },

    // 实验性功能
    experimental: {
      // 启用构建优化
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` }
        } else {
          return { css: `/${filename}` }
        }
      }
    },

    // 预览配置
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: true,
      headers: {
        'Cache-Control': 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    },
  }
})