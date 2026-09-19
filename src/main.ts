import { createApp } from 'vue'
import './style.css'
import './supabase'
import App from './App.vue'
import { useTheme } from './composables/useTheme'

// Initialize as early as possible so <html data-theme> is set (from the
// device's light/dark preference, unless the user has overridden it via
// the Navbar toggle) before the app renders.
useTheme()

createApp(App).mount('#app')
