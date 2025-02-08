<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-chart-bar</v-icon>
              统计信息
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-sheet class="pa-4" color="primary" dark>
                    <div>数据总数</div>
                    <div class="headline">1500</div>
                  </v-sheet>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-history</v-icon>
              最近活动
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item v-for="(activity, index) in recentActivities" :key="index">
                  <v-list-item-content>
                    <v-list-item-title>{{ activity.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ activity.timestamp }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const recentActivities = ref([
    { title: '用户A更新了数据', timestamp: '2023-10-01 10:00' },

  ])
  </script>
  
  <style scoped>
  
  </style>