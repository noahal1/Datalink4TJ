<template>
  <v-dialog
    v-model="dialog"
    max-width="900"
    persistent
    scrollable
  >
    <v-card class="pr-dialog-card">
      <!-- 标题栏 -->
      <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon
            :icon="isNew ? 'mdi-plus-circle' : 'mdi-pencil-circle'"
            class="mr-2"
            color="white"
          />
          <span class="text-h6 text-white">{{ isNew ? '新建采购申请' : '编辑采购申请' }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="close"
        />
      </v-card-title>

      <!-- 进度指示器 (仅新建模式) -->
      <v-card-subtitle v-if="isNew" class="pa-3 bg-grey-lighten-5">
        <div class="d-flex justify-center">
          <v-chip-group v-model="currentStep" mandatory>
            <v-chip
              :value="1"
              :color="currentStep >= 1 ? 'primary' : 'grey'"
              :variant="currentStep === 1 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start :icon="createMode === 'manual' ? 'mdi-information' : 'mdi-file-excel'" />
              {{ createMode === 'manual' ? '基本信息' : 'Excel导入' }}
            </v-chip>
            <v-chip
              v-if="createMode === 'manual'"
              :value="2"
              :color="currentStep >= 2 ? 'primary' : 'grey'"
              :variant="currentStep === 2 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start icon="mdi-package-variant" />
              物品详情
            </v-chip>
            <v-chip
              :value="3"
              :color="currentStep >= 3 ? 'primary' : 'grey'"
              :variant="currentStep === 3 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start icon="mdi-check-circle" />
              {{ createMode === 'manual' ? '确认提交' : '确认导入' }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="valid"
        >
          <!-- 新建模式：步骤式表单 -->
          <div v-if="isNew">
            <!-- 第一步：创建方式选择 -->
            <div v-show="currentStep === 1">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-information" class="mr-2" color="primary" />
                创建方式
              </div>

              <!-- 创建方式选择 -->
              <v-row class="mb-4">
                <v-col cols="12">
                  <v-card variant="outlined" class="pa-4">
                    <v-card-title class="text-subtitle-1 pa-0 mb-3">
                      请选择创建方式
                    </v-card-title>
                    <v-radio-group v-model="createMode" inline>
                      <v-radio
                        value="manual"
                        label="手动创建"
                        color="primary"
                      >
                        <template #label>
                          <div class="d-flex align-center">
                            <v-icon icon="mdi-pencil" class="mr-2" />
                            <span>手动创建</span>
                            <v-chip size="small" color="info" variant="outlined" class="ml-2">
                              单个
                            </v-chip>
                          </div>
                        </template>
                      </v-radio>
                      <v-radio
                        value="excel"
                        label="Excel导入"
                        color="success"
                      >
                        <template #label>
                          <div class="d-flex align-center">
                            <v-icon icon="mdi-file-excel" class="mr-2" />
                            <span>Excel导入</span>
                            <v-chip size="small" color="success" variant="outlined" class="ml-2">
                              批量
                            </v-chip>
                          </div>
                        </template>
                      </v-radio>
                    </v-radio-group>
                  </v-card>
                </v-col>
              </v-row>

              <!-- 手动创建模式的基本信息 -->
              <div v-if="createMode === 'manual'">
                <div class="text-subtitle-1 mb-3 d-flex align-center">
                  <v-icon icon="mdi-information-outline" class="mr-2" color="primary" />
                  基本信息
                </div>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="localPr.required_date"
                      label="需求日期"
                      type="date"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-calendar"
                      hint="请选择您希望收到物品的日期"
                      persistent-hint
                      :min="minDate"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="localPr.description"
                      label="申请说明(可选)"
                      rows="3"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-text"
                      placeholder="请简要说明申请原因、用途等..."
                      counter="500"
                      :rules="[rules.maxLength(500)]"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- Excel导入模式 -->
              <div v-if="createMode === 'excel'">
                <div class="text-subtitle-1 mb-3 d-flex align-center">
                  <v-icon icon="mdi-file-excel" class="mr-2" color="success" />
                  Excel文件导入
                </div>

                <!-- 下载模板按钮 -->
                <v-row class="mb-4">
                  <v-col cols="12">
                    <v-alert
                      type="info"
                      variant="tonal"
                      class="mb-3"
                    >
                      <template #prepend>
                        <v-icon icon="mdi-information" />
                      </template>
                      <div>
                        <strong>使用说明：</strong>
                        <ol class="mt-2">
                          <li>点击下载模板按钮获取Excel模板文件</li>
                          <li>在模板中填写PR信息（物品名称和数量为必填项）</li>
                          <li>上传填写完成的Excel文件进行导入</li>
                        </ol>
                      </div>
                    </v-alert>

                    <v-btn
                      color="info"
                      variant="outlined"
                      prepend-icon="mdi-download"
                      @click="downloadTemplate"
                      :loading="downloadingTemplate"
                      class="mb-3"
                    >
                      下载Excel模板
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- 文件上传区域 -->
                <v-row>
                  <v-col cols="12">
                    <v-file-input
                      v-model="excelFile"
                      label="选择Excel文件"
                      accept=".xlsx,.xls"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-file-excel"
                      :rules="[rules.required]"
                      @change="handleFileChange"
                      @update:model-value="handleFileChange"
                      clearable
                      :loading="validatingFile"
                      :multiple="false"
                    />
                  </v-col>
                </v-row>

                <!-- 验证结果显示 -->
                <div v-if="validationResult">
                  <v-card
                    :color="validationResult.is_valid ? 'success' : 'error'"
                    variant="tonal"
                    class="mt-3"
                  >
                    <v-card-text>
                      <div class="d-flex align-center mb-2">
                        <v-icon
                          :icon="validationResult.is_valid ? 'mdi-check-circle' : 'mdi-alert-circle'"
                          class="mr-2"
                        />
                        <span class="font-weight-medium">
                          {{ validationResult.is_valid ? '验证通过' : '验证失败' }}
                        </span>
                      </div>

                      <div v-if="validationResult.is_valid" class="text-body-2">
                        共发现 {{ validationResult.data.length }} 条有效数据
                      </div>

                      <div v-if="validationResult.errors.length > 0">
                        <div class="text-body-2 font-weight-medium mb-1">错误信息：</div>
                        <ul class="text-body-2">
                          <li v-for="error in validationResult.errors" :key="error">
                            {{ error }}
                          </li>
                        </ul>
                      </div>

                      <div v-if="validationResult.warnings.length > 0">
                        <div class="text-body-2 font-weight-medium mb-1 mt-2">警告信息：</div>
                        <ul class="text-body-2">
                          <li v-for="warning in validationResult.warnings" :key="warning">
                            {{ warning }}
                          </li>
                        </ul>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </div>

            <!-- 第二步：物品信息 (仅手动创建模式) -->
            <div v-show="currentStep === 2 && createMode === 'manual'">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-package-variant" class="mr-2" color="primary" />
                物品详情
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.material_name"
                    label="物品名称"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-package"
                    placeholder="请输入物品名称"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.brand"
                    label="品牌"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-tag"
                    placeholder="请输入品牌名称"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.material_code"
                    label="物料编码"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-barcode"
                    placeholder="请输入物料编码（可选）"
                    clearable
                    hint="如果知道物料编码，请填写以便快速识别"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="localPr.quantity"
                    label="数量"
                    type="number"
                    min="0"
                    step="0.01"
                    :rules="[rules.required, rules.positive]"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-counter"
                    placeholder="请输入数量"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="localPr.specification"
                    label="规格说明"
                    rows="3"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-format-list-bulleted"
                    placeholder="请详细描述物品的规格、型号、技术参数等..."
                    counter="1000"
                    :rules="[rules.maxLength(1000)]"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- 第三步：确认信息 -->
            <div v-show="currentStep === 3">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-check-circle" class="mr-2" color="primary" />
                确认信息
              </div>

              <!-- 手动创建模式的预览 -->
              <div v-if="createMode === 'manual'">
                <!-- 信息预览卡片 -->
                <v-card class="mb-4">
                  <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                    <v-icon icon="mdi-eye" class="mr-2" />
                    申请信息预览
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <v-row>
                      <v-col cols="12" md="6">
                        <div class="text-caption text-grey">物品名称</div>
                        <div class="text-body-1 font-weight-medium">{{ localPr.material_name || '未填写' }}</div>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="text-caption text-grey">数量</div>
                        <div class="text-body-1 font-weight-medium">{{ localPr.quantity || '未填写' }}</div>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="text-caption text-grey">品牌</div>
                        <div class="text-body-1">{{ localPr.brand || '未填写' }}</div>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="text-caption text-grey">需求日期</div>
                        <div class="text-body-1">{{ formatDate(localPr.required_date) || '未填写' }}</div>
                      </v-col>
                      <v-col cols="12" v-if="localPr.material_code">
                        <div class="text-caption text-grey">物料编码</div>
                        <div class="text-body-1">{{ localPr.material_code }}</div>
                      </v-col>
                      <v-col cols="12" v-if="localPr.specification">
                        <div class="text-caption text-grey">规格说明</div>
                        <div class="text-body-1">{{ localPr.specification }}</div>
                      </v-col>
                      <v-col cols="12" v-if="localPr.description">
                        <div class="text-caption text-grey">申请说明</div>
                        <div class="text-body-1">{{ localPr.description }}</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <!-- 备注信息 -->
                <v-textarea
                  v-model="localPr.remarks"
                  label="备注信息"
                  rows="3"
                  density="comfortable"
                  prepend-inner-icon="mdi-note-text"
                  counter="500"
                  :rules="[rules.maxLength(500)]"
                />
              </div>

              <!-- Excel导入模式的确认 -->
              <div v-if="createMode === 'excel'">
                <v-card class="mb-4">
                  <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                    <v-icon icon="mdi-file-excel" class="mr-2" />
                    导入数据预览
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div v-if="validationResult && validationResult.is_valid">
                      <div class="text-body-2 mb-3">
                        即将导入 <strong>{{ validationResult.data.length }}</strong> 条PR记录
                      </div>

                      <!-- 数据预览表格 -->
                      <v-data-table
                        :headers="previewHeaders"
                        :items="validationResult.data.slice(0, 5)"
                        density="compact"
                        class="border"
                        hide-default-footer
                      >
                        <template #bottom>
                          <div class="text-center pa-2 text-caption text-grey">
                            {{ validationResult.data.length > 5 ? `仅显示前5条，共${validationResult.data.length}条` : `共${validationResult.data.length}条` }}
                          </div>
                        </template>
                      </v-data-table>
                    </div>
                    <div v-else class="text-center text-grey">
                      请先上传并验证Excel文件
                    </div>
                  </v-card-text>
                </v-card>

                <!-- 导入选项 -->
                <v-card>
                  <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                    <v-icon icon="mdi-cog" class="mr-2" />
                    导入选项
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <v-checkbox
                      v-model="overwriteExisting"
                      label="覆盖已存在的相同物品申请"
                      density="compact"
                      color="warning"
                    />
                    <div class="text-caption text-grey mt-1">
                      如果勾选，将更新已存在的相同物品名称的待提交状态PR；否则跳过重复项
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>

          <!-- 编辑模式：简化表单 -->
          <div v-else>
            <v-row>
              <!-- 基本信息 -->
              <v-col cols="12">
                <div class="text-h6 mb-4 d-flex align-center">
                  <v-icon icon="mdi-information" class="mr-2" color="primary" />
                  基本信息
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.required_date"
                  label="需求日期"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                  :readonly="!canEditBasicInfo"
                  :hint="canEditBasicInfo ? '请选择您希望收到物品的日期' : '当前状态下不可编辑'"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.approved_date"
                  label="批准时间"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  hint="状态变更为已批准时自动记录"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.delivery_date"
                  label="到货时间"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  :readonly="!canEditDeliveryDate"
                  :hint="canEditDeliveryDate ? '可手动修改到货时间' : '状态变更为已到货时自动记录'"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.description"
                  label="申请说明(可选)"
                  rows="2"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-text"
                  :readonly="!canEditBasicInfo"
                  :placeholder="canEditBasicInfo ? '请简要说明申请原因、用途等...' : '当前状态下不可编辑'"
                />
              </v-col>

              <!-- 物品信息 -->
              <v-col cols="12">
                <div class="text-h6 mb-4 d-flex align-center">
                  <v-icon icon="mdi-package-variant" class="mr-2" color="primary" />
                  物品信息
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.material_name"
                  label="物品名称"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-package"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入物品名称' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.brand"
                  label="品牌"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-tag"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入品牌名称' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.material_code"
                  label="物料编码"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                  :readonly="!canEditMaterialInfo"
                  :clearable="canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入物料编码（可选）' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="localPr.quantity"
                  label="数量"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-counter"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入数量' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.specification"
                  label="规格说明"
                  rows="3"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-format-list-bulleted"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请详细描述物品的规格、型号、技术参数等...' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.remarks"
                  label="备注"
                  rows="2"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-note-text"
                  :placeholder="canEditRemarks ? '可填写特殊要求、紧急程度等说明' : '当前状态下不可编辑'"
                  :readonly="!canEditRemarks"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- 操作按钮 -->
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />

        <!-- 新建模式的步骤导航按钮 -->
        <template v-if="isNew">
          <v-btn
            variant="outlined"
            @click="close"
          >
            <v-icon icon="mdi-close" class="mr-1" />
            取消
          </v-btn>

          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            color="primary"
            @click="previousStep"
            class="ml-2"
          >
            <v-icon icon="mdi-chevron-left" class="mr-1" />
            上一步
          </v-btn>

          <v-btn
            v-if="currentStep < 3"
            color="primary"
            :disabled="!canProceedToNextStep"
            @click="nextStep"
            class="ml-2"
          >
            下一步
            <v-icon icon="mdi-chevron-right" class="ml-1" />
          </v-btn>

          <v-btn
            v-if="currentStep === 3"
            color="success"
            :loading="createMode === 'manual' ? loading : importingData"
            :disabled="createMode === 'manual' ? !valid : (!validationResult || !validationResult.is_valid)"
            @click="save"
            class="ml-2"
          >
            <v-icon :icon="createMode === 'manual' ? 'mdi-check' : 'mdi-upload'" class="mr-1" />
            {{ createMode === 'manual' ? '提交申请' : '开始导入' }}
          </v-btn>
        </template>

        <!-- 编辑模式的简单按钮 -->
        <template v-else>
          <v-btn
            variant="outlined"
            @click="close"
          >
            <v-icon icon="mdi-close" class="mr-1" />
            取消
          </v-btn>

          <v-btn
            v-if="hasEditableFields"
            color="primary"
            :loading="loading"
            :disabled="!valid"
            @click="save"
            class="ml-2"
          >
            <v-icon icon="mdi-content-save" class="mr-1" />
            保存更改
          </v-btn>

          <v-btn
            v-else
            color="grey"
            disabled
            class="ml-2"
          >
            <v-icon icon="mdi-lock" class="mr-1" />
            当前状态不可编辑
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Excel导入成功对话框 -->
  <v-dialog
    v-model="importSuccessDialog"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 text-center pa-6">
        <v-icon icon="mdi-check-circle" color="success" size="48" class="mb-2" />
        <div class="text-success">导入成功！</div>
      </v-card-title>

      <v-card-text class="text-center pa-6">
        <div class="text-h6 mb-4">{{ importSuccessMessage }}</div>

        <div v-if="importSuccessDetails" class="text-body-1">
          <v-row class="text-center">
            <v-col cols="3">
              <div class="text-h4 text-success">{{ importSuccessDetails.imported_rows || 0 }}</div>
              <div class="text-caption">新增</div>
            </v-col>
            <v-col cols="3">
              <div class="text-h4 text-info">{{ importSuccessDetails.updated_rows || 0 }}</div>
              <div class="text-caption">更新</div>
            </v-col>
            <v-col cols="3">
              <div class="text-h4 text-warning">{{ importSuccessDetails.skipped_rows || 0 }}</div>
              <div class="text-caption">跳过</div>
            </v-col>
            <v-col cols="3">
              <div class="text-h4 text-error">{{ importSuccessDetails.error_rows || 0 }}</div>
              <div class="text-caption">错误</div>
            </v-col>
          </v-row>

          <div v-if="importSuccessDetails.created_pr_numbers && importSuccessDetails.created_pr_numbers.length > 0" class="mt-4">
            <v-divider class="mb-3" />
            <div class="text-subtitle-2 mb-2">创建的PR编号：</div>
            <v-chip-group>
              <v-chip
                v-for="prNumber in importSuccessDetails.created_pr_numbers"
                :key="prNumber"
                size="small"
                color="primary"
                variant="outlined"
              >
                {{ prNumber }}
              </v-chip>
            </v-chip-group>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="justify-center pa-6">
        <v-btn
          color="success"
          variant="elevated"
          size="large"
          @click="handleImportSuccessClose"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: Boolean,
  pr: Object,
  isNew: Boolean,
  loading: Boolean,
  statusOptions: Array,
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:pr', 'save', 'close'])

// 响应式数据
const formRef = ref(null)
const valid = ref(false)
const localPr = ref({})
const currentStep = ref(1)

// Excel导入相关
const createMode = ref('manual') // 'manual' | 'excel'
const excelFile = ref(null)
const validationResult = ref(null)
const overwriteExisting = ref(false)
const downloadingTemplate = ref(false)
const validatingFile = ref(false)
const importingData = ref(false)
const importSuccessDialog = ref(false)
const importSuccessMessage = ref('')
const importSuccessDetails = ref(null)

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 获取今天的日期作为最小日期
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// 根据状态判断字段是否可编辑
const canEditBasicInfo = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 在"待提交"和"审批中"状态下可以编辑基本信息
  return ['待提交', '审批中'].includes(statusName)
})

