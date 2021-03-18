import Vue from 'vue';
import Router from 'vue-router';
// @ts-ignore
import ChatComponent from '@/components/Chat';
// @ts-ignore
import LandingPage from '@/pages/Landing';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: '/',
  routes: [
    {
      path: '/',
      name: 'home',
      component: ChatComponent,
    },
    {
      path: '/landing',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '*',
      component: {
        render(h) {
          return h('h1', 'Page not found!');
        },
      },
    },
  ],
});

export default router;
