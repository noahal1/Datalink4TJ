/**
 * 性能监控工具
 */
class PerformanceMonitor {
  constructor() {
    this.measures = {}
    this.isSupported = typeof window !== 'undefined' && 
                      window.performance && 
                      window.performance.mark && 
                      window.performance.measure
    
    if (this.isSupported) {
      this.observePageMetrics()
      this.observeResourceLoading()
    }
  }

  /**
   * 开始测量
   * @param {String} id - 测量ID
   */
  startMeasure(id) {
    if (!this.isSupported) return
    
    const markName = `start_${id}`
    window.performance.mark(markName)
    this.measures[id] = {
      start: markName
    }
  }

  /**
   * 结束测量
   * @param {String} id - 测量ID
   * @returns {Number|null} - 测量时间(毫秒)
   */
  endMeasure(id) {
    if (!this.isSupported || !this.measures[id]) return null
    
    const endMarkName = `end_${id}`
    const measureName = `measure_${id}`
    const { start } = this.measures[id]
    
    // 创建结束标记和测量
    window.performance.mark(endMarkName)
    window.performance.measure(measureName, start, endMarkName)
    
    // 获取测量结果
    const entries = window.performance.getEntriesByName(measureName)
    const duration = entries[0].duration
    
    // 清理
    this.clearMeasure(id)
    
    return duration
  }

  /**
   * 清理测量
   * @param {String} id - 测量ID
   */
  clearMeasure(id) {
    if (!this.isSupported || !this.measures[id]) return
    
    const { start } = this.measures[id]
    const endMarkName = `end_${id}`
    const measureName = `measure_${id}`
    
    try {
      window.performance.clearMarks(start)
      window.performance.clearMarks(endMarkName)
      window.performance.clearMeasures(measureName)
    } catch (e) {
      // 清理性能标记失败时静默处理
    }
    
    delete this.measures[id]
  }

  /**
   * 观察页面指标
   */
  observePageMetrics() {
    if (typeof PerformanceObserver !== 'function') return
    
    try {
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver(entries => {
        const fcp = entries.getEntries()[0]
      
        if (import.meta.env.PROD) {
          this.reportMetric('FCP', fcp.startTime)
        }
        
        fcpObserver.disconnect()
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
      
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver(entries => {
        const lcp = entries.getEntries().pop()
        
        if (import.meta.env.PROD) {
          this.reportMetric('LCP', lcp.startTime)
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver(entries => {
        const fid = entries.getEntries()[0]
        
        if (import.meta.env.PROD) {
          this.reportMetric('FID', fid.processingStart - fid.startTime)
        }
        
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
        
        if (import.meta.env.PROD) {
          this.reportMetric('CLS', clsValue)
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      
    } catch (e) {
      // 创建性能观察器失败时静默处理
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
        
        // 筛选出加载时间较长的资源
        const slowResources = resources.filter(res => res.duration > 1000)
        
        if (import.meta.env.PROD && slowResources.length > 0) {
          this.reportSlowResources(slowResources)
        }
      })
      
      resourceObserver.observe({ type: 'resource', buffered: true })
    } catch (e) {
      // 创建资源性能观察器失败时静默处理
    }
  }

  /**
   * 报告指标
   * @param {String} name - 指标名称
   * @param {Number} value - 指标值
   */
  reportMetric(name, value) {
    // 实现向服务器报告指标的逻辑
  }

  /**
   * 报告缓慢资源
   * @param {Array} resources - 资源数组
   */
  reportSlowResources(resources) {
    // 实现向服务器报告缓慢资源的逻辑
  }

  /**
   * 安装性能监控
   * @param {Vue} app - Vue应用实例
   */
  install(app) {
    app.config.globalProperties.$performance = this
  }
}

export default new PerformanceMonitor() 