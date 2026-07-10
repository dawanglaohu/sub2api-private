<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="homeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- 聚蚁二开首页(默认落地页整体重构,见 views/home/JuyiHome.vue) -->
  <JuyiHome v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import JuyiHome from '@/views/home/JuyiHome.vue'

const appStore = useAppStore()

const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})
</script>
