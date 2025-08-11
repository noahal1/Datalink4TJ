import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import {
  LineChart,
  BarChart,
  RadarChart,
  PieChart,
  ScatterChart
} from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  RadarComponent,
  MarkPointComponent,
  MarkLineComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent
} from "echarts/components"

// 配置ECharts
export function setupECharts() {
  use([
    CanvasRenderer,
    LineChart,
    BarChart,
    RadarChart,
    PieChart,
    ScatterChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    LegendComponent,
    RadarComponent,
    MarkPointComponent,
    MarkLineComponent,
    DataZoomComponent,
    BrushComponent,
    ToolboxComponent
  ])
}