const canEditMaterialInfo = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 在"待提交"状态下可以编辑物品信息
  return ['待提交'].includes(statusName)
})

const canEditDeliveryDate = computed(() => {
  if (props.isNew) return false
  const statusName = localPr.value.status?.name
  // 在"采购中"和"已到货"状态下可以编辑到货时间
  return ['采购中', '已到货'].includes(statusName)
})

// 备注在大部分状态下都可以编辑
const canEditRemarks = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 除了"已取消"和"已拒绝"状态，其他状态都可以编辑备注
  return !['已取消', '已拒绝'].includes(statusName)
})

// 判断是否有任何字段可以编辑
const hasEditableFields = computed(() => {
  if (props.isNew) return true
  return canEditBasicInfo.value || canEditMaterialInfo.value || canEditDeliveryDate.value || canEditRemarks.value
})

// 检查是否可以进入下一步
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      if (createMode.value === 'manual') {
        // 手动创建模式：第一步不需要验证
        return true
      } else {
        // Excel导入模式：需要有有效的验证结果
        return validationResult.value && validationResult.value.is_valid
      }
    case 2:
      if (createMode.value === 'manual') {
        // 手动创建模式：物品名称和数量必填
        return localPr.value.material_name &&
               localPr.value.quantity &&
               localPr.value.quantity > 0
      } else {
        // Excel导入模式：跳过第二步
        return true
      }
    default:
      return true
  }
})

