<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useAuthModal } from '../../composables/useAuthModal'
import { useFocusTrap } from '../../composables/useFocusTrap'
import LoginForm from './LoginForm.vue'
import SignUpForm from './SignUpForm.vue'

const { isOpen, activeView, close, switchTo } = useAuthModal()

const dialogEl = ref<HTMLElement | null>(null)
const formRef = ref<{ focusFirstField: () => void } | null>(null)

useFocusTrap(dialogEl, isOpen)

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  formRef.value?.focusFirstField()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="auth-modal__backdrop" @click.self="close" @keydown.esc="close">
      <div ref="dialogEl" class="auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button type="button" class="auth-modal__close" aria-label="Fermer" @click="close">×</button>
        <h2 id="auth-modal-title">{{ activeView === 'login' ? 'Se connecter' : 'Créer un compte' }}</h2>

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
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.auth-modal__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.auth-modal__dialog {
  position: relative;
  width: min(90vw, 400px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem 1.5rem 1.5rem;
  background: var(--bg);
  color: var(--text-h);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.auth-modal__dialog h2 {
  margin: 0 0 1rem;
}

.auth-modal__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-h);
}
</style>
