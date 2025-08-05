import { addDynamicRoutes } from '@/router'
import componentRegistrationService from '@/services/componentRegistrationService'

export async function initializeApp() {
  console.log('开始应用初始化...')

  try {
    console.log('步骤1: 注册前端组件到后端...')
    await componentRegistrationService.autoRegister({
      retryDelay: 2000,
      maxRetries: 2
    })

    console.log('步骤2: 加载动态路由...')
    const routes = await addDynamicRoutes()
    console.log(`应用初始化完成! 成功加载 ${routes.length} 个动态路由`)

    return { success: true, routes }
  } catch (err) {
    console.error('应用初始化过程中出现错误:', err)
    console.log('应用将继续运行，动态路由将在首次访问时延迟加载')
    return { success: false, error: err }
  }
}