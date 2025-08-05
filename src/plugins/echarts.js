import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { LineChart, BarChart, RadarChart } from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from "echarts/components"

// 配置ECharts
export function setupECharts() {
  use([
    CanvasRenderer,
    LineChart,
    BarChart,
    RadarChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    LegendComponent
  ])
}