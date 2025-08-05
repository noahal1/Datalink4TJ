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
    // 全局定义
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      global: 'globalThis',
    },
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
      
      // 生产环境压缩
      ...(mode === 'production' ? [compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 10240, // 只有大于10kb的文件才会被压缩
        compressionOptions: {
          level: 9, // 最高压缩级别
        },
        deleteOriginalAssets: false, // 保留原始文件
      })] : []),
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
      // 启用HMR优化
      hmr: {
        overlay: true,
        // 减少HMR噪音
        clientErrorOverlay: false
      },
      // 文件监听优化
      watch: {
        // 忽略node_modules以提升性能
        ignored: ['**/node_modules/**', '**/dist/**'],
        // 使用轮询模式（如果在容器中运行）
        usePolling: false
      },
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
    
    // 构建配置
    build: {
      // 设置文件大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 构建目标
      target: 'es2015',
      // 将大的依赖模块拆分
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // 核心Vue依赖 - 最高优先级缓存
            if (id.includes('node_modules/vue/') && !id.includes('vue-router')) {
              return 'vue-core';
            }
            
            // Vue生态系统
            if (id.includes('node_modules/vue-router') || 
                id.includes('node_modules/pinia') || 
                id.includes('node_modules/@vueuse/core')) {
              return 'vue-ecosystem';
            }
            
            // UI框架 - 按模块细分
            if (id.includes('node_modules/vuetify')) {
              if (id.includes('components')) {
                return 'vuetify-components';
              }
              return 'vuetify-core';
            }
            
            // 图标库
            if (id.includes('node_modules/@mdi/font') || 
                id.includes('node_modules/remixicon')) {
              return 'icon-fonts';
            }
            
            // 图表库 - 分离大型图表库
            if (id.includes('node_modules/echarts')) {
              return 'echarts';
            }
            if (id.includes('node_modules/d3')) {
              return 'd3-charts';
            }
            if (id.includes('node_modules/vue-echarts')) {
              return 'vue-charts';
            }
            
            // 日期处理库
            if (id.includes('node_modules/date-fns') || 
                id.includes('node_modules/v-calendar') || 
                id.includes('node_modules/@vuepic/vue-datepicker') ||
                id.includes('node_modules/@schedule-x')) {
              return 'date-utils';
            }
            
            // 工具库
            if (id.includes('node_modules/lodash') || 
                id.includes('node_modules/axios') || 
                id.includes('node_modules/crypto-js')) {
              return 'utils-vendor';
            }
            
            // Excel处理
            if (id.includes('node_modules/xlsx')) {
              return 'excel-vendor';
            }
            
            // 其他第三方库
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
            
            return null;
          },
          // 优化文件命名和缓存策略
          entryFileNames: (chunkInfo) => {
            return 'assets/[name].[hash].js';
          },
          chunkFileNames: () => {
            return 'assets/chunks/[name].[hash].js';
          },
          assetFileNames: (assetInfo) => {
            // 资源文件分类存放
            
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return 'assets/media/[name].[hash].[ext]';
            }
            if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
              return 'assets/images/[name].[hash].[ext]';
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return 'assets/fonts/[name].[hash].[ext]';
            }
            if (/\.css$/i.test(assetInfo.name)) {
              return 'assets/styles/[name].[hash].[ext]';
            }
            return 'assets/[name].[hash].[ext]';
          }
        },
        // 外部依赖优化
        external: mode === 'production' ? [] : [],
      },
      // 开启source map
      sourcemap: mode === 'development',
      // 最小化混淆
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
          // 移除未使用的代码
          dead_code: true,
          // 内联函数调用
          inline: 2,
          // 删除未使用的变量
          unused: true,
        },
        mangle: {
          // 保留函数名称以便调试
          keep_fnames: mode === 'development',
        },
      },
      // CSS优化
      cssCodeSplit: true,
      cssMinify: mode === 'production',
      // 启用实验性功能
      reportCompressedSize: false, // 禁用压缩大小报告以提升构建速度
      // 输出目录清理
      emptyOutDir: true,
    },
    
    // 性能优化
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vuetify',
        'vuetify/components',
        'vuetify/directives',
        'echarts/core',
        'echarts/charts',
        'echarts/renderers',
        'echarts/components',
        'vue-echarts',
        '@vueuse/core',
        'axios',
        'lodash-es',
        'date-fns',
        'crypto-js'
      ],
      exclude: [
        '@vueuse/motion',
        // 排除大型可选依赖
        'xlsx'
      ],
      // 强制重新预构建
      force: false,
      // 开发环境下的依赖预构建配置
      esbuildOptions: {
        target: 'es2015',
        // 优化大型库的构建
        plugins: [],
        // 修复循环引用问题
        define: {
          global: 'globalThis',
        }
      }
    },
    
    
    // 预览服务器配置
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT || '4173'),
      host: env.VITE_HOST || '0.0.0.0',
    },
  }
})