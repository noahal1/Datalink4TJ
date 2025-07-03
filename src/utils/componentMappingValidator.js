/**
 * 组件映射验证工具
 * 用于在开发和测试环境中验证组件映射的一致性
 */

import { 
  getAvailableComponents, 
  validateComponentMapping 
} from '../router/dynamic'
import routeService from '../services/routeService'

/**
 * 从路由数组中提取所有组件名称
 * @param {Array} routes 路由数组
 * @returns {Array<string>} 组件名称数组
 */
function extractComponentsFromRoutes(routes) {
  const components = []
  if (!routes || !Array.isArray(routes)) return components
  
  routes.forEach(route => {
    if (route.component && typeof route.component === 'string') {
      components.push(route.component)
    }
    if (route.children && Array.isArray(route.children)) {
      components.push(...extractComponentsFromRoutes(route.children))
    }
  })
  
  return [...new Set(components)] // 去重
}

/**
 * 执行完整的组件映射验证
 * @returns {Promise<Object>} 验证结果
 */
export async function validateComponentMappingComplete() {
  try {
    console.log('🔍 开始组件映射验证...')
    
    // 获取硬编码的组件映射
    const mappedComponents = getAvailableComponents()
    console.log(`📋 硬编码组件数量: ${mappedComponents.length}`)
    console.log(`📋 硬编码组件列表:`, mappedComponents)
    
    // 获取API返回的路由数据
    const routes = await routeService.getNavigationTree()
    const apiComponents = extractComponentsFromRoutes(routes)
    console.log(`🌐 API返回组件数量: ${apiComponents.length}`)
    console.log(`🌐 API返回组件列表:`, apiComponents)
    
    // 执行一致性检查
    const validationResult = validateComponentMapping(apiComponents)
    
    // 输出详细结果
    console.log('\n📊 验证结果:')
    console.log(`✅ 一致性检查: ${validationResult.isConsistent ? '通过' : '失败'}`)
    console.log(`📈 硬编码组件总数: ${validationResult.totalMapped}`)
    console.log(`📈 API组件总数: ${validationResult.totalFromApi}`)
    
    if (validationResult.missingInMap.length > 0) {
      console.log(`❌ 缺失映射的组件 (${validationResult.missingInMap.length}):`, validationResult.missingInMap)
    }
    
    if (validationResult.missingInApi.length > 0) {
      console.log(`⚠️ 未被API使用的组件 (${validationResult.missingInApi.length}):`, validationResult.missingInApi)
    }
    
    return {
      success: true,
      mappedComponents,
      apiComponents,
      validationResult
    }
    
  } catch (error) {
    console.error('❌ 组件映射验证失败:', error)
    return {
      success: false,
      error: error.message,
      mappedComponents: [],
      apiComponents: [],
      validationResult: null
    }
  }
}

/**
 * 生成组件映射修复建议
 * @param {Object} validationResult 验证结果
 * @returns {Object} 修复建议
 */
export function generateFixSuggestions(validationResult) {
  const suggestions = {
    addToMap: [],
    removeFromMap: [],
    actions: []
  }
  
  if (!validationResult) return suggestions
  
  // 需要添加到映射表的组件
  if (validationResult.missingInMap.length > 0) {
    suggestions.addToMap = validationResult.missingInMap
    suggestions.actions.push({
      type: 'add',
      description: `添加 ${validationResult.missingInMap.length} 个缺失的组件映射`,
      components: validationResult.missingInMap
    })
  }
  
  // 可以从映射表移除的组件（排除DefaultLayout）
  const unnecessaryComponents = validationResult.missingInApi.filter(
    comp => comp !== 'DefaultLayout' && comp !== 'ComponentMappingDebug'
  )
  
  if (unnecessaryComponents.length > 0) {
    suggestions.removeFromMap = unnecessaryComponents
    suggestions.actions.push({
      type: 'remove',
      description: `考虑移除 ${unnecessaryComponents.length} 个未使用的组件映射`,
      components: unnecessaryComponents
    })
  }
  
  return suggestions
}

/**
 * 在开发环境中自动运行验证
 */
export function autoValidateInDevelopment() {
  if (process.env.NODE_ENV === 'development') {
    // 延迟执行，确保应用已初始化
    setTimeout(async () => {
      const result = await validateComponentMappingComplete()
      
      if (!result.success) {
        console.warn('⚠️ 组件映射验证失败，请检查网络连接或API状态')
        return
      }
      
      if (!result.validationResult.isConsistent) {
        console.warn('\n🚨 检测到组件映射不一致问题！')
        console.warn('建议访问 /component-mapping-debug 页面查看详细信息')
        
        const suggestions = generateFixSuggestions(result.validationResult)
        if (suggestions.actions.length > 0) {
          console.warn('\n💡 修复建议:')
          suggestions.actions.forEach(action => {
            console.warn(`- ${action.description}:`, action.components)
          })
        }
      } else {
        console.log('✅ 组件映射一致性检查通过')
      }
    }, 2000)
  }
}

/**
 * 创建组件映射报告
 * @returns {Promise<string>} 报告内容
 */
export async function generateComponentMappingReport() {
  const result = await validateComponentMappingComplete()
  
  if (!result.success) {
    return `组件映射验证失败: ${result.error}`
  }
  
  const { mappedComponents, apiComponents, validationResult } = result
  
  let report = '# 组件映射报告\n\n'
  report += `生成时间: ${new Date().toLocaleString()}\n\n`
  
  report += '## 概览\n'
  report += `- 硬编码组件数量: ${validationResult.totalMapped}\n`
  report += `- API返回组件数量: ${validationResult.totalFromApi}\n`
  report += `- 一致性状态: ${validationResult.isConsistent ? '✅ 一致' : '❌ 不一致'}\n\n`
  
  report += '## 硬编码组件列表\n'
  mappedComponents.forEach(comp => {
    const isUsed = apiComponents.includes(comp) || comp === 'DefaultLayout' || comp === 'ComponentMappingDebug'
    report += `- ${comp} ${isUsed ? '✅' : '⚠️'}\n`
  })
  
  report += '\n## API返回组件列表\n'
  apiComponents.forEach(comp => {
    const isMapped = mappedComponents.includes(comp)
    report += `- ${comp} ${isMapped ? '✅' : '❌'}\n`
  })
  
  if (validationResult.missingInMap.length > 0) {
    report += '\n## 缺失映射的组件\n'
    validationResult.missingInMap.forEach(comp => {
      report += `- ${comp} ❌\n`
    })
  }
  
  if (validationResult.missingInApi.length > 0) {
    report += '\n## 未被API使用的组件\n'
    validationResult.missingInApi.forEach(comp => {
      if (comp !== 'DefaultLayout' && comp !== 'ComponentMappingDebug') {
        report += `- ${comp} ⚠️\n`
      }
    })
  }
  
  return report
}

// 在开发环境中自动运行验证
autoValidateInDevelopment()

export default {
  validateComponentMappingComplete,
  generateFixSuggestions,
  generateComponentMappingReport,
  autoValidateInDevelopment
}
