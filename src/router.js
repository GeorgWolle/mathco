import { createRouter, createWebHistory } from 'vue-router'
import StudentTaskView from './components/StudentTaskView.vue'
import AdminReviewView from './components/AdminReviewView.vue'
import GratulationView from './components/GratulationView.vue'

const routes = [
  {
    path: '/',
    name: 'student',
    component: StudentTaskView,
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminReviewView,
  },
  {
    path: '/gratulation',
    name: 'gratulation',
    component: GratulationView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
