import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { zhHans } from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VCalendar } from 'vuetify/labs/VCalendar'
// 显式导入MDI图标字体
import '@mdi/font/css/materialdesignicons.css'

// 浅色主题配置
const lightTheme = {
  dark: false,
  colors: {
    primary: '#1976D2',
    'primary-darken-1': '#1565C0',
    secondary: '#424242',
    'secondary-darken-1': '#1B5E20',
    accent: '#82B1FF',
    error: '#F44336',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#EEEEEE',
    'surface-variant': '#424242',
    'on-surface-variant': '#EEEEEE',
    'primary-container': '#E3F2FD',
    'on-primary-container': '#0D47A1',
    'secondary-container': '#E8F5E8',
    'on-secondary-container': '#1B5E20',
  }
}

// 深色主题配置
const darkTheme = {
  dark: true,
  colors: {
    primary: '#2196F3',
    'primary-darken-1': '#1976D2',
    secondary: '#90CAF9',
    'secondary-darken-1': '#42A5F5',
    accent: '#FF4081',
    error: '#FF5252',
    info: '#03DAC6',
    success: '#00E676',
    warning: '#FFB74D',
    background: '#121212',
    surface: '#1E1E1E',
    'surface-bright': '#2C2C2C',
    'surface-light': '#2C2C2C',
    'surface-variant': '#424242',
    'on-surface-variant': '#EEEEEE',
    'primary-container': '#0D47A1',
    'on-primary-container': '#E3F2FD',
    'secondary-container': '#1B5E20',
    'on-secondary-container': '#E8F5E8',
  }
}

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: 'zhHans',
    messages: { zhHans }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    global: {
      density: 'compact'
    },
    VBtn: {
      size: 'default', // 确保按钮使用默认尺寸
      variant: 'flat'
    }
  },
  components:{
    VCalendar,
  }
})

export default vuetify