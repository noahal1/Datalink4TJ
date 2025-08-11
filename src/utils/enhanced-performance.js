/**
 * 增强的前端性能监控工具
 * 提供全面的性能指标收集和分析
 */

class EnhancedPerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.isSupported = this.checkSupport()
    this.apiEndpoint = '/api/v1/monitoring/frontend'
    this.batchSize = 10
    this.batchTimeout = 5000
    this.pendingMetrics = []
    this.batchTimer = null
    this.sessionId = this.generateSessionId()
    
    if (this.isSupported) {
      this.init()
    }
  }

  /**
   * 检查浏览器支持
   */
  checkSupport() {
    return (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'PerformanceObserver' in window
    )
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 初始化性能监控
   */
  init() {
    this.observeNavigation()
    this.observePaint()
    this.observeResourceLoading()
    this.observeLongTasks()
    this.observeMemoryUsage()
    this.setupErrorTracking()
    this.setupUserInteractionTracking()
    this.setupRouteChangeTracking()
  }

  /**
   * 观察导航性能
   */
  observeNavigation() {
    if (typeof PerformanceObserver !== 'function') return
    
    try {
      const observer = new PerformanceObserver(entries => {
        const navigation = entries.getEntries()[0]
        
        const navigationMetrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          firstByte: navigation.responseStart - navigation.requestStart,
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseEnd - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          processing: navigation.domComplete - navigation.domLoading,
          onLoad: navigation.loadEventEnd - navigation.loadEventStart,
          timestamp: Date.now()
        }
        
        this.metrics.set('navigation', navigationMetrics)
        this.reportMetric('navigation', navigationMetrics)
      })
      
      observer.observe({ type: 'navigation', buffered: true })
      this.observers.set('navigation', observer)
    } catch (e) {
      console.warn('Navigation performance observer not supported:', e)
    }
  }

  /**
   * 观察绘制性能
   */
  observePaint() {
    if (typeof PerformanceObserver !== 'function') return
    
    try {
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver(entries => {
        const fcp = entries.getEntries()[0]
        this.reportMetric('FCP', { value: fcp.startTime, timestamp: Date.now() })
        fcpObserver.disconnect()
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
      
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver(entries => {
        const lcp = entries.getEntries().pop()
        this.reportMetric('LCP', { value: lcp.startTime, timestamp: Date.now() })
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver(entries => {
        const fid = entries.getEntries()[0]
        this.reportMetric('FID', { 
          value: fid.processingStart - fid.startTime, 
          timestamp: Date.now() 
        })
        fidObserver.disconnect()
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
      
      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.reportMetric('CLS', { value: clsValue, timestamp: Date.now() })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      
    } catch (e) {
      console.warn('Paint performance observer not supported:', e)
    }
  }

  /**
   * 观察资源加载性能
   */
  observeResourceLoading() {
    if (typeof PerformanceObserver !== 'function') return
    
    try {
      const resourceObserver = new PerformanceObserver(entries => {
        const resources = entries.getEntries()
        
        // 分析资源加载性能
        const resourceMetrics = this.analyzeResources(resources)
        
        // 筛选出加载时间较长的资源
        const slowResources = resources.filter(res => res.duration > 1000)
        
        if (slowResources.length > 0) {
          this.reportSlowResources(slowResources)
        }
        
        this.reportMetric('resources', resourceMetrics)
      })
      
      resourceObserver.observe({ type: 'resource', buffered: true })
    } catch (e) {
      console.warn('Resource performance observer not supported:', e)
    }
  }

  /**
   * 观察长任务
   */
  observeLongTasks() {
    if (typeof PerformanceObserver !== 'function') return
    
    try {
      const longTaskObserver = new PerformanceObserver(entries => {
        const longTasks = entries.getEntries()
        
        for (const task of longTasks) {
          this.reportMetric('longTask', {
            duration: task.duration,
            startTime: task.startTime,
            name: task.name,
            timestamp: Date.now()
          })
        }
      })
      
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch (e) {
      console.warn('Long task observer not supported:', e)
    }
  }

  /**
   * 观察内存使用情况
   */
  observeMemoryUsage() {
    if (!('memory' in performance)) return
    
    const reportMemory = () => {
      const memory = performance.memory
      this.reportMetric('memory', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      })
    }
    
    // 每30秒报告一次内存使用情况
    setInterval(reportMemory, 30000)
    
    // 页面卸载时报告
    window.addEventListener('beforeunload', reportMemory)
  }

  /**
   * 设置错误追踪
   */
  setupErrorTracking() {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportMetric('jsError', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      })
    })
    
    // Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportMetric('promiseRejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: Date.now()
      })
    })
    
    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.reportMetric('resourceError', {
          tagName: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: Date.now()
        })
      }
    }, true)
  }

  /**
   * 设置用户交互追踪
   */
  setupUserInteractionTracking() {
    let clickCount = 0
    
    // 点击事件（节流）
    document.addEventListener('click', this.throttle((event) => {
      clickCount++
      this.reportMetric('userInteraction', {
        type: 'click',
        target: event.target.tagName,
        count: clickCount,
        timestamp: Date.now()
      })
    }, 1000))
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.reportMetric('visibilityChange', {
        hidden: document.hidden,
        timestamp: Date.now()
      })
    })
  }

  /**
   * 设置路由变化追踪
   */
  setupRouteChangeTracking() {
    let currentRoute = window.location.pathname
    
    // 监听路由变化
    const trackRouteChange = () => {
      const newRoute = window.location.pathname
      if (newRoute !== currentRoute) {
        this.reportMetric('routeChange', {
          from: currentRoute,
          to: newRoute,
          timestamp: Date.now()
        })
        currentRoute = newRoute
      }
    }
    
    // 监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', trackRouteChange)
    
    // 监听pushstate和replacestate（程序化导航）
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args)
      setTimeout(trackRouteChange, 0)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      setTimeout(trackRouteChange, 0)
    }
  }

  /**
   * 分析资源性能
   */
  analyzeResources(resources) {
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      totalDuration: 0,
      byType: {},
      slowResources: 0,
      timestamp: Date.now()
    }
    
    for (const resource of resources) {
      const type = this.getResourceType(resource.name)
      
      if (!analysis.byType[type]) {
        analysis.byType[type] = { count: 0, duration: 0, size: 0 }
      }
      
      analysis.byType[type].count++
      analysis.byType[type].duration += resource.duration
      analysis.totalDuration += resource.duration
      
      if (resource.transferSize) {
        analysis.byType[type].size += resource.transferSize
        analysis.totalSize += resource.transferSize
      }
      
      if (resource.duration > 1000) {
        analysis.slowResources++
      }
    }
    
    return analysis
  }

  /**
   * 获取资源类型
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  /**
   * 节流函数
   */
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * 报告指标（批量处理）
   */
  reportMetric(name, value) {
    this.pendingMetrics.push({
      name,
      value,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
    
    // 达到批量大小或超时时发送
    if (this.pendingMetrics.length >= this.batchSize) {
      this.flushMetrics()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushMetrics()
      }, this.batchTimeout)
    }
  }

  /**
   * 发送指标到服务器
   */
  async flushMetrics() {
    if (this.pendingMetrics.length === 0) return
    
    const metrics = [...this.pendingMetrics]
    this.pendingMetrics = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics }),
        keepalive: true
      })
    } catch (error) {
      console.warn('Failed to send performance metrics:', error)
      // 失败的指标可以存储到localStorage稍后重试
      this.storeFailedMetrics(metrics)
    }
  }

  /**
   * 存储失败的指标
   */
  storeFailedMetrics(metrics) {
    try {
      const stored = JSON.parse(localStorage.getItem('failedMetrics') || '[]')
      stored.push(...metrics)
      // 只保留最近的100条
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100)
      }
      localStorage.setItem('failedMetrics', JSON.stringify(stored))
    } catch (e) {
      // localStorage可能已满，忽略错误
    }
  }

  /**
   * 重试发送失败的指标
   */
  async retryFailedMetrics() {
    try {
      const stored = JSON.parse(localStorage.getItem('failedMetrics') || '[]')
      if (stored.length > 0) {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ metrics: stored })
        })
        localStorage.removeItem('failedMetrics')
      }
    } catch (error) {
      console.warn('Failed to retry metrics:', error)
    }
  }

  /**
   * 报告缓慢资源
   */
  reportSlowResources(resources) {
    const slowResourceData = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: this.getResourceType(resource.name)
    }))
    
    this.reportMetric('slowResources', slowResourceData)
  }

  /**
   * 获取当前性能指标
   */
  getCurrentMetrics() {
    return Object.fromEntries(this.metrics)
  }

  /**
   * 清理观察器
   */
  cleanup() {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }
    
    // 发送剩余指标
    this.flushMetrics()
  }
}

// 创建全局实例
const performanceMonitor = new EnhancedPerformanceMonitor()

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup()
})

// 页面加载完成后尝试重试失败的指标
window.addEventListener('load', () => {
  performanceMonitor.retryFailedMetrics()
})

export default performanceMonitor
