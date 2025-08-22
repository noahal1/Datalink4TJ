/**
 * API 请求工具类
 */
import axios from 'axios'
import { useUserStore } from '../stores/user'
import Message from './notification'
import router from '../router'
import { convertApiRequest } from './idConverter'
import { shouldRefreshToken, isTokenExpired } from './tokenManager'
import { enableApiDebug } from './debugApi'
import { prepareApiData, hasCircularReference } from './reactiveUtils'

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// 生产环境不输出敏感信息
const isProduction = import.meta.env.PROD;
if (!isProduction) {
  console.log('API基础URL:', API_BASE_URL);
}

// 调试功能 - 仅在开发模式下打印日志
const isDebugMode = import.meta.env.DEV && true; // 开启调试模式
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[API]', ...args);
  }
};

// 公开API路径列表（不需要认证的API）
const PUBLIC_APIS = [
  '/users/token',
  '/login',
  '/auth/login',
  '/auth/register',
  '/public'
];

// 缓存控制 - 设置缓存最大有效时间
const CACHE_MAX_AGE = 10 * 60 * 1000; // 10分钟
const CACHE_PREFIX = 'api_cache_';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

/**
 * 获取缓存的API响应
 * @param {string} url - API URL
 * @returns {Object|null} - 缓存的响应数据或null
 */
const getCachedResponse = (url) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${url}`;
    const cachedItem = sessionStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const { data, timestamp } = JSON.parse(cachedItem);
    const now = Date.now();
    
    // 检查缓存是否过期
    if (now - timestamp > CACHE_MAX_AGE) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (e) {
    console.warn('读取缓存失败:', e);
    return null;
  }
};

/**
 * 缓存API响应
 * @param {string} url - API URL
 * @param {Object} data - 响应数据
 */
const cacheResponse = (url, data) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${url}`;
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (e) {
    console.warn('缓存API响应失败:', e);
  }
};

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 使用函数而不是直接导入，避免循环依赖
    const userStore = useUserStore()

    // 转换请求中的ID参数
    try {
      config = convertApiRequest(config)
      debug('ID参数转换完成:', config.url)
    } catch (error) {
      console.error('ID参数转换失败:', error)
      // 不阻止请求，但记录错误
    }

    // 确保Content-Type设置正确
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // 检查是否是公开API
    const isPublicApi = PUBLIC_APIS.some(path => config.url.includes(path));
    
    // 如果有token，则添加到请求头
    if (userStore.token) {
      // 确保Authorization头格式正确
      const token = userStore.token.trim();
      config.headers['Authorization'] = `Bearer ${token}`;
      debug(`请求添加认证头: ${config.method.toUpperCase()} ${config.url}`);
      
      // 临时禁用自动token刷新以避免卡顿问题
      // TODO: 重新启用token刷新功能

      // 检查Token是否过期
      if (isTokenExpired(token)) {
        debug('Token已过期，清除用户状态');
        // 不自动登出，让用户手动刷新页面
        console.warn('Token已过期，请刷新页面重新登录');
      }
    } else if (!isPublicApi) {
      // 如果是需要认证的API，且用户未登录，则拒绝请求
      debug(`未授权请求: ${config.method.toUpperCase()} ${config.url}`);
      
      // 如果是GET请求，尝试从缓存获取数据
      if (config.method.toLowerCase() === 'get') {
        const cachedData = getCachedResponse(config.url);
        if (cachedData) {
          debug(`使用缓存数据: ${config.url}`);
          // 返回缓存的数据，但同时在后台尝试登录
          return Promise.reject({
            response: {
              status: 200,
              data: cachedData,
              config,
              headers: {},
              isCachedData: true
            }
          });
        }
      }
      
      // 尝试重定向到登录页面
      if (router.currentRoute.value.path !== '/login') {
        Message.warning('请先登录');
        
        // 保存当前路径，登录后重定向回来
        const currentPath = router.currentRoute.value.path;
        if (currentPath !== '/login') {
          sessionStorage.setItem('redirectPath', currentPath);
          router.push('/login');
        }
        
        // 中断请求
        return Promise.reject(new Error('未授权'));
      }
    }
    
    // 输出请求详情（调试模式）
    if (isDebugMode) {
      debug('发送请求:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    debug(`请求成功: ${response.config.method.toUpperCase()} ${response.config.url}`);
    
    // 如果是GET请求，缓存响应数据
    if (response.config.method.toLowerCase() === 'get') {
      cacheResponse(response.config.url, response.data);
    }
    
    // 返回原始响应对象，保留响应结构
    return response;
  },
  error => {
    // 处理缓存数据的特殊情况
    if (error.response && error.response.isCachedData) {
      console.warn('使用缓存数据响应请求');
      return Promise.resolve(error.response);
    }
    
    // 网络错误处理
    if (!error.response) {
      if (!isProduction) {
        console.error('网络错误:', error);
      }
      Message.error('网络错误，请检查您的网络连接');
      
      // 尝试从缓存获取数据
      if (error.config && error.config.method.toLowerCase() === 'get') {
        const cachedData = getCachedResponse(error.config.url);
        if (cachedData) {
          console.warn('网络错误，使用缓存数据');
          return Promise.resolve({
            data: cachedData,
            status: 200,
            config: error.config,
            headers: {},
            fromCache: true
          });
        }
      }
      
      return Promise.reject(new Error('网络错误'));
    }
    
    const { status, config, data } = error.response
    console.error(`请求失败(${status}):`, config.method.toUpperCase(), config.url, data)
    
    // 处理特定错误码
    switch (status) {
      case 401:
        // 简化401错误处理，避免无限循环
        if (config.url.includes('/users/token') && !config.url.includes('/token/refresh')) {
          Message.error('用户名或密码错误')
        } else {
          console.warn('认证失败，请重新登录')

          // 检查是否是GET请求，尝试使用缓存
          if (config.method.toLowerCase() === 'get') {
            const cachedData = getCachedResponse(config.url);
            if (cachedData) {
              console.warn('认证失败，使用缓存数据');
              return Promise.resolve({
                data: cachedData,
                status: 200,
                config,
                headers: {},
                fromCache: true
              });
            }
          }

          // 显示友好的错误提示，但不自动登出
          if (!config.url.includes('/token/refresh')) {
            Message.error('登录状态已过期，请刷新页面重新登录')
          }
          
          Message.error('登录已过期，请重新登录')
          
          // 清除用户信息
          const userStore = useUserStore()
          userStore.logout()
          
          // 保存当前路径，登录后重定向回来
          const currentPath = router.currentRoute.value.path
          if (currentPath !== '/login') {
            sessionStorage.setItem('redirectPath', currentPath)
            // 重定向到登录页面
            router.push('/login')
          }
        }
        break
        
      case 403:
        Message.error('没有权限访问该资源')
        // 可能是因为用户不是管理员
        console.error('权限错误:', data?.detail || '权限不足')
        break
        
      case 404:
        Message.error('请求的资源不存在')
        break
        
      case 422:
        // 处理验证错误
        let validationError = '请求参数验证失败'
        if (data?.detail && Array.isArray(data.detail)) {
          // FastAPI验证错误格式
          const errors = data.detail.map(err => {
            const field = err.loc.slice(1).join('.')
            return `${field}: ${err.msg}`
          }).join('; ')
          validationError = `参数验证错误: ${errors}`
        } else if (data?.detail) {
          validationError = data.detail
        }
        console.error('验证错误:', validationError)
        Message.error(validationError)
        break
        
      case 500:
        Message.error('服务器错误，请联系管理员')
        console.error('服务器错误:', data?.detail || '未知服务器错误')
        break
        
      default:
        // 提取详细错误信息
        const errorMsg = error.response.data?.detail || '请求失败'
        Message.error(errorMsg)
    }
    
    return Promise.reject(error)
  }
)

