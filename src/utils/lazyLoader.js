import { h } from 'vue'

/**
 * 创建异步组件的工厂函数
 * @param {Function} loader - 异步加载函数
 * @returns {Function} 异步组件加载函数
 */
export function createLazyComponent(loader) {
  // 直接返回加载函数
  return loader
}

/**
 * 基于路径创建懒加载组件
 * @param {String} path - 组件路径
 * @returns {Function} 异步组件加载函数
 */
export function lazyLoadByPath(path) {
  return () => import(/* @vite-ignore */ path)
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