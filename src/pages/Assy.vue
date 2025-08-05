<template>
  <unified-page-template 
    title="生产管理"
    icon="mdi-factory"
    color="secondary"
  >
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>生产部门功能开发中</v-card-title>
          <v-card-text>
            <p>这个页面正在开发中，即将包含生产部门数据的浏览和修改功能。</p>
            <v-alert
              type="info"
              border="start"
              variant="tonal"
              class="mt-4"
            >
              <v-icon class="me-2">
                mdi-information-outline
              </v-icon>
              该功能预计将在下一个版本中完成
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </unified-page-template>
</template>

<script setup>
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue';
</script>

<style scoped>
</style>