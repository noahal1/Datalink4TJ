/**
 * 主题工具函数
 */

// 导入Vue函数
import { watch } from 'vue';

/**
 * 初始化主题设置
 * @param {Object} theme - Vuetify主题对象
 */
export const initializeTheme = (theme) => {
  try {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'auto') {
      // 跟随系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.global.name.value = prefersDark ? 'dark' : 'light';
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'auto') {
          theme.global.name.value = e.matches ? 'dark' : 'light';
        }
      });
    } else if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.global.name.value = savedTheme;
    } else {
      // 默认使用浅色主题
      theme.global.name.value = 'light';
      localStorage.setItem('theme', 'light');
    }
  } catch (error) {
    console.error('初始化主题失败:', error);
    theme.global.name.value = 'light';
  }
};

/**
 * 切换主题
 * @param {Object} theme - Vuetify主题对象
 * @param {string} newTheme - 新主题名称 ('light', 'dark', 'auto')
 */
export const switchTheme = (theme, newTheme) => {
  try {
    if (newTheme === 'auto') {
      // 跟随系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.global.name.value = prefersDark ? 'dark' : 'light';
    } else if (newTheme === 'light' || newTheme === 'dark') {
      theme.global.name.value = newTheme;
    }
    
    localStorage.setItem('theme', newTheme);
    return true;
  } catch (error) {
    console.error('切换主题失败:', error);
    return false;
  }
};

/**
 * 获取当前主题设置
 * @returns {string} - 当前主题设置 ('light', 'dark', 'auto')
 */
export const getCurrentThemeSetting = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch (error) {
    console.error('获取主题设置失败:', error);
    return 'light';
  }
};

/**
 * 获取当前实际主题
 * @param {Object} theme - Vuetify主题对象
 * @returns {string} - 当前实际主题 ('light', 'dark')
 */
export const getCurrentActualTheme = (theme) => {
  return theme.global.name.value;
};

/**
 * 检查是否为深色主题
 * @param {Object} theme - Vuetify主题对象
 * @returns {boolean} - 是否为深色主题
 */
export const isDarkTheme = (theme) => {
  return theme.global.name.value === 'dark';
};

/**
 * 获取主题显示名称
 * @param {string} themeName - 主题名称
 * @returns {string} - 主题显示名称
 */
export const getThemeDisplayName = (themeName) => {
  const themeNames = {
    light: '浅色主题',
    dark: '深色主题',
    auto: '跟随系统'
  };
  return themeNames[themeName] || '未知主题';
};

/**
 * 获取主题图标
 * @param {string} themeName - 主题名称
 * @returns {string} - 主题图标
 */
export const getThemeIcon = (themeName) => {
  const themeIcons = {
    light: 'mdi-white-balance-sunny',
    dark: 'mdi-moon-waning-crescent',
    auto: 'mdi-theme-light-dark'
  };
  return themeIcons[themeName] || 'mdi-theme-light-dark';
};

/**
 * 应用主题到文档根元素
 * @param {string} themeName - 主题名称
 */
export const applyThemeToDocument = (themeName) => {
  try {
    const html = document.documentElement;
    
    // 移除所有主题类
    html.classList.remove('theme-light', 'theme-dark');
    
    // 添加当前主题类
    if (themeName === 'dark') {
      html.classList.add('theme-dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.add('theme-light');
      html.setAttribute('data-theme', 'light');
    }
  } catch (error) {
    console.error('应用主题到文档失败:', error);
  }
};

/**
 * 监听主题变化并应用到文档
 * @param {Object} theme - Vuetify主题对象
 */
export const watchThemeChanges = (theme) => {
  // 初始应用
  applyThemeToDocument(theme.global.name.value);
  
  // 监听变化
  theme.global.name.value && watch(
    () => theme.global.name.value,
    (newTheme) => {
      applyThemeToDocument(newTheme);
    }
  );
};


