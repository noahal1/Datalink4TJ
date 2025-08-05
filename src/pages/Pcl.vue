<template>
  <unified-page-template 
    title="物流管理"
    icon="mdi-package-variant-closed"
    color="amber-darken-2"
  >
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>开发中</v-card-title>
          <v-card-text>
            <p>这个页面正在开发中</p>
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