
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import mathRender from './directives/mathRender'

const app = createApp(App)
app.directive('math-render', mathRender)
app.use(router)
app.mount('#app')
