import { defineStore } from 'pinia'
import api from '../utils/api'
import { useUserStore } from './user'
import { format } from 'date-fns'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
    isLoading: false,
    lastUpdated: null
  }),
  
  getters: {
    // 获取最近的活动，默认限制为5条
    recentActivities: (state) => (limit = 5) => {
      return state.activities.slice(0, limit);
    },
    
    // 按部门筛选活动
    activitiesByDepartment: (state) => (department) => {
      return state.activities.filter(activity => activity.department === department);
    },
    
    // 按用户筛选活动
    activitiesByUser: (state) => (userId) => {
      return state.activities.filter(activity => activity.userId === userId);
    },
    
    // 按操作类型筛选活动
    activitiesByType: (state) => (type) => {
      return state.activities.filter(activity => activity.type === type);
    }
  },
  
  actions: {
    // 获取活动数据
    async fetchActivities() {
      this.isLoading = true;
      try {
        // 构建查询参数
        const params = { limit: 50 };
        
        // 调用API获取活动数据
        const response = await api.get('/activities/', params);
        
        // 检查返回数据格式
        console.log('活动数据响应:', response);
        
        // 正确处理API返回的数据格式 (支持 {items: [...]} 和 数组格式)
        let activitiesData = [];
        if (response && response.items && Array.isArray(response.items)) {
          // 处理 {items: [...]} 格式
          activitiesData = response.items;
        } else if (response && Array.isArray(response)) {
          // 处理直接返回数组的格式
          activitiesData = response;
        } else {
          console.error('获取活动数据格式错误:', response);
          return [];
        }
        
        // 处理返回的活动数据
        this.activities = activitiesData.map(activity => {
          return {
            ...activity,
            // 确保时间字段存在
            time: activity.time || this.formatTime(activity.timestamp || activity.created_at)
          };
        }).filter(activity => activity && activity.id); // 过滤掉无效的记录
        
        this.lastUpdated = new Date();
        return this.activities;
      } catch (error) {
        console.error('获取活动数据失败:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },
    
    // 记录数据变更活动
    async recordDataChange({ module, type, title, description, before, after, details = {} }) {
      try {
        // 调用后端API记录数据变更
        const response = await api.post('/activities/data-change/', {
          module,
          type,
          title,
          description,
          before,
          after,
          details
        });
        
        // 如果成功，将新活动添加到列表开头
        if (response && response.id) {
          this.activities.unshift(response);
          this.lastUpdated = new Date();
          return response;
        }
        
        return null;
      } catch (error) {
        console.error('记录数据变更失败:', error);
        return null;
      }
    },
    
    // 添加新活动
    async addActivity(activityData) {
      try {
        // 调用后端API创建活动
        const response = await api.post('/activities/', activityData);
        
        // 如果成功，将新活动添加到列表开头
        if (response && response.id) {
          this.activities.unshift(response);
          this.lastUpdated = new Date();
          return response;
        }
        
        return null;
      } catch (error) {
        console.error('添加活动失败:', error);
        return null;
      }
    },
    
    // 格式化时间
    formatTime(date) {
      if (!date) return '';
      
      // 如果是字符串，转换为Date对象
      if (typeof date === 'string') {
        date = new Date(date);
      }
      
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffMinutes < 1) return '刚刚';
      if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} 小时前`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        if (diffDays === 1) return '昨天';
        return `${diffDays} 天前`;
      }
      
      return format(date, 'yyyy-MM-dd');
    }
  },
  
  persist: {
    key: 'activity-store',
    storage: localStorage,
    paths: ['activities', 'lastUpdated']
  }
}); 