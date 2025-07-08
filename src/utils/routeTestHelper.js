/**
 * 动态路由测试辅助工具
 * 用于验证动态路由系统是否正常工作
 */

import { componentMap } from '../router/dynamic'

/**
 * 测试所有组件是否能正常导入
 * @returns {Promise<Object>} 测试结果
 */
export async function testAllComponents() {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    details: []
  }
  
  console.log('🧪 开始测试所有组件导入...')
  
  for (const [componentName, componentLoader] of Object.entries(componentMap)) {
    results.total++
    
    try {
      console.log(`🔍 测试组件: ${componentName}`)
      const startTime = performance.now()
      
      const component = await componentLoader()
      
      const endTime = performance.now()
      const loadTime = Math.round(endTime - startTime)
      
      results.success++
      results.details.push({
        name: componentName,
        status: 'success',
        loadTime: `${loadTime}ms`,
        component: component
      })
      
      console.log(`✅ ${componentName} 导入成功 (${loadTime}ms)`)
      
    } catch (error) {
      results.failed++
      results.errors.push({
        component: componentName,
        error: error.message
      })
      results.details.push({
        name: componentName,
        status: 'failed',
        error: error.message
      })
      
      console.error(`❌ ${componentName} 导入失败:`, error.message)
    }
  }
  
  console.log(`🎯 组件测试完成: ${results.success}/${results.total} 成功`)
  
  return results
}

/**
 * 测试动态路由API连接
 * @returns {Promise<Object>} 测试结果
 */
export async function testDynamicRouteAPI() {
  try {
    console.log('🌐 测试动态路由API连接...')
    
    const { routeService } = await import('../services')
    const routes = await routeService.getNavigationTree()
    
    console.log(`✅ API连接成功，获取到 ${routes.length} 个路由`)
    
    return {
      success: true,
      routeCount: routes.length,
      routes: routes
    }
  } catch (error) {
    console.error('❌ API连接失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 生成路由测试报告
 * @returns {Promise<string>} 测试报告
 */
export async function generateRouteTestReport() {
  console.log('📊 生成动态路由测试报告...')
  
  const componentTest = await testAllComponents()
  const apiTest = await testDynamicRouteAPI()
  
  let report = '# 动态路由系统测试报告\n\n'
  report += `生成时间: ${new Date().toLocaleString()}\n\n`
  
  // 组件测试结果
  report += '## 组件导入测试\n'
  report += `- 总组件数: ${componentTest.total}\n`
  report += `- 成功导入: ${componentTest.success}\n`
  report += `- 导入失败: ${componentTest.failed}\n`
  report += `- 成功率: ${Math.round((componentTest.success / componentTest.total) * 100)}%\n\n`
  
  if (componentTest.failed > 0) {
    report += '### 失败的组件\n'
    componentTest.errors.forEach(error => {
      report += `- ${error.component}: ${error.error}\n`
    })
    report += '\n'
  }
  
  // API测试结果
  report += '## 动态路由API测试\n'
  if (apiTest.success) {
    report += `- ✅ API连接成功\n`
    report += `- 📊 获取路由数: ${apiTest.routeCount}\n\n`
  } else {
    report += `- ❌ API连接失败: ${apiTest.error}\n\n`
  }
  
  // 详细组件信息
  report += '## 组件详细信息\n'
  componentTest.details.forEach(detail => {
    const status = detail.status === 'success' ? '✅' : '❌'
    const info = detail.status === 'success' 
      ? `(${detail.loadTime})` 
      : `(${detail.error})`
    report += `- ${status} ${detail.name} ${info}\n`
  })
  
  return report
}

/**
 * 在控制台运行完整测试
 */
export async function runFullTest() {
  console.log('🚀 开始完整的动态路由系统测试...')
  
  const report = await generateRouteTestReport()
  
  console.log('\n' + '='.repeat(50))
  console.log('📋 测试报告:')
  console.log('='.repeat(50))
  console.log(report)
  
  return report
}

// 在开发环境中自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，确保应用已初始化
  setTimeout(() => {
    console.log('🔧 开发环境检测到，将在5秒后运行路由测试...')
    setTimeout(runFullTest, 5000)
  }, 1000)
}

export default {
  testAllComponents,
  testDynamicRouteAPI,
  generateRouteTestReport,
  runFullTest
}
