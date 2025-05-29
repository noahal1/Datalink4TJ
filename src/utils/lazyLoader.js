import { defineAsyncComponent } from 'vue'
import { ElLoading } from 'element-plus'

/**
 * 创建异步组件的工厂函数，带加载和错误状态
 * @param {Function} loader - 异步加载函数
 * @param {Object} options - 选项
 * @returns {Component} 异步组件
 */
export function createLazyComponent(loader, options = {}) {
  const defaultOptions = {
    delay: 200,
    timeout: 30000,
    loadingComponent: null, // 默认使用ElLoading服务
    errorComponent: null,
    onError: null
  }
  
  const mergedOptions = { ...defaultOptions, ...options }
  
  return defineAsyncComponent({
    loader,
    
    // 加载组件的最小延迟时间，避免闪烁
    delay: mergedOptions.delay,
    
    // 超时时间
    timeout: mergedOptions.timeout,
    
    // 加载时使用的组件
    loadingComponent: mergedOptions.loadingComponent,
    
    // 错误时使用的组件
    errorComponent: mergedOptions.errorComponent,
    
    // 使用自定义加载指示器
    onError: mergedOptions.onError || ((error, retry, fail, attempts) => {
      console.error('加载组件失败:', error)
      
      if (attempts <= 3) {
        console.log(`尝试重新加载组件(${attempts})...`)
        retry()
      } else {
        fail()
      }
    }),
    
    // 使用服务式loading
    suspensible: false,
    
    /**
     * 如果没有提供加载组件，使用ElLoading服务
     */
    onPending: () => {
      if (!mergedOptions.loadingComponent) {
        const loading = ElLoading.service({
          fullscreen: false,
          text: '加载组件中...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        // 保存loading实例以便在加载完成后关闭
        return loading
      }
      return null
    },
    
    /**
     * 组件成功加载后关闭loading
     */
    onResolve: (el, context, loadingInstance) => {
      if (loadingInstance) {
        loadingInstance.close()
      }
    },
    
    /**
     * 组件加载失败后关闭loading
     */
    onReject: (error, context, loadingInstance) => {
      if (loadingInstance) {
        loadingInstance.close()
      }
    }
  })
}

/**
 * 基于路径创建懒加载组件
 * @param {String} path - 组件路径
 * @param {Object} options - 配置选项
 * @returns {Component} 异步组件
 */
export function lazyLoadByPath(path, options = {}) {
  return createLazyComponent(
    () => import(/* @vite-ignore */ path),
    options
  )
}

/**
 * 使用函数生成器创建按需加载的路由，用于代码分割
 */
export function createLazyRoutes(routes) {
  return routes.map(route => {
    // 如果route有component属性且是字符串(路径)，转换为异步组件
    if (route.component && typeof route.component === 'string') {
      route.component = lazyLoadByPath(route.component)
    }
    
    // 递归处理子路由
    if (route.children && route.children.length > 0) {
      route.children = createLazyRoutes(route.children)
    }
    
    return route
  })
} 