// 预览表格表头
const previewHeaders = computed(() => [
  { title: '物品名称', key: 'material_name', sortable: false },
  { title: '数量', key: 'quantity', sortable: false },
  { title: '品牌', key: 'brand', sortable: false },
  { title: '规格', key: 'specification', sortable: false },
  { title: '需求日期', key: 'required_date', sortable: false }
])

// 验证规则
const rules = {
  required: value => !!value || '此字段为必填项',
  positive: value => value > 0 || '数值必须大于0',
  maxLength: (max) => value => !value || value.length <= max || `最多${max}个字符`
}

// 步骤导航方法
const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 3) {
    if (createMode.value === 'excel' && currentStep.value === 1) {
      // Excel导入模式：从第一步直接跳到第三步
      currentStep.value = 3
    } else {
      currentStep.value++
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    if (createMode.value === 'excel' && currentStep.value === 3) {
      // Excel导入模式：从第三步直接回到第一步
      currentStep.value = 1
    } else {
      currentStep.value--
    }
  }
}

// Excel导入相关方法
const downloadTemplate = async () => {
  try {
    downloadingTemplate.value = true
    const { get } = await import('@/utils/api')

    const response = await get('/pr/excel/template', {
      responseType: 'blob'
    })

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'PR_Import_Template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    const { Message } = await import('@/utils/notification')
    Message.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    const { Message } = await import('@/utils/notification')
    const errorMessage = error?.response?.data?.detail || error?.message || '未知错误'
    Message.error('下载模板失败: ' + errorMessage)
  } finally {
    downloadingTemplate.value = false
  }
}

