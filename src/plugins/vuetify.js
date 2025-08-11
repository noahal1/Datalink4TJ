import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { zhHans } from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VCalendar } from 'vuetify/labs/VCalendar'
// 显式导入MDI图标字体
import '@mdi/font/css/materialdesignicons.css'

// 自定义主题配置
const customTheme = {
  dark: false,
  colors: {
    primary: '#1867C0',
    secondary: '#5CBBF6',
    accent: '#8c9eff',
    error: '#b71c1c',
    warning: '#FB8C00',
    info: '#2196F3',
    success: '#4CAF50',
    background: '#F5F5F5',
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
    defaultTheme: 'customTheme',
    themes: {
      customTheme
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
    }
  },
  components:{
    VCalendar,
  }
})

export default vuetify