// vite.config.mjs
import AutoImport from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/unplugin-vue-components/dist/vite.js";
import Fonts from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/unplugin-fonts/dist/vite.mjs";
import Layouts from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/vite-plugin-vue-layouts/dist/index.mjs";
import Vue from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueRouter from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/unplugin-vue-router/dist/vite.js";
import Vuetify, { transformAssetUrls } from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/vite-plugin-vuetify/dist/index.mjs";
import { defineConfig } from "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/noaha/OneDrive/Desktop/work_prj/datalink/Datalink4TJ/vite.config.mjs";
var vite_config_default = defineConfig({
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
        configFile: "src/styles/settings.scss"
      }
    }),
    Components(),
    Fonts({
      google: {
        families: [{
          name: "Roboto",
          styles: "wght@100;300;400;500;700;900"
        }]
      }
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router"
      ],
      eslintrc: {
        enabled: true
      },
      vueTemplate: true
    })
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    },
    extensions: [
      ".js",
      ".json",
      ".jsx",
      ".mjs",
      ".ts",
      ".tsx",
      ".vue"
    ]
  },
  server: {
    port: 3e3
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler"
      }
    }
  },
  build: {
    // 启用源码映射以便于生产环境调试
    sourcemap: false,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 压缩代码
    minify: "terser",
    // Terser 选项
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 分块策略
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "vue-router", "pinia", "pinia-plugin-persistedstate"],
          "ui-vendor": ["vuetify"],
          "echarts-vendor": ["echarts", "vue-echarts"]
        }
      }
    },
    // 设置较大的警告限制，以避免大包警告
    chunkSizeWarningLimit: 1e3
  },
  // 加速开发模式的热更新
  optimizeDeps: {
    include: [
      "vue",
      "vue-router",
      "pinia",
      "vuetify",
      "echarts",
      "vue-echarts"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbm9haGFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFx3b3JrX3ByalxcXFxkYXRhbGlua1xcXFxEYXRhbGluazRUSlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbm9haGFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFx3b3JrX3ByalxcXFxkYXRhbGlua1xcXFxEYXRhbGluazRUSlxcXFx2aXRlLmNvbmZpZy5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL25vYWhhL09uZURyaXZlL0Rlc2t0b3Avd29ya19wcmovZGF0YWxpbmsvRGF0YWxpbms0VEovdml0ZS5jb25maWcubWpzXCI7Ly8gUGx1Z2luc1xuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXG5pbXBvcnQgRm9udHMgZnJvbSAndW5wbHVnaW4tZm9udHMvdml0ZSdcbmltcG9ydCBMYXlvdXRzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1sYXlvdXRzJ1xuaW1wb3J0IFZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgVnVlUm91dGVyIGZyb20gJ3VucGx1Z2luLXZ1ZS1yb3V0ZXIvdml0ZSdcbmltcG9ydCBWdWV0aWZ5LCB7IHRyYW5zZm9ybUFzc2V0VXJscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZXRpZnknXG5cbi8vIFV0aWxpdGllc1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIFZ1ZVJvdXRlcigpLFxuICAgIExheW91dHMoKSxcbiAgICBWdWUoe1xuICAgICAgdGVtcGxhdGU6IHsgdHJhbnNmb3JtQXNzZXRVcmxzIH1cbiAgICB9KSxcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdnVldGlmeWpzL3Z1ZXRpZnktbG9hZGVyL3RyZWUvbWFzdGVyL3BhY2thZ2VzL3ZpdGUtcGx1Z2luI3JlYWRtZVxuICAgIFZ1ZXRpZnkoe1xuICAgICAgYXV0b0ltcG9ydDogdHJ1ZSxcbiAgICAgIHN0eWxlczoge1xuICAgICAgICBjb25maWdGaWxlOiAnc3JjL3N0eWxlcy9zZXR0aW5ncy5zY3NzJyxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgQ29tcG9uZW50cygpLFxuICAgIEZvbnRzKHtcbiAgICAgIGdvb2dsZToge1xuICAgICAgICBmYW1pbGllczogW3tcbiAgICAgICAgICBuYW1lOiAnUm9ib3RvJyxcbiAgICAgICAgICBzdHlsZXM6ICd3Z2h0QDEwMDszMDA7NDAwOzUwMDs3MDA7OTAwJyxcbiAgICAgICAgfV0sXG4gICAgICB9LFxuICAgIH0pLFxuICAgIEF1dG9JbXBvcnQoe1xuICAgICAgaW1wb3J0czogW1xuICAgICAgICAndnVlJyxcbiAgICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgICAgXSxcbiAgICAgIGVzbGludHJjOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgdnVlVGVtcGxhdGU6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIGRlZmluZTogeyAncHJvY2Vzcy5lbnYnOiB7fSB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gICAgZXh0ZW5zaW9uczogW1xuICAgICAgJy5qcycsXG4gICAgICAnLmpzb24nLFxuICAgICAgJy5qc3gnLFxuICAgICAgJy5tanMnLFxuICAgICAgJy50cycsXG4gICAgICAnLnRzeCcsXG4gICAgICAnLnZ1ZScsXG4gICAgXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Fzczoge1xuICAgICAgICBhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIFx1NTQyRlx1NzUyOFx1NkU5MFx1NzgwMVx1NjYyMFx1NUMwNFx1NEVFNVx1NEZCRlx1NEU4RVx1NzUxRlx1NEVBN1x1NzNBRlx1NTg4M1x1OEMwM1x1OEJENVxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgLy8gXHU1NDJGXHU3NTI4IENTUyBcdTRFRTNcdTc4MDFcdTUyMDZcdTUyNzJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgLy8gXHU1MzhCXHU3RjI5XHU0RUUzXHU3ODAxXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICAvLyBUZXJzZXIgXHU5MDA5XHU5ODc5XG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIFx1NTIwNlx1NTc1N1x1N0I1Nlx1NzU2NVxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAndnVlLXZlbmRvcic6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnLCAncGluaWEtcGx1Z2luLXBlcnNpc3RlZHN0YXRlJ10sXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFsndnVldGlmeSddLFxuICAgICAgICAgICdlY2hhcnRzLXZlbmRvcic6IFsnZWNoYXJ0cycsICd2dWUtZWNoYXJ0cyddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIFx1OEJCRVx1N0Y2RVx1OEY4M1x1NTkyN1x1NzY4NFx1OEI2Nlx1NTQ0QVx1OTY1MFx1NTIzNlx1RkYwQ1x1NEVFNVx1OTA3Rlx1NTE0RFx1NTkyN1x1NTMwNVx1OEI2Nlx1NTQ0QVxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgfSxcbiAgLy8gXHU1MkEwXHU5MDFGXHU1RjAwXHU1M0QxXHU2QTIxXHU1RjBGXHU3Njg0XHU3MEVEXHU2NkY0XHU2NUIwXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICd2dWUnLFxuICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgICAgJ3BpbmlhJyxcbiAgICAgICd2dWV0aWZ5JyxcbiAgICAgICdlY2hhcnRzJyxcbiAgICAgICd2dWUtZWNoYXJ0cycsXG4gICAgXSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sYUFBYTtBQUNwQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sV0FBVywwQkFBMEI7QUFHNUMsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlLFdBQVc7QUFYK00sSUFBTSwyQ0FBMkM7QUFjblMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsSUFBSTtBQUFBLE1BQ0YsVUFBVSxFQUFFLG1CQUFtQjtBQUFBLElBQ2pDLENBQUM7QUFBQTtBQUFBLElBRUQsUUFBUTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osUUFBUTtBQUFBLFFBQ04sWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxJQUNYLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxRQUNOLFVBQVUsQ0FBQztBQUFBLFVBQ1QsTUFBTTtBQUFBLFVBQ04sUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUSxFQUFFLGVBQWUsQ0FBQyxFQUFFO0FBQUEsRUFDNUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxJQUN0RDtBQUFBLElBQ0EsWUFBWTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILHFCQUFxQjtBQUFBLE1BQ25CLE1BQU07QUFBQSxRQUNKLEtBQUs7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsV0FBVztBQUFBO0FBQUEsSUFFWCxjQUFjO0FBQUE7QUFBQSxJQUVkLFFBQVE7QUFBQTtBQUFBLElBRVIsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixjQUFjLENBQUMsT0FBTyxjQUFjLFNBQVMsNkJBQTZCO0FBQUEsVUFDMUUsYUFBYSxDQUFDLFNBQVM7QUFBQSxVQUN2QixrQkFBa0IsQ0FBQyxXQUFXLGFBQWE7QUFBQSxRQUM3QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
