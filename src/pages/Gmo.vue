<template>
  <unified-page-template 
    title="GMO管理"
    icon="mdi-dna"
    color="primary"
  >
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>GMO模块开发中</v-card-title>
          <v-card-text>
            <p>这个页面正在开发中，即将包含GMO相关数据的管理功能。</p>
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