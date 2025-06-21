<template>
  <v-dialog v-model="dialog" max-width="700px">
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">mdi-routes</v-icon>
        页面路径设置
      </v-card-title>
      
      <v-card-text class="pt-4">
        <v-alert
          type="info"
          variant="tonal"
          border="start"
          class="mb-4"
          density="comfortable"
        >
          在此设置页面路径规则。您可以设置静态路径或包含参数的动态路径。
        </v-alert>
        
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="pathData.basePath"
                label="基础路径"
                placeholder="例如: /users 或 /products"
                variant="outlined"
                :rules="[rules.required]"
                hint="路径必须以/开头"
                persistent-hint
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-switch
                v-model="pathData.hasDynamicSegments"
                color="primary"
                label="包含动态参数"
                hide-details
              ></v-switch>
            </v-col>
            
            <template v-if="pathData.hasDynamicSegments">
              <v-col cols="12">
                <div class="d-flex align-center mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium">路径参数</h3>
                  <v-spacer></v-spacer>
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="text" 
                    prepend-icon="mdi-plus"
                    @click="addPathParam"
                  >
                    添加参数
                  </v-btn>
                </div>
                
                <v-alert
                  v-if="!pathData.params.length"
                  type="info"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                >
                  尚未添加任何参数。点击"添加参数"按钮来添加动态路径参数。
                </v-alert>
                
                <div v-for="(param, index) in pathData.params" :key="index" class="mb-3 pa-3 border rounded">
                  <div class="d-flex align-center mb-2">
                    <h4 class="text-body-1">参数 #{{ index + 1 }}</h4>
                    <v-spacer></v-spacer>
                    <v-btn 
                      size="x-small" 
                      color="error" 
                      variant="text" 
                      icon
                      @click="removePathParam(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="param.name"
                        label="参数名称"
                        placeholder="例如: id 或 userId"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="param.type"
                        :items="paramTypes"
                        item-title="text"
                        item-value="value"
                        label="参数类型"
                        variant="outlined"
                        density="comfortable"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="param.description"
                        label="参数描述"
                        placeholder="描述此参数的用途"
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="param.required"
                        label="必填参数"
                        color="primary"
                        hide-details
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </template>
            
            <v-col cols="12">
              <v-divider class="my-3"></v-divider>
              <h3 class="text-subtitle-1 font-weight-medium mb-2">预览</h3>
              <v-alert
                color="primary"
                variant="tonal"
                border="start"
                class="path-preview"
              >
                <code>{{ formattedPath }}</code>
              </v-alert>
            </v-col>
            
            <v-col cols="12" v-if="pathData.hasDynamicSegments">
              <h3 class="text-subtitle-1 font-weight-medium mb-2">示例URL</h3>
              <v-alert
                color="success"
                variant="outlined"
                class="path-preview"
              >
                <code>{{ examplePath }}</code>
              </v-alert>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" @click="savePathSettings" :disabled="!valid">确定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentPath: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

// 表单验证
const form = ref(null);
const valid = ref(true);
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};

// 对话框状态
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 参数类型选项
const paramTypes = [
  { text: '字符串', value: 'string' },
  { text: '数字', value: 'number' },
  { text: 'UUID', value: 'uuid' },
  { text: '日期', value: 'date' },
  { text: '任意值', value: 'any' }
];

// 路径数据
const pathData = ref({
  basePath: '',
  hasDynamicSegments: false,
  params: []
});

// 监听当前路径变化
watch(() => props.currentPath, (newPath) => {
  if (newPath) {
    parseCurrentPath(newPath);
  }
}, { immediate: true });

// 解析当前路径
const parseCurrentPath = (path) => {
  // 重置路径数据
  pathData.value = {
    basePath: '',
    hasDynamicSegments: false,
    params: []
  };
  
  if (!path) return;
  
  // 检查是否有动态参数 (形如 /:paramName)
  const segments = path.split('/');
  const staticSegments = [];
  const params = [];
  
  segments.forEach(segment => {
    if (segment.startsWith(':')) {
      // 这是一个参数
      const paramName = segment.substring(1);
      params.push({
        name: paramName,
        type: 'string',
        description: '',
        required: true
      });
    } else if (segment) {
      staticSegments.push(segment);
    }
  });
  
  // 设置基础路径和参数
  pathData.value.basePath = '/' + staticSegments.join('/');
  pathData.value.hasDynamicSegments = params.length > 0;
  pathData.value.params = params;
};

// 格式化路径
const formattedPath = computed(() => {
  let path = pathData.value.basePath;
  
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // 添加参数
  if (pathData.value.hasDynamicSegments && pathData.value.params.length > 0) {
    pathData.value.params.forEach(param => {
      path += `/:${param.name}`;
      if (!param.required) {
        path += '?';
      }
    });
  }
  
  return path;
});

// 示例URL
const examplePath = computed(() => {
  let path = pathData.value.basePath;
  
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // 添加参数示例值
  if (pathData.value.hasDynamicSegments && pathData.value.params.length > 0) {
    pathData.value.params.forEach(param => {
      let exampleValue;
      
      switch (param.type) {
        case 'number':
          exampleValue = '123';
          break;
        case 'uuid':
          exampleValue = '123e4567-e89b-12d3-a456-426614174000';
          break;
        case 'date':
          exampleValue = '2023-07-15';
          break;
        case 'any':
        case 'string':
        default:
          exampleValue = param.name + '-value';
      }
      
      path += `/${exampleValue}`;
    });
  }
  
  return path;
});

// 添加路径参数
const addPathParam = () => {
  pathData.value.params.push({
    name: '',
    type: 'string',
    description: '',
    required: true
  });
};

// 移除路径参数
const removePathParam = (index) => {
  pathData.value.params.splice(index, 1);
};

// 关闭对话框
const closeDialog = () => {
  dialog.value = false;
};

// 保存路径设置
const savePathSettings = () => {
  if (!valid.value) {
    return;
  }
  
  emit('save', formattedPath.value, pathData.value);
  closeDialog();
};
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.rounded {
  border-radius: 4px !important;
}

.path-preview {
  font-family: monospace;
  font-size: 1.1em;
}
</style> 