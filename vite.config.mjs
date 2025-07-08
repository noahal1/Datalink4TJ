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
    
    // 构建配置
    build: {
      // 设置文件大小警告阈值
      chunkSizeWarningLimit: 1600,
      // 将大的依赖模块拆分
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vue相关依赖
            if (id.includes('node_modules/vue') || 
                id.includes('node_modules/vue-router') || 
                id.includes('node_modules/pinia') || 
                id.includes('node_modules/@vueuse/core')) {
              return 'vue-vendor';
            }
            
            // UI框架
            if (id.includes('node_modules/vuetify')) {
              return 'ui-vendor';
            }
            
            // 图表相关
            if (id.includes('node_modules/echarts') || 
                id.includes('node_modules/d3')) {
              return 'chart-vendor';
            }
            
            // 日期处理
            if (id.includes('node_modules/date-fns') || 
                id.includes('node_modules/v-calendar') || 
                id.includes('node_modules/@vuepic/vue-datepicker')) {
              return 'date-vendor';
            }
            
            // 其他node_modules依赖
            if (id.includes('node_modules')) {
              return 'vendors';
            }
            
            return null; // 对于非node_modules的代码不进行分块处理
          },
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
      exclude: ['@vueuse/motion'],
    },
    
    // 预构建缓存控制
    cacheControl: {
      hash: true,
      maxAge: 31536000, // 1年
    },
  }
})