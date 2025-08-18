/**
 * KPI相关的工具函数
 */

/**
 * 检查KPI项是否有备注内容（原因分析或行动计划）
 * @param {Object} item - KPI数据项
 * @returns {boolean} - 是否有备注内容
 */
export const hasRemarkContent = (item) => {
  if (!item) return false

  // 检查原因分析
  const hasRootCause = item.root_cause_analysis && item.root_cause_analysis.trim()

  // 检查行动计划内容
  const hasActionPlan = item.action_plan_content && item.action_plan_content.trim()

  return hasRootCause || hasActionPlan
}


