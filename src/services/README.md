# 服务层 (Services)

服务层是前端应用与后端API交互的统一接口，提供了清晰的API调用结构和错误处理机制。

## 目录结构

```
services/
  ├── apiService.js       # 基础API服务类
  ├── userService.js      # 用户服务
  ├── permissionService.js # 权限和角色服务
  ├── activityService.js  # 活动日志服务
  ├── departmentService.js # 部门服务
  ├── routeService.js     # 路由服务
  └── index.js            # 统一导出
```

## 设计原则

1. **统一接口**: 所有服务类继承自BaseApiService，提供统一的请求方法
2. **职责分离**: 每个服务类负责一个特定的业务领域
3. **单例模式**: 每个服务类都是单例，避免重复创建实例
4. **强类型**: 使用JSDoc提供类型提示，提升开发体验

## 使用方法

### 方式一：直接引入特定服务

```javascript
import { userService } from '@/services'

// 使用服务
async function login() {
  try {
    const result = await userService.login('username', 'password')
    return result
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

### 方式二：使用统一服务对象

```javascript
import services from '@/services'

// 使用服务
async function getPermissions() {
  try {
    const permissions = await services.permission.getPermissions()
    return permissions
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}
```

## 错误处理

服务层统一处理了常见的错误情况，并返回一致的错误对象。使用时建议使用try-catch来处理可能的异常：

```javascript
try {
  const roles = await permissionService.getRoles()
  // 处理成功响应
} catch (error) {
  // 处理错误
  console.error('获取角色列表失败:', error.message)
}
```

## 扩展服务

如需添加新的服务，请遵循以下步骤：

1. 创建新的服务类，继承BaseApiService
2. 实现必要的方法
3. 在index.js中导出新服务

示例：

```javascript
// myNewService.js
import BaseApiService from './apiService'

class MyNewService extends BaseApiService {
  constructor() {
    super('/my-endpoint')
  }
  
  async getItems() {
    return this.get()
  }
}

export default new MyNewService()

// 在index.js中添加
import myNewService from './myNewService'

export { 
  // ...现有服务
  myNewService
}

const services = {
  // ...现有服务
  myNew: myNewService
} 