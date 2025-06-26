// 只保留一次声明
export const tealGradient = 'linear-gradient(135deg, #26A69A 0%, #80CBC4 100%)';
export const redGradient = 'linear-gradient(135deg, #EF5350 0%, #E57373 100%)';

// Material Design 调色板
export const colors = {
  primary: "#2196F3",
  secondary: "#4CAF50",
  error: "#FF5252",
  warning: "#FFC107",
  info: "#2196F3",
  success: "#4CAF50"
};

// 添加线体颜色映射
export const lineColors = {
  'all': 'primary',
  'SWI-L': 'indigo',
  'SWI-R': 'deep-purple',
  'RWH-L': 'teal',
  'RWH-R': 'cyan',
  'W01': 'blue',
  'HF': 'deep-orange',
  'LC': 'green'
};

// 获取线体颜色
export const getLineColor = (type) => {
  return lineColors[type] || 'grey';
};

// 获取线体对应的颜色值(用于图表)
export const getLineColorPair = (line) => {
  const baseColor = getLineColor(line);
  const colorMap = {
    'primary': ['#1976D2', '#42A5F5'],
    'indigo': ['#3F51B5', '#7986CB'],
    'deep-purple': ['#673AB7', '#9575CD'],
    'teal': ['#009688', '#4DB6AC'],
    'cyan': ['#00BCD4', '#4DD0E1'],
    'blue': ['#2196F3', '#64B5F6'],
    'deep-orange': ['#FF5722', '#FF8A65'],
    'green': ['#4CAF50', '#81C784'],
    'grey': ['#9E9E9E', '#BDBDBD']
  };
  
  return colorMap[baseColor] || ['#1976D2', '#4CAF50'];
};

// MTTR/MTBF图表颜色映射
export const getMTTRMTBFColors = (line) => {
  const baseColor = getLineColor(line);
  const colorMap = {
    'primary': ['#FFA726', '#E53935', '#9C27B0'],
    'indigo': ['#FF7043', '#5C6BC0', '#7E57C2'],
    'deep-purple': ['#FFB74D', '#7986CB', '#9575CD'],
    'teal': ['#FFC107', '#26A69A', '#4DB6AC'],
    'cyan': ['#FFCA28', '#00ACC1', '#4DD0E1'],
    'blue': ['#FFD54F', '#42A5F5', '#64B5F6'],
    'deep-orange': ['#FFE082', '#FF7043', '#FF8A65'],
    'green': ['#FFF59D', '#66BB6A', '#81C784'],
    'grey': ['#E0E0E0', '#9E9E9E', '#BDBDBD']
  };
  
  return colorMap[baseColor] || ['#FFA726', '#E53935', '#9C27B0'];
};
