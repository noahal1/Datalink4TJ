import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VCalendar } from 'vuetify/labs/VCalendar'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          background: '#f5f5f5', 
          surface: '#ffffff', 
          primary: '#1976D2', 
          secondary: '#424242', 
          error: '#FF5252', 
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00', 
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  components:{
    VCalendar,
  }
})

export default vuetify