// 对外导出的方法
/**
 * GET请求
 * @param {string} endpoint - API端点
 * @param {object} options - 请求选项，包含params等
 * @returns {Promise} - 请求Promise
 */
export function get(endpoint, options = {}) {
  // 添加默认的参数序列化器，确保参数不会被嵌套
  const defaultOptions = {
    paramsSerializer: params => {
      // 使用URLSearchParams确保参数格式正确
      return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
  };
  
  // 合并用户提供的选项和默认选项
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 记录实际发送的请求参数
  if (isDebugMode && options.params) {
    debug('GET请求参数:', options.params);
    debug('序列化后的查询字符串:', mergedOptions.paramsSerializer(options.params));
  }
  
  return api.get(endpoint, mergedOptions);
}

/**
 * POST请求
 * @param {string} endpoint - API端点
 * @param {object} data - 请求体数据
 * @returns {Promise} - 请求Promise
 */
export function post(endpoint, data = {}, config = {}) {
  // 自动处理响应式对象，避免循环引用
  const processedData = prepareApiData(data)

  // 在开发环境中检查循环引用
  if (import.meta.env.DEV && hasCircularReference(data)) {
    console.log('原始数据:', data)
    console.log('处理后数据:', processedData)
  }

  // 如果是FormData，需要特殊处理headers
  if (processedData instanceof FormData) {
    // 删除Content-Type，让浏览器自动设置（包括boundary）
    const formDataConfig = {
      ...config,
      headers: {
        ...config.headers
      }
    }
    // 删除Content-Type，让浏览器自动设置
    delete formDataConfig.headers['Content-Type']
    return api.post(endpoint, processedData, formDataConfig)
  }

  return api.post(endpoint, processedData, config)
}

/**
 * PUT请求
 * @param {string} endpoint - API端点
 * @param {object} data - 请求体数据
 * @returns {Promise} - 请求Promise
 */
export function put(endpoint, data = {}) {
  // 自动处理响应式对象，避免循环引用
  const processedData = prepareApiData(data)

  // 在开发环境中检查循环引用
  if (import.meta.env.DEV && hasCircularReference(data)) {
    console.log('原始数据:', data)
    console.log('处理后数据:', processedData)
  }

  return api.put(endpoint, processedData)
}

/**
 * PATCH请求
 * @param {string} endpoint - API端点
 * @param {object} data - 请求体数据
 * @returns {Promise} - 请求Promise
 */
export function patch(endpoint, data = {}) {
  // 自动处理响应式对象，避免循环引用
  const processedData = prepareApiData(data)

  // 在开发环境中检查循环引用
  if (import.meta.env.DEV && hasCircularReference(data)) {
    console.warn('⚠️ 检测到循环引用，已自动处理:', endpoint)
    console.log('原始数据:', data)
    console.log('处理后数据:', processedData)
  }

  return api.patch(endpoint, processedData)
}

/**
 * DELETE请求
 * @param {string} endpoint - API端点
 * @returns {Promise} - 请求Promise
 */
export function del(endpoint) {
  return api.delete(endpoint)
}

// 在开发环境启用API调试
if (import.meta.env.DEV) {
  enableApiDebug(api)
  console.log('🔧 开发环境API调试已启用')
}

// 导出默认对象
export default {
  get,
  post,
  put,
  patch,
  delete: del
}