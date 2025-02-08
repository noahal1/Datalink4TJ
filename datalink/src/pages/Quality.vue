<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-calendar-month-outline</v-icon>GP12 数据
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="data"
              :items="datas"
              class="ma-2"
              density="compact"
              label="数据类型"
              variant="outlined"
              hide-details
            ></v-select>
            <br>
            <v-select
              v-model="type"
              :items="types"
              class="ma-2"
              density="compact"
              label="视图模式"
              variant="outlined"
              hide-details
            ></v-select>

            <!-- 新增区域选择 -->
            <v-select
              v-model="selectedArea"
              :items="areas"
              class="ma-2"
              density="compact"
              label="选择区域"
              variant="outlined"
              hide-details
              v-if="type === 'day'"
            ></v-select>

            <div v-if="type === 'year'">
              <v-row>
                <v-col v-for="(month, index) in months" :key="index" cols="3">
                  <v-card class="ma-4">
                    <v-card-title>{{ month }}</v-card-title>
                    <v-card-text>
                      <div v-for="area in areas" :key="area">
                        <strong>{{ area }}</strong><br>
                        GP12: {{ monthlyStats[index][area]?.GP12 || 0 }}<br>
                        报废: {{ monthlyStats[index][area]?.scrap || 0 }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <div v-else>
              <v-btn-toggle v-model="toggle" color="grey">
                <v-btn v-for="(month, index) in months" :key="index" :value="index">
                  {{ month }}
                </v-btn>
              </v-btn-toggle>

              <v-data-table
                :headers="headers"
                :items="dailyRecords"
                class="elevation-1"
              >
                <template v-slot:item.event="{ item }">
                  <v-edit-dialog
                    :return-value.sync="item.event"
                    @save="saveEvent(item)"
                  >
                    {{ item.event }}
                    <template v-slot:input>
                      <v-text-field
                        v-model="item.event"
                        type="number"
                        label="GP12数量"
                        single-line
                        hide-details
                      ></v-text-field>
                    </template>
                  </v-edit-dialog>
                </template>

                <template v-slot:item.scrap="{ item }">
                  <v-edit-dialog
                    :return-value.sync="item.scrap"
                    @save="saveScrap(item)"
                  >
                    {{ item.scrap }}
                    <template v-slot:input>
                      <v-text-field
                        v-model="item.scrap"
                        type="number"
                        label="报废品数量"
                        single-line
                        hide-details
                      ></v-text-field>
                    </template>
                  </v-edit-dialog>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-alert-circle</v-icon>客户投诉数据
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(complaint, index) in complaints"
                :key="index"
                @click="showComplaintDetails(complaint)"
              >
                <v-list-item-title>{{ complaint.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ complaint.date }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="dialogContent"
            label="详细信息"
            rows="5"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="saveDetails">保存</v-btn>
          <v-btn text @click="dialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const dialog = ref(false)
const dialogTitle = ref('')
const dialogContent = ref('')

// 投诉数据
const complaints = ref([
  { title: '客户投诉 1', date: '2025-02-01', details: '详细信息 1' },
  { title: '客户投诉 2', date: '2025-10-02', details: '详细信息 2' },
])

// 数据类型
const datas = ['GP12', '报废', '供应商缺陷', 'FTT']
const data = ref('GP12')

// 视图模式
const types = ['year', 'day']
const type = ref('day')

// 月份列表
const months = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

// 区域列表逻辑
const selectedArea = ref('SWI')
const areas = computed(() => {
  const areaSet = new Set(events.value.map(e => e.area))
  return Array.from(areaSet)
})

// 后期改fetch到数据库
const events = ref([
  { date: '2025-01-15', event: 1, scrap: 0, area: 'SWI' },
  { date: '2025-02-01', event: 2, scrap: 1, area: 'RWH' },
  { date: '2025-10-15', event: 3, scrap: 2, area: 'W01' },
  { date: '2025-01-20', event: 5, scrap: 1, area: 'SWI' },
  { date: '2025-03-10', event: 2, scrap: 0, area: 'RWH' },
  { date: '2024-12-05', event: 4, scrap: 3, area: 'W01' },
  { date: '2024-12-28', event: 1, scrap: 1, area: 'SWI' },
  { date: '2023-07-12', event: 3, scrap: 0, area: 'RWH' },
  { date: '2023-08-22', event: 2, scrap: 2, area: 'W01' },
])

// 生成完整日期逻辑
const generateMonthDates = (year, month) => {
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0')
    return `${year}-${month.toString().padStart(2, '0')}-${day}`
  })
}

// 更新日数据
const updateDailyRecords = (monthIndex) => {
  const year = 2025
  const month = monthIndex + 1
  const dates = generateMonthDates(year, month)
  
  dailyRecords.value = dates.map(date => {
    const existing = events.value.find(e => 
      e.date === date && e.area === selectedArea.value
    )
    return existing || { 
      date, 
      event: 0, 
      scrap: 0, 
      area: selectedArea.value 
    }
  })
}
// 月统计数据
const monthlyStats = computed(() => {
  return months.map((_, index) => {
    const month = (index + 1).toString().padStart(2, '0')
    const monthEvents = events.value.filter(e => 
      e.date.startsWith(`2025-${month}`)
    )
    
    return monthEvents.reduce((acc, event) => {
      const area = event.area
      if (!acc[area]) {
        acc[area] = { GP12: 0, scrap: 0 }
      }
      acc[area].GP12 += event.event
      acc[area].scrap += event.scrap
      return acc
    }, {})
  })
})

// 保存逻辑
const saveEvent = (item) => {
  const index = events.value.findIndex(e => 
    e.date === item.date && e.area === item.area
  )
  if (index > -1) {
    events.value[index].event = item.event
  } else {
    events.value.push({ ...item })
  }
}

const saveScrap = (item) => {
  const index = events.value.findIndex(e => 
    e.date === item.date && e.area === item.area
  )
  if (index > -1) {
    events.value[index].scrap = item.scrap
  } else {
    events.value.push({ ...item })
  }
}

// 显示客户投诉详情
const showComplaintDetails = (complaint) => {
  dialogTitle.value = `客户投诉 - ${complaint.title}`
  dialogContent.value = complaint.details
  dialog.value = true
}

// 保存详情
const saveDetails = () => {
  console.log('保存:', dialogContent.value)
  dialog.value = false
}



// 表头定义
const headers = [
  { title: '日期', value: 'date' },
  { title: '问题数量', value: 'event' },
  { title: '报废品数量', value: 'scrap' },
  { title: '区域', value: 'area' },
]

</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}
</style>