const handleFileChange = async () => {
  console.log('handleFileChange called, excelFile.value:', excelFile.value)
  console.log('excelFile.value type:', typeof excelFile.value)
  console.log('excelFile.value is array:', Array.isArray(excelFile.value))

  // 检查文件是否存在
  let file = null
  if (Array.isArray(excelFile.value)) {
    file = excelFile.value[0]
    console.log('File from array:', file)
  } else {
    file = excelFile.value
    console.log('File direct:', file)
  }

  console.log('Final selected file:', file)
  console.log('File instanceof File:', file instanceof File)
  console.log('File name:', file?.name)
  console.log('File size:', file?.size)
  console.log('File type:', file?.type)

  if (!file || !(file instanceof File)) {
    console.log('No valid file selected, clearing validation result')
    validationResult.value = null
    return
  }

  try {
    validatingFile.value = true
    console.log('Starting file validation...')

    const { post } = await import('@/utils/api')

    const formData = new FormData()
    formData.append('file', file)

    console.log('FormData created:')
    console.log('FormData instanceof FormData:', formData instanceof FormData)
    for (let [key, value] of formData.entries()) {
      console.log(`FormData entry: ${key} =`, value)
      if (value instanceof File) {
        console.log(`  File details: name=${value.name}, size=${value.size}, type=${value.type}`)
      }
    }

    console.log('Sending request to /pr/excel/validate...')
    console.log('Data being sent:', formData)

    // 直接使用axios实例来测试
    const { default: axios } = await import('axios')
    const userStore = (await import('@/stores/user')).useUserStore()

    console.log('User token:', userStore.token ? 'exists' : 'missing')
    console.log('Request config:', {
      url: '/api/v1/pr/excel/validate',
      baseURL: 'http://localhost:8000',
      headers: {
        'Authorization': `Bearer ${userStore.token ? userStore.token.substring(0, 10) + '...' : 'none'}`
      }
    })

    const response = await axios.post('/api/v1/pr/excel/validate', formData, {
      baseURL: 'http://localhost:8000',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    console.log('Full response:', response)
    console.log('Response status:', response.status)
    console.log('Response data:', response.data)
    console.log('Response data type:', typeof response.data)
    console.log('Response data keys:', response.data ? Object.keys(response.data) : 'no data')

    validationResult.value = response.data

    if (validationResult.value && validationResult.value.is_valid) {
      try {
        const { Message } = await import('@/utils/notification')
        const dataCount = validationResult.value.data ? validationResult.value.data.length : 0
        if (Message && Message.success) {
          Message.success(`文件验证成功，发现 ${dataCount} 条有效数据`)
        } else {
          console.log(`文件验证成功，发现 ${dataCount} 条有效数据`)
        }
      } catch (notificationError) {
        console.error('无法显示成功消息:', notificationError)
        console.log('文件验证成功')
      }
    }
  } catch (error) {
    console.error('验证文件失败:', error)

    let errorMessage = '未知错误'
    if (error && error.response && error.response.data) {
      if (Array.isArray(error.response.data.detail)) {
        errorMessage = error.response.data.detail.map(e => e.msg || e).join(', ')
      } else if (typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message
      }
    } else if (error && error.message) {
      errorMessage = error.message
    }

    try {
      const { Message } = await import('@/utils/notification')
      Message.error('验证文件失败: ' + errorMessage)
    } catch (notificationError) {
      console.error('无法显示错误消息:', notificationError)
    }

    validationResult.value = null
  } finally {
    validatingFile.value = false
  }
}

// 格式化日期显示
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取状态图标
const getStatusIcon = (status) => {
  if (!status) return 'mdi-help-circle'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'mdi-file-document-outline'
    case '审批中':
      return 'mdi-clock-outline'
    case '已批准':
      return 'mdi-check-circle'
    case '采购中':
      return 'mdi-cart'
    case '已到货':
      return 'mdi-truck-delivery'
    case '已取消':
    case '已拒绝':
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}

// 获取状态颜色
const getStatusColor = (status) => {
  if (!status) return 'grey'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'orange'
    case '审批中':
      return 'blue'
    case '已批准':
      return 'green'
    case '采购中':
      return 'purple'
    case '已到货':
      return 'cyan'
    case '已取消':
    case '已拒绝':
      return 'red'
    default:
      return 'grey'
  }
}

// 获取编辑权限提示
const getEditPermissionHint = (statusName) => {
  switch (statusName) {
    case '待提交':
      return '可编辑所有信息'
    case '审批中':
      return '可编辑基本信息和备注，物品信息已锁定'
    case '已批准':
      return '基本信息和物品信息已锁定，可编辑备注'
    case '采购中':
      return '可编辑到货时间和备注，其他信息已锁定'
    case '已到货':
      return '可编辑到货时间和备注，其他信息已锁定'
    case '已取消':
    case '已拒绝':
      return '所有信息已锁定，仅可查看'
    default:
      return '编辑权限受限，请联系管理员'
  }
}


// 保存方法
const save = async () => {
  if (createMode.value === 'manual') {
    // 手动创建模式
    const { valid: isValid } = await formRef.value.validate()
    if (!isValid) return
    emit('save', localPr.value)
  } else {
    // Excel导入模式
    await handleExcelImport()
  }
}

// Excel导入处理
const handleExcelImport = async () => {
  if (!validationResult.value || !validationResult.value.is_valid) {
    const { Message } = await import('@/utils/notification')
    Message.error('请先上传并验证Excel文件')
    return
  }

  try {
    importingData.value = true

    const file = Array.isArray(excelFile.value) ? excelFile.value[0] : excelFile.value
    const formData = new FormData()
    formData.append('file', file)
    formData.append('overwrite_existing', overwriteExisting.value.toString())

    console.log('Import FormData:')
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }
    console.log('overwriteExisting.value:', overwriteExisting.value)

    // 直接使用axios，就像验证阶段一样
    const { default: axios } = await import('axios')
    const userStore = (await import('@/stores/user')).useUserStore()

    console.log('Sending import request with axios...')
    const response = await axios.post('/api/v1/pr/excel/import', formData, {
      baseURL: 'http://localhost:8000',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    console.log('Import response:', response.data)
    console.log('Response success:', response.data.success)
    console.log('Response message:', response.data.message)

    try {
      const { Message } = await import('@/utils/notification')

      if (response.data.success) {
        // 显示详细的成功信息
        const successMsg = `导入成功！${response.data.message || ''}`
        const details = []
        if (response.data.imported_rows) details.push(`新增: ${response.data.imported_rows}条`)
        if (response.data.updated_rows) details.push(`更新: ${response.data.updated_rows}条`)
        if (response.data.skipped_rows) details.push(`跳过: ${response.data.skipped_rows}条`)

        const fullMessage = details.length > 0 ? `${successMsg} (${details.join(', ')})` : successMsg

        if (Message && Message.success) {
          Message.success(fullMessage)
        } else {
          console.log('成功消息:', fullMessage)
        }

        // 显示成功对话框
        importSuccessDialog.value = true
        importSuccessMessage.value = fullMessage
        importSuccessDetails.value = response.data
      } else {
        const errorMsg = response.data.message || '导入失败'
        if (Message && Message.error) {
          Message.error(errorMsg)
        } else {
          console.error('错误消息:', errorMsg)
        }
      }
    } catch (notificationError) {
      console.error('无法显示消息:', notificationError)
      console.log('导入结果:', response.data)
    }
  } catch (error) {
    console.error('导入数据失败:', error)

    let errorMessage = '未知错误'
    if (error && error.response && error.response.data) {
      if (Array.isArray(error.response.data.detail)) {
        errorMessage = error.response.data.detail.map(e => e.msg || e).join(', ')
      } else if (typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message
      }
    } else if (error && error.message) {
      errorMessage = error.message
    }

    try {
      const { Message } = await import('@/utils/notification')
      if (Message && Message.error) {
        Message.error('导入数据失败: ' + errorMessage)
      } else {
        console.error('导入数据失败: ' + errorMessage)
      }
    } catch (notificationError) {
      console.error('无法显示错误消息:', notificationError)
      console.error('导入数据失败: ' + errorMessage)
    }
  } finally {
    importingData.value = false
  }
}

// 关闭方法
const close = () => {
  // 重置步骤
  currentStep.value = 1
  // 重置Excel导入相关状态
  createMode.value = 'manual'
  excelFile.value = null
  validationResult.value = null
  overwriteExisting.value = false
  // 重置成功对话框状态
  importSuccessDialog.value = false
  importSuccessMessage.value = ''
  importSuccessDetails.value = null
  emit('close')
}

// 处理导入成功对话框关闭
const handleImportSuccessClose = () => {
  importSuccessDialog.value = false
  // 延迟关闭主对话框，确保成功对话框完全关闭
  setTimeout(() => {
    close()
    // 通知父组件刷新数据
    emit('save', { isExcelImport: true, result: importSuccessDetails.value })
  }, 300)
}

// 监听props变化
watch(() => props.pr, (newPr) => {
  if (newPr) {
    localPr.value = { ...newPr }
  }
}, { immediate: true, deep: true })

// 监听dialog变化，重置表单和步骤
watch(dialog, (newVal) => {
  if (newVal) {
    // 重置步骤到第一步
    currentStep.value = 1
    // 重置表单验证
    if (formRef.value) {
      formRef.value.resetValidation()
    }
  }
})
</script>

<style scoped>
.pr-dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.v-stepper {
  box-shadow: none !important;
}

.v-stepper-header {
  box-shadow: none !important;
  padding: 0 16px;
}

.v-stepper-item {
  padding: 8px 0;
}

.v-stepper-item__title {
  font-size: 0.875rem;
  font-weight: 500;
}

.v-stepper-window {
  margin: 0;
}

.v-card-title {
  border-radius: 0;
}

.v-alert {
  border-radius: 8px;
}

/* 自定义步骤指示器颜色 */
.v-stepper-item--complete .v-stepper-item__icon {
  background-color: rgb(var(--v-theme-success)) !important;
}

.v-stepper-item--selected .v-stepper-item__icon {
  background-color: rgb(var(--v-theme-primary)) !important;
}

/* 表单字段间距优化 */
.v-text-field, .v-textarea {
  margin-bottom: 8px;
}

/* 预览卡片样式 */
.v-card-title {
  font-size: 1rem;
  font-weight: 500;
}

/* 响应式优化 */
@media (max-width: 600px) {
  .pr-dialog-card {
    margin: 8px;
    max-width: calc(100vw - 16px) !important;
  }

  .v-stepper-header {
    padding: 0 8px;
  }

  .v-stepper-item__title {
    font-size: 0.75rem;
  }
}
</style>
