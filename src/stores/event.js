import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './user'
import { format, parseISO, isToday, isBefore, differenceInDays } from 'date-fns'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [],
    upcomingEvents: [],
    isLoading: false,
    lastUpdated: null
  }),
  
  getters: {
    // 获取所有事件
    allEvents: (state) => {
      return state.events;
    },
    
    // 获取即将开始的事件
    getUpcomingEvents: (state) => (limit = 5) => {
      return state.upcomingEvents.slice(0, limit);
    },
    
    // 按类型筛选事件
    eventsByType: (state) => (type) => {
      return state.events.filter(event => event.type === type);
    },
    
    // 按日期范围筛选事件
    eventsByDateRange: (state) => (startDate, endDate) => {
      return state.events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });
    }
  },
  
  actions: {
    // 获取所有事件
    async fetchEvents() {
      this.isLoading = true;
      try {
        const userStore = useUserStore();
        // 调用API获取事件数据
        const response = await axios.get(`${API_BASE_URL}/events/`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          this.events = response.data;
          this.lastUpdated = new Date();
          return this.events;
        } else {
          console.error('获取事件数据格式错误:', response);
          return [];
        }
      } catch (error) {
        console.error('获取事件数据失败:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取即将开始的事件
    async fetchUpcomingEvents(limit = 10) {
      this.isLoading = true;
      try {
        const userStore = useUserStore();
        // 调用API获取即将开始的事件
        // 注意：使用events端点并添加upcoming参数
        const response = await axios.get(`${API_BASE_URL}/events/`, {
          params: { 
            limit,
            upcoming: true  // 这是关键参数，告诉后端我们要获取即将开始的事件
          },
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          // 处理事件数据，添加状态和颜色
          this.upcomingEvents = response.data.map(event => {
            // 确保事件有必要的字段
            if (!event || !event.name || !event.start_time) {
              console.error('事件数据不完整:', event);
              return null;
            }
            
            // 将name字段映射为title，将start_time字段映射为start_date
            const mappedEvent = {
              ...event,
              title: event.name,  // 后端返回的是name，但前端使用title
              start_date: event.start_time, // 后端返回的是start_time，但前端使用start_date
              type: event.department || '其他' // 使用部门作为事件类型
            };
            
            return this.processEventData(mappedEvent);
          }).filter(event => event !== null); // 过滤掉无效的事件
          
          this.lastUpdated = new Date();
          return this.upcomingEvents;
        } else {
          console.error('获取即将开始的事件数据格式错误:', response);
          return [];
        }
      } catch (error) {
        console.error('获取即将开始的事件数据失败:', error);
        throw error; // 抛出错误以便调用者处理
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取单个事件详情
    async fetchEvent(id) {
      this.isLoading = true;
      try {
        const userStore = useUserStore();
        // 调用API获取事件详情
        const response = await axios.get(`${API_BASE_URL}/events/${id}/`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        if (response.data && response.data.id) {
          return this.processEventData(response.data);
        } else {
          console.error('获取事件详情格式错误:', response);
          return null;
        }
      } catch (error) {
        console.error('获取事件详情失败:', error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    
    // 创建新事件
    async createEvent(eventData) {
      try {
        const userStore = useUserStore();
        // 调用API创建事件
        const response = await axios.post(`${API_BASE_URL}/events/`, eventData, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        if (response.data && response.data.id) {
          // 将新事件添加到列表
          const processedEvent = this.processEventData(response.data);
          this.events.unshift(processedEvent);
          
          // 如果是即将开始的事件，也添加到upcomingEvents
          if (this.isUpcoming(response.data)) {
            this.upcomingEvents.unshift(processedEvent);
          }
          
          this.lastUpdated = new Date();
          return processedEvent;
        }
        
        return null;
      } catch (error) {
        console.error('创建事件失败:', error);
        throw error;
      }
    },
    
    // 更新事件
    async updateEvent(id, eventData) {
      try {
        const userStore = useUserStore();
        // 调用API更新事件
        const response = await axios.put(`${API_BASE_URL}/events/${id}/`, eventData, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        if (response.data && response.data.id) {
          // 更新事件列表中的事件
          const processedEvent = this.processEventData(response.data);
          const index = this.events.findIndex(event => event.id === id);
          
          if (index !== -1) {
            this.events[index] = processedEvent;
          }
          
          // 更新upcomingEvents中的事件
          const upcomingIndex = this.upcomingEvents.findIndex(event => event.id === id);
          
          if (upcomingIndex !== -1) {
            if (this.isUpcoming(response.data)) {
              this.upcomingEvents[upcomingIndex] = processedEvent;
            } else {
              // 如果不再是即将开始的事件，从列表中移除
              this.upcomingEvents.splice(upcomingIndex, 1);
            }
          } else if (this.isUpcoming(response.data)) {
            // 如果现在是即将开始的事件，添加到列表
            this.upcomingEvents.push(processedEvent);
          }
          
          this.lastUpdated = new Date();
          return processedEvent;
        }
        
        return null;
      } catch (error) {
        console.error('更新事件失败:', error);
        throw error;
      }
    },
    
    // 删除事件
    async deleteEvent(id) {
      try {
        const userStore = useUserStore();
        // 调用API删除事件
        await axios.delete(`${API_BASE_URL}/events/${id}/`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        });
        
        // 从事件列表中移除
        const index = this.events.findIndex(event => event.id === id);
        
        if (index !== -1) {
          this.events.splice(index, 1);
        }
        
        // 从upcomingEvents中移除
        const upcomingIndex = this.upcomingEvents.findIndex(event => event.id === id);
        
        if (upcomingIndex !== -1) {
          this.upcomingEvents.splice(upcomingIndex, 1);
        }
        
        this.lastUpdated = new Date();
        return true;
      } catch (error) {
        console.error('删除事件失败:', error);
        throw error;
      }
    },
    
    // 处理事件数据
    processEventData(event) {
      // 如果没有start_date，使用创建时间
      if (!event.start_date) {
        event.start_date = event.created_at;
      }
      
      // 计算事件状态和颜色
      const startDate = new Date(event.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 重置时间部分，只比较日期
      
      let status, statusColor, daysRemaining;
      
      if (isToday(startDate)) {
        // 如果是今天
        status = '今日';
        statusColor = 'error';
        daysRemaining = 0;
      } else if (isBefore(startDate, today)) {
        // 如果日期已经过去
        status = '已开始';
        statusColor = 'grey';
        daysRemaining = 0;
      } else {
        // 未来日期
        const diffDays = differenceInDays(startDate, today);
        daysRemaining = diffDays;
        
        if (diffDays <= 3) {
          status = `${diffDays}天后`;
          statusColor = 'error';
        } else if (diffDays <= 7) {
          status = `${diffDays}天后`;
          statusColor = 'warning';
        } else {
          status = `${diffDays}天后`;
          statusColor = 'info';
        }
      }
      
      return {
        ...event,
        status,
        statusColor,
        daysRemaining
      };
    },
    
    // 判断事件是否即将开始
    isUpcoming(event) {
      const startDate = new Date(event.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 重置时间部分，只比较日期
      
      // 如果事件日期已经过去，则不是即将开始
      if (isBefore(startDate, today) && !isToday(startDate)) {
        return false;
      }
      
      return true;
    }
  },
  
  persist: {
    key: 'event-store',
    storage: localStorage,
    paths: ['events', 'upcomingEvents', 'lastUpdated']
  }
}); 