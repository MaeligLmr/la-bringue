<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Navbar from './components/layout/Navbar.vue'
import Modal from './components/layout/Modal.vue'
import LoginForm from './components/auth/LoginForm.vue'
import SignUpForm from './components/auth/SignUpForm.vue'
import { useAuthModal } from './composables/useAuthModal'

const { isOpen, activeView, close, switchTo } = useAuthModal()

const formRef = ref<{ focusFirstField: () => void } | null>(null)

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  formRef.value?.focusFirstField()
})
</script>

<template>
  <Navbar />

  <Modal
    :open="isOpen"
    :title="activeView === 'login' ? 'Se connecter' : 'Créer un compte'"
    @close="close"
  >
    <LoginForm
      v-if="activeView === 'login'"
      ref="formRef"
      @switch="switchTo('signup')"
      @success="close"
    />
    <SignUpForm
      v-else
      ref="formRef"
      @switch="switchTo('login')"
      @success="close"
    />
  </Modal>
</template>
