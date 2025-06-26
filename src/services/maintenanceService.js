import api from '../utils/api'

/**
 * 维修指标服务
 */
const maintenanceService = {
  /**
   * 获取维修指标数据
   * @param {Object} params 查询参数
   * @param {number} params.skip 跳过记录数
   * @param {number} params.limit 返回记录数
   * @param {string} params.line 线体
   * @param {number} params.shift_code 班次代码(1=白班,2=夜班)
   * @param {string} params.start_date 开始日期
   * @param {string} params.end_date 结束日期
   * @param {number} params.page 当前页码(基于1)
   * @param {number} params.page_size 每页记录数
   * @returns {Promise<Object>} 维修指标数据列表
   */
  async getMaintenanceMetrics(params = {}) {
    try {
      // 创建参数的副本以避免修改原始对象
      const queryParams = { ...params };
      
      // 处理分页参数 - 支持两种分页方式
      if (queryParams.page !== undefined && queryParams.page_size !== undefined) {
        // 如果提供了page和page_size，则转换为skip和limit
        queryParams.skip = (queryParams.page - 1) * queryParams.page_size;
        queryParams.limit = queryParams.page_size;
        
        // 删除原始的page和page_size参数，避免API混淆
        delete queryParams.page;
        delete queryParams.page_size;
      } else {
        // 确保至少有默认的分页参数
        if (queryParams.skip === undefined) queryParams.skip = 0;
        if (queryParams.limit === undefined) queryParams.limit = 50;
      }
      
      // 移除user_id参数，因为后端模型不支持
      if (queryParams.user_id) {
        delete queryParams.user_id;
      }
      
      console.log('获取维修指标数据, 参数:', queryParams)
      
      // 使用修改后的api.get函数，直接使用路径而不是拼接API_BASE_URL
      const response = await api.get('/maint/metrics-data', { params: queryParams });
      
      return response.data
    } catch (error) {
      console.error('获取维修指标数据失败:', error)
      throw error
    }
  },

  /**
   * 创建维修指标数据
   * @param {Object} data 维修指标数据
   * @param {string} data.line 线体
   * @param {string} data.shift_date 日期
   * @param {number} data.shift_code 班次代码(1=白班,2=夜班)
   * @param {number} data.plan_down_time 计划停机时间(分钟)
   * @param {number} data.out_plan_down_time 非计划停机时间(分钟)
   * @param {number} data.oee 设备综合效率
   * @param {number} data.amount 生产数量
   * @param {number} data.issue_count 问题数量
   * @param {number} data.availability_rate 设备可动率
   * @param {number} data.mttr 平均修复时间
   * @param {number} data.mtbf 平均故障间隔时间
   * @returns {Promise<Object>} 创建的维修指标数据
   */
  async createMaintenanceMetric(data) {
    try {
      console.log('创建维修指标数据:', data)
      const response = await api.post('/maint/metrics-data', data)
      return response.data
    } catch (error) {
      console.error('创建维修指标数据失败:', error)
      throw error
    }
  },

  /**
   * 更新维修指标数据
   * @param {number} id 维修指标ID
   * @param {Object} data 维修指标数据
   * @param {string} [data.line] 线体
   * @param {string} [data.shift_date] 日期
   * @param {number} [data.shift_code] 班次代码(1=白班,2=夜班)
   * @param {number} [data.plan_down_time] 计划停机时间(分钟)
   * @param {number} [data.out_plan_down_time] 非计划停机时间(分钟)
   * @param {number} [data.oee] 设备综合效率
   * @param {number} [data.amount] 生产数量
   * @param {number} [data.issue_count] 问题数量
   * @param {number} [data.availability_rate] 设备可动率
   * @param {number} [data.mttr] 平均修复时间
   * @param {number} [data.mtbf] 平均故障间隔时间
   * @returns {Promise<Object>} 更新的维修指标数据
   */
  async updateMaintenanceMetric(id, data) {
    try {
      console.log(`更新维修指标数据 ID:${id}`, data)
      const response = await api.put(`/maint/metrics-data/${id}`, data)
      return response.data
    } catch (error) {
      console.error('更新维修指标数据失败:', error)
      throw error
    }
  },

  /**
   * 删除维修指标数据
   * @param {number} id 维修指标ID
   * @returns {Promise<Object>} 操作结果
   */
  async deleteMaintenanceMetric(id) {
    try {
      console.log(`删除维修指标数据 ID:${id}`)
      const response = await api.delete(`/maint/metrics-data/${id}`)
      return response.data
    } catch (error) {
      console.error('删除维修指标数据失败:', error)
      throw error
    }
  },

  /**
   * 获取OEE和设备可动率趋势数据
   * @param {Object} params 查询参数 
   * @returns {Promise<Array>} 趋势数据
   */
  async getOEETrendData(params = {}) {
    try {
      console.log('获取OEE趋势数据，参数:', params);
      
      // 确保参数格式正确 - 与MTTR/MTBF处理方式保持一致
      const queryParams = {
        line: params.line,
        shift_code: params.shift_code,
        start_date: params.start_date,
        end_date: params.end_date
      };
      
      // 移除undefined和null值
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null) {
          delete queryParams[key];
        }
      });
      
      console.log('发送OEE趋势数据请求，参数:', queryParams);
      
      // 使用修改后的api.get函数，直接使用路径
      const response = await api.get('/maint/charts/oee-trend', { params: queryParams });
      
      // 处理响应数据
      let trendData = [];
      if (response.data && Array.isArray(response.data)) {
        console.log(`获取到 ${response.data.length} 条OEE趋势数据`);
        trendData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`获取到 ${response.data.data.length} 条OEE趋势数据`);
        trendData = response.data.data;
      } else {
        console.warn('OEE趋势数据格式不正确:', response.data);
        return [];
      }
      
      // 处理返回的数据，确保包含必要的字段，并与MTTR/MTBF处理方式保持一致
      return trendData.map(item => {
        // 确保OEE和可动率值为数字
        let oee = typeof item.oee === 'number' ? item.oee : parseFloat(item.oee) || 0;
        let availability = typeof item.availability === 'number' ? item.availability : parseFloat(item.availability) || 0;
        
        // 如果值是小数(0-1)，则转换为百分比(0-100)
        if (oee <= 1) oee = oee * 100;
        if (availability <= 1) availability = availability * 100;
        
        // 始终使用传入的筛选条件(如果数据中没有对应字段)
        return {
          ...item,
          line: item.line || params.line || '全部',
          shift_code: item.shift_code !== undefined ? item.shift_code : (params.shift_code || 0),
          oee: oee,
          availability: availability,
          date: item.date || item.shift_date // 确保有date字段用于图表显示
        };
      });
    } catch (error) {
      console.error('获取OEE趋势数据失败:', error);
      throw error;
    }
  },

  /**
   * 获取MTTR和MTBF趋势数据
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 趋势数据
   */
  async getMTTRMTBFTrendData(params = {}) {
    try {
      console.log('获取MTTR/MTBF趋势数据，参数:', params);
      
      // 确保参数格式正确 - 直接传递参数，不要嵌套在params对象中
      const queryParams = {
        line: params.line,
        shift_code: params.shift_code,
        start_date: params.start_date,
        end_date: params.end_date
      };
      
      // 移除undefined和null值
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null) {
          delete queryParams[key];
        }
      });
      
      console.log('发送MTTR/MTBF趋势数据请求，参数:', queryParams);
      
      // 使用修改后的api.get函数，直接使用路径
      const response = await api.get('/maint/charts/mttr-mtbf-trend', { params: queryParams });
      
      // 处理响应数据
      let trendData = [];
      if (response.data && Array.isArray(response.data)) {
        console.log(`获取到 ${response.data.length} 条MTTR/MTBF趋势数据`);
        trendData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`获取到 ${response.data.data.length} 条MTTR/MTBF趋势数据`);
        trendData = response.data.data;
      } else {
        console.warn('MTTR/MTBF趋势数据格式不正确:', response.data);
        return [];
      }
      
      // 如果后端返回的数据没有line和shift_code字段，则添加这些字段
      // 这样前端可以按线体和班次分组显示
      return trendData.map(item => {
        // 确保MTTR和MTBF值为数字，保持分钟单位
        const mttr = typeof item.mttr === 'number' ? item.mttr : parseFloat(item.mttr) || 0;
        const mtbf = typeof item.mtbf === 'number' ? item.mtbf : parseFloat(item.mtbf) || 0;
        
        // 如果数据中已有line和shift_code，则保留原值
        return {
          ...item,
          line: item.line || params.line || '全部',
          shift_code: item.shift_code || params.shift_code || 0,
          mttr: mttr,
          mtbf: mtbf
        };
      });
    } catch (error) {
      console.error('获取MTTR/MTBF趋势数据失败:', error);
      throw error;
    }
  },

  /**
   * 计算OEE(设备综合效率)
   * 注意：此方法仅提供计算逻辑，实际应用中使用数据库中存储的OEE值
   * @param {number} planDownTime 计划停机时间(分钟)
   * @param {number} outPlanDownTime 非计划停机时间(分钟)
   * @param {number} totalTime 总工作时间(默认720分钟=12小时/班)
   * @returns {number} OEE值(0-1之间)
   */
  calculateOEE(planDownTime = 0, outPlanDownTime = 0, totalTime = 720) {
    // 确保参数为数字类型
    planDownTime = Number(planDownTime) || 0
    outPlanDownTime = Number(outPlanDownTime) || 0
    
    // 计算可用时间 = 总时间 - 计划停机时间
    const availableTime = totalTime - planDownTime
    if (availableTime <= 0) return 0
    
    // 计算实际运行时间 = 可用时间 - 非计划停机时间
    const actualRunTime = availableTime - outPlanDownTime
    if (actualRunTime < 0) return 0
    
    // OEE = 实际运行时间 / 总时间
    return actualRunTime / totalTime
  },

  /**
   * 计算设备可动率
   * @param {number} planDownTime 计划停机时间(分钟)
   * @param {number} outPlanDownTime 非计划停机时间(分钟)
   * @param {number} totalTime 总工作时间(默认720分钟=12小时/班)
   * @returns {number} 可动率值(0-1之间)
   */
  calculateAvailability(planDownTime = 0, outPlanDownTime = 0, totalTime = 720) {
    // 确保参数为数字类型
    planDownTime = Number(planDownTime) || 0
    outPlanDownTime = Number(outPlanDownTime) || 0
    
    // 计算可用时间 = 总时间 - 计划停机时间
    const availableTime = totalTime - planDownTime
    if (availableTime <= 0) return 0
    
    // 计算实际运行时间 = 可用时间 - 非计划停机时间
    const actualRunTime = availableTime - outPlanDownTime
    if (actualRunTime < 0) return 0
    
    // 可动率 = 实际运行时间 / 可用时间
    return actualRunTime / availableTime
  },

  /**
   * 从现有指标数据生成OEE趋势
   * @param {Object} params 筛选参数
   * @param {Array} metricsList 指标数据列表
   * @returns {Array} OEE趋势数据
   */
  generateOEETrend(params = {}, metricsList = []) {
    console.log('使用现有数据生成OEE趋势，筛选参数:', params);
    
    // 按日期、线体和班次分组
    const groups = {};
    
    // 筛选数据
    let filteredMetrics = [...metricsList];
    
    // 应用线体筛选
    if (params.line) {
      console.log(`应用线体筛选: ${params.line}`);
      filteredMetrics = filteredMetrics.filter(metric => metric.line === params.line);
    }
    
    // 应用班次筛选 - 确保使用shift_code
    if (params.shift_code !== undefined && params.shift_code !== null) {
      console.log(`应用班次筛选: ${params.shift_code}`);
      filteredMetrics = filteredMetrics.filter(metric => metric.shift_code === params.shift_code);
    }
    
    // 应用日期筛选 - 统一日期处理逻辑
    if (params.start_date && params.end_date) {
      console.log(`应用日期筛选: ${params.start_date} 至 ${params.end_date}`);
      const startDate = new Date(params.start_date);
      startDate.setHours(0, 0, 0, 0); // 设置开始日期为当天的第一毫秒
      
      const endDate = new Date(params.end_date);
      endDate.setHours(23, 59, 59, 999); // 设置结束日期为当天的最后一毫秒
      
      filteredMetrics = filteredMetrics.filter(metric => {
        // 确保日期是Date对象
        let metricDate;
        if (metric.date instanceof Date) {
          metricDate = metric.date;
        } else if (typeof metric.date === 'string') {
          metricDate = new Date(metric.date);
        } else if (metric.shift_date) {
          metricDate = new Date(metric.shift_date);
        } else {
          return false; // 排除没有日期的数据
        }
        
        // 确保metricDate是有效的日期对象
        if (isNaN(metricDate.getTime())) {
          return false;
        }
        
        // 日期比较
        return metricDate >= startDate && metricDate <= endDate;
      });
    }
    
    console.log(`筛选后剩余 ${filteredMetrics.length} 条记录`);
    
    // 如果没有数据，返回空数组
    if (filteredMetrics.length === 0) {
      return [];
    }
    
    filteredMetrics.forEach(metric => {
      // 规范化日期处理
      const dateObj = metric.date instanceof Date ? metric.date : new Date(metric.date || metric.shift_date);
      // 确保使用有效的日期
      if (isNaN(dateObj.getTime())) {
        return;
      }
      
      const date = dateObj.toISOString().split('T')[0];
      const line = metric.line || '未知线体';
      const shift_code = metric.shift_code ?? (metric.shift === '白班' ? 1 : (metric.shift === '夜班' ? 2 : 0));
      
      const key = `${date}-${line}-${shift_code}`;
      
      if (!groups[key]) {
        groups[key] = {
          date,
          line,
          shift_code,
          records: [],
          totalOEE: 0,
          totalAvailability: 0
        };
      }
      
      groups[key].records.push(metric);
      
      // 直接使用数据库中存储的OEE和availability值，确保为数字类型
      const oee = Number(metric.oee) || 0;
      const availability = Number(metric.availability) || 0;
      
      groups[key].totalOEE += oee;
      groups[key].totalAvailability += availability;
    });
    
    // 生成趋势数据
    const trendData = Object.values(groups).map(group => {
      const count = group.records.length || 1;
      
      // 确保OEE和可动率是百分比形式(0-100)
      let oee = group.totalOEE / count;
      let availability = group.totalAvailability / count;
      
      // 如果是小数(0-1)则转换为百分比(0-100)
      if (oee <= 1) oee = oee * 100;
      if (availability <= 1) availability = availability * 100;
        
      return {
        date: group.date,
        line: group.line,
        shift_code: group.shift_code,
        oee: oee,
        availability: availability
      };
    });
    
    // 按日期排序
    trendData.sort((a, b) => a.date.localeCompare(b.date));
    
    // 确保有正确的筛选标记
    return trendData.map(item => ({
      ...item,
      line: item.line || params.line || '全部',
      shift_code: item.shift_code !== undefined ? item.shift_code : (params.shift_code || 0)
    }));
  },

  /**
   * 从现有指标数据生成MTTR/MTBF趋势
   * @param {Object} params 筛选参数
   * @param {Array} metricsList 指标数据列表
   * @returns {Array} MTTR/MTBF趋势数据
   */
  generateMTTRTrend(params = {}, metricsList = []) {
    console.log('使用现有数据生成MTTR/MTBF趋势，筛选参数:', params);
    
    // 按日期、线体和班次分组指标数据
    const groups = {};
    
    // 筛选数据
    let filteredMetrics = [...metricsList];
    
    // 应用线体筛选
    if (params.line) {
      filteredMetrics = filteredMetrics.filter(metric => metric.line === params.line);
    }
    
    // 应用班次筛选
    if (params.shift_code !== undefined) {
      filteredMetrics = filteredMetrics.filter(metric => metric.shift_code === params.shift_code);
    }
    
    // 应用日期筛选
    if (params.start_date && params.end_date) {
      const startDate = new Date(params.start_date);
      const endDate = new Date(params.end_date);
      endDate.setHours(23, 59, 59, 999);
      
      filteredMetrics = filteredMetrics.filter(metric => {
        // 确保日期是Date对象
        let metricDate;
        if (metric.date instanceof Date) {
          metricDate = metric.date;
        } else if (typeof metric.date === 'string') {
          metricDate = new Date(metric.date);
        } else if (metric.shift_date) {
          metricDate = new Date(metric.shift_date);
        } else {
          return false;
        }
        
        // 确保metricDate是有效的日期对象
        if (isNaN(metricDate.getTime())) {
          return false;
        }
        
        // 日期比较
        return metricDate >= startDate && metricDate <= endDate;
      });
    }
    
    // 如果没有数据，返回空数组
    if (filteredMetrics.length === 0) {
      return [];
    }
    
    // 使用现有数据，不再自行计算MTTR/MTBF
    if (filteredMetrics.some(metric => metric.mttr !== undefined && metric.mtbf !== undefined)) {
      // 如果数据中已有MTTR/MTBF字段，直接使用
      filteredMetrics.forEach(metric => {
        // 规范化日期处理
        const dateObj = metric.date instanceof Date ? metric.date : new Date(metric.date || metric.shift_date);
        const date = dateObj.toISOString().split('T')[0];
        const line = metric.line || '未知线体';
        const shift_code = metric.shift_code || (metric.shift === '白班' ? 1 : (metric.shift === '夜班' ? 2 : 0));
        
        const key = `${date}-${line}-${shift_code}`;
        
        if (!groups[key]) {
          groups[key] = {
            date,
            line,
            shift_code,
            mttr: metric.mttr || 0,
            mtbf: metric.mtbf || 0,
            unplanned_count: metric.unplanned_count || 0
          };
        }
      });
      
      // 转换为数组
      const result = Object.values(groups);
      
      // 按日期排序
      result.sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } else {
      // 如果数据中没有MTTR/MTBF字段，使用模拟数据
      return this.generateMockMTTRData(params);
    }
  },

  /**
   * 生成线体对比数据
   * @param {Array} lineTypes 线体类型列表
   * @param {Array} metricsList 指标数据列表
   * @returns {Object} 线体对比数据
   */
  generateLineComparison(lineTypes = [], metricsList = []) {
    // 按线体分组指标数据
    const lineGroups = {};
    
    lineTypes.forEach(line => {
      lineGroups[line] = {
        records: [],
        totalOEE: 0,
        totalAvailability: 0,
        totalOutPlanDowntime: 0,
        totalPlanDowntime: 0,
        totalMTTR: 0,
        totalMTBF: 0,
        mttrCount: 0,
        mtbfCount: 0,
        recordCount: 0
      };
    });
    
    metricsList.forEach(metric => {
      const line = metric.line;
      if (lineGroups[line]) {
        lineGroups[line].records.push(metric);
        lineGroups[line].recordCount++;
        
        // 使用数据库中的OEE值
        const oee = Number(metric.oee) || 0;
        
        // 计算可用性
        const availability = this.calculateAvailability(
          metric.plan_down_time,
          metric.out_plan_down_time
        );
        
        lineGroups[line].totalOEE += oee;
        lineGroups[line].totalAvailability += availability;
        lineGroups[line].totalOutPlanDowntime += Number(metric.out_plan_down_time) || 0;
        lineGroups[line].totalPlanDowntime += Number(metric.plan_down_time) || 0;
        
        // 累加MTTR和MTBF数据
        if (metric.mttr !== undefined) {
          lineGroups[line].totalMTTR += Number(metric.mttr);
          lineGroups[line].mttrCount++;
        }
        
        if (metric.mtbf !== undefined) {
          lineGroups[line].totalMTBF += Number(metric.mtbf);
          lineGroups[line].mtbfCount++;
        }
      }
    });
    
    // 生成线体比较数据
    return {
      lines: lineTypes,
      metrics: ['可动率', 'MTTR', 'MTBF', '停机时间', 'OEE'],
      values: lineTypes.map(line => {
        const group = lineGroups[line];
        const count = group.recordCount || 1;
        
        const avgOEE = group.totalOEE / count;
        const avgAvailability = group.totalAvailability / count;
        const avgOutPlanDowntime = group.totalOutPlanDowntime / count;
        const avgPlanDowntime = group.totalPlanDowntime / count;
        
        // 计算平均MTTR和MTBF
        // 如果没有实际数据，则使用模拟数据
        const avgMTTR = group.mttrCount > 0 
          ? group.totalMTTR / group.mttrCount 
          : 30 + Math.random() * 60; // 模拟30-90分钟的MTTR
        
        const avgMTBF = group.mtbfCount > 0 
          ? group.totalMTBF / group.mtbfCount 
          : 240 + Math.random() * 480; // 模拟4-12小时的MTBF
        
        // 标准化MTTR值到0-100范围，MTTR越低越好
        // 假设MTTR最大值为120分钟
        const normalizedMTTR = Math.max(0, Math.min(100, 100 - (avgMTTR / 120 * 100)));
        
        // 标准化MTBF值到0-100范围，MTBF越高越好
        // 假设MTBF最大值为720分钟(12小时)
        const normalizedMTBF = Math.max(0, Math.min(100, avgMTBF / 720 * 100));
        
        // 计算总停机时间百分比
        const totalDowntimePercent = ((avgPlanDowntime + avgOutPlanDowntime) / 720) * 100;
        // 停机时间越低越好，所以用100减去
        const normalizedDowntime = Math.max(0, Math.min(100, 100 - totalDowntimePercent));
        
        return [
          Math.round(avgAvailability * 100),  // 可动率
          Math.round(normalizedMTTR),         // MTTR (标准化)
          Math.round(normalizedMTBF),         // MTBF (标准化)
          Math.round(normalizedDowntime),     // 停机时间 (标准化)
          Math.round(avgOEE * 100)            // OEE
        ];
      })
    };
  },

  /**
   * 生成模拟MTTR/MTBF数据
   * @param {Object} params 筛选参数
   * @returns {Array} 模拟的MTTR/MTBF数据
   */
  generateMockMTTRData(params = {}) {
    console.log('生成模拟MTTR/MTBF数据');
    
    // 生成日期数组
    const generateDateRange = () => {
      const dates = [];
      const startDate = params.start_date ? new Date(params.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = params.end_date ? new Date(params.end_date) : new Date();
      
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };
    
    const dates = generateDateRange();
    const lines = ['SWI-L', 'SWI-R', 'RWH-L', 'RWH-R', 'W01', 'HF', 'LC'];
    const shifts = [1, 2]; // 1=白班, 2=夜班
    
    // 如果已经选择了特定线体或班次，则只生成该线体或班次的数据
    const selectedLines = params.line ? [params.line] : lines;
    const selectedShifts = params.shift_code !== undefined ? [params.shift_code] : shifts;
    
    // 生成MTTR和MTBF数据
    const result = [];
    
    // 为每个线体、班次和日期生成数据
    selectedLines.forEach(line => {
      selectedShifts.forEach(shift_code => {
        dates.forEach(date => {
          // 生成随机的非计划停机次数
          const unplannedCount = Math.floor(1 + Math.random() * 3);
          
          // 生成随机的计划停机时间和非计划停机时间
          const plannedDowntime = Math.floor(30 + Math.random() * 60);
          const unplannedDowntime = Math.floor(20 + Math.random() * 40) * unplannedCount;
          
          // 计算MTTR
          const mttr = Math.floor(unplannedDowntime / unplannedCount);
          
          // 计算MTBF
          const mtbf = Math.floor((720 - plannedDowntime - unplannedDowntime) / unplannedCount);
          
          result.push({
            date,
            line,
            shift_code,
            mttr,
            mtbf,
            unplanned_count: unplannedCount,
            planned_downtime: plannedDowntime,
            unplanned_downtime: unplannedDowntime
          });
        });
      });
    });
    
    // 按日期排序
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  },

  /**
   * 生成模拟OEE和可动率数据
   * @param {Object} params 筛选参数
   * @returns {Array} 模拟的OEE和可动率数据
   */
  generateMockOEEData(params = {}) {
    console.log('生成模拟OEE和可动率趋势数据');
    
    // 生成日期数组
    const generateDateRange = () => {
      const dates = [];
      const startDate = params.start_date ? new Date(params.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = params.end_date ? new Date(params.end_date) : new Date();
      
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };
    
    const dates = generateDateRange();
    const lines = ['SWI-L', 'SWI-R', 'RWH-L', 'RWH-R', 'W01', 'HF', 'LC'];
    const shifts = [1, 2]; // 1=白班, 2=夜班
    
    // 如果已经选择了特定线体或班次，则只生成该线体或班次的数据
    const selectedLines = params.line ? [params.line] : lines;
    const selectedShifts = params.shift_code !== undefined ? [params.shift_code] : shifts;
    
    // 生成OEE和设备可动率数据
    const result = [];
    
    // 为每个线体、班次和日期生成数据
    selectedLines.forEach(line => {
      selectedShifts.forEach(shift_code => {
        dates.forEach(date => {
          // 基础OEE值（85%-95%之间随机）
          const oeeBase = 0.85 + Math.random() * 0.1;
          // 可动率稍高于OEE（OEE基础值加0-5%随机波动）
          const availabilityBase = oeeBase + Math.random() * 0.05;
          
          result.push({
            date,
            line,
            shift_code,
            oee: oeeBase * 100, // 转换为百分比
            availability: availabilityBase * 100 // 转换为百分比
          });
        });
      });
    });
    
    // 按日期排序
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  },

  /**
   * 生成模拟图表数据
   * @param {Object} params 筛选参数
   * @param {Array} lineTypes 线体类型列表
   * @returns {Object} 包含所有图表数据的对象
   */
  generateMockChartData(params = {}, lineTypes = []) {
    console.log('生成模拟图表数据用于显示');
    
    return {
      oeeAvailability: this.generateMockOEEData(params),
      mttrMtbf: this.generateMockMTTRData(params),
      lineComparison: {
        lines: lineTypes,
        metrics: ['可动率', 'MTTR', 'MTBF', '停机时间', 'OEE'],
        values: lineTypes.map(() => {
          // 生成随机的MTTR值 (30-90分钟)
          const mttr = 30 + Math.random() * 60;
          // 标准化MTTR值到0-100范围，MTTR越低越好
          const normalizedMTTR = Math.max(0, Math.min(100, 100 - (mttr / 120 * 100)));
          
          // 生成随机的MTBF值 (4-12小时 = 240-720分钟)
          const mtbf = 240 + Math.random() * 480;
          // 标准化MTBF值到0-100范围，MTBF越高越好
          const normalizedMTBF = Math.max(0, Math.min(100, mtbf / 720 * 100));
          
          // 生成随机的停机时间百分比 (5-15%)
          const downtimePercent = 5 + Math.random() * 10;
          // 停机时间越低越好，所以用100减去
          const normalizedDowntime = 100 - downtimePercent;
          
          // 生成随机的可动率 (85-95%)
          const availability = 85 + Math.random() * 10;
          
          // 生成随机的OEE (80-95%)
          const oee = 80 + Math.random() * 15;
          
          return [
            Math.round(availability), // 可动率
            Math.round(normalizedMTTR), // MTTR (标准化)
            Math.round(normalizedMTBF), // MTBF (标准化)
            Math.round(normalizedDowntime), // 停机时间 (标准化)
            Math.round(oee) // OEE
          ];
        })
      }
    };
  }
}

export default maintenanceService 