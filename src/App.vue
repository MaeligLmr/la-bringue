<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import Navbar from './components/layout/Navbar.vue'
import SupportSection from './components/layout/SupportSection.vue'
import Footer from './components/layout/Footer.vue'
import Modal from './components/layout/Modal.vue'
import LoginForm from './components/auth/LoginForm.vue'
import SignUpForm from './components/auth/SignUpForm.vue'
import { useAuthModal } from './composables/useAuthModal'
import { useLikes } from './composables/useLikes'
import { useTheme } from './composables/useTheme'

const { isOpen, activeView, close, complete, takePendingLike, switchTo } = useAuthModal()
const { addLike } = useLikes()
const { resolvedTheme } = useTheme()
const route = useRoute()

const formRef = ref<{ focusFirstField: () => void } | null>(null)

function onAuthSuccess() {
  complete()
  const likeTarget = takePendingLike()
  if (likeTarget) addLike(likeTarget)
}

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  formRef.value?.focusFirstField()
})
</script>

<template>
  <Toaster rich-colors position="top-right" :theme="resolvedTheme" />

  <Navbar />

  <RouterView />

  <SupportSection v-if="!route.meta.hideSupport" />

  <Footer />

  <Modal
    :open="isOpen"
    :title="activeView === 'login' ? 'Se connecter' : 'Créer un compte'"
    @close="close"
  >
    <LoginForm
      v-if="activeView === 'login'"
      ref="formRef"
      @switch="switchTo('signup')"
      @success="onAuthSuccess"
    />
    <SignUpForm
      v-else
      ref="formRef"
      @switch="switchTo('login')"
      @success="onAuthSuccess"
    />
  </Modal>
</template>
