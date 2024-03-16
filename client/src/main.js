//入口

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
//element-plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
//粒子库
import Particles from "@tsparticles/vue3";
import { loadFull } from "tsparticles";
//引入自己配置的axios拦截器
import "./util/axios.config";

createApp(App)
    .use(Particles, {
        init: async engine => {
            await loadFull(engine);
        },
    })
    .use(ElementPlus)
    .use(store)
    .use(router)
    .mount('#app');
