// 任务类型定义
export const taskTypes = [
  { value: 1, label: '定期维护' },
  { value: 2, label: '设备调试' },
  { value: 3, label: '故障维修' },
  { value: 4, label: '备件更换' },
  { value: 5, label: '预防性维护' }
]

// 获取任务类型标签
export const getTaskTypeLabel = (typeId) => {
  const type = taskTypes.find(t => t.value === parseInt(typeId))
  return type ? type.label : '未知类型'
}

// 获取任务类型颜色
export const getTaskTypeColor = (typeId) => {
  const typeValue = parseInt(typeId)
  switch (typeValue) {
    case 1: return 'primary'   // 定期维护
    case 2: return 'info'      // 设备调试
    case 3: return 'error'     // 故障维修
    case 4: return 'warning'   // 备件更换
    case 5: return 'success'   // 预防性维护
    default: return 'grey'
  }
}

// 格式化日期
export const formatDate = (dateString, includeYear = true) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return includeYear 
    ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    : `${date.getMonth() + 1}月${date.getDate()}日`
}

// 比较两个日期是否是同一天
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// 格式化日期范围为字符串
export const formatDateRange = (dateRange) => {
  if (dateRange && dateRange.length === 2) {
    const start = dateRange[0] instanceof Date 
      ? dateRange[0].toLocaleDateString() 
      : new Date(dateRange[0]).toLocaleDateString();
    
    const end = dateRange[1] instanceof Date 
      ? dateRange[1].toLocaleDateString() 
      : new Date(dateRange[1]).toLocaleDateString();
    
    if (start === end) {
      return start; // 如果开始和结束日期相同，只显示一个日期
    }
    return `${start} 至 ${end}`;
  }
  return '选择日期范围';
};

// 日期调试辅助函数
export const debugDate = (label, date) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!date) {
      console.log(`${label}: null 或 undefined`);
      return;
    }
    
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      try {
        dateObj = new Date(date);
      } catch (e) {
        console.error(`${label}: 无法解析为日期 - ${date}`);
        return;
      }
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error(`${label}: 无效的日期 - ${date}`);
      return;
    }
    
    console.log(`${label}:
    - 原始值: ${date}
    - ISO字符串: ${dateObj.toISOString()}
    - 本地日期: ${dateObj.toLocaleDateString()}
    - 本地时间: ${dateObj.toLocaleTimeString()}
    - 时间戳: ${dateObj.getTime()}
    `);
  }
};

// 设置日期范围快捷选项
export const getDateRange = (type) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 重置时间部分为当天开始
  
  let start = new Date(today);
  let end = new Date(today);
  end.setHours(23, 59, 59, 999); // 设置为当天结束
  
  switch (type) {
    case 'today':
      // 今天 - 保持默认值
      break;
    case 'week':
      // 本周 (周一到周日)
      const day = today.getDay() || 7; // 如果是周日，getDay()返回0，转为7
      start = new Date(today);
      start.setDate(today.getDate() - day + 1); // 设置为本周一
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6); // 设置为本周日
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      // 本月
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      // 本季度
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      break;
  }
  
  return [start, end];
};

// 格式化时间（分钟）
export const formatTime = (minutes) => {
  // 确保输入是数字
  const mins = typeof minutes === 'number' ? minutes : parseFloat(minutes) || 0;

  // 如果是0或无效值，显示为0
  if (!mins || mins === 0) {
    return '0分钟';
  }

  if (mins < 60) {
    // 小于1小时，显示为分钟
    return `${mins.toFixed(1)}分钟`;
  } else {
    // 大于1小时，显示为小时+分钟
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) {
      return `${hours}小时`;
    } else {
      return `${hours}小时${remainingMins.toFixed(0)}分钟`;
    }
  }
};

// 格式化百分比
export const formatPercentage = (value) => {
  // 确保输入是数字
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  // 判断是否已经是百分比(>1)，如果是小数(0-1)则转换为百分比
  const percentage = num <= 1 ? num * 100 : num;
  
  // 保留1位小数并添加百分号
  return `${percentage.toFixed(1)}%`;
}; 