//路由设置文件
import { createRouter, createWebHashHistory } from 'vue-router';
import Login from "../views/Login.vue";
import MainBox from "../views/MainBox.vue";
import SignUp from '../views/SignUp.vue';
import routesConfig from './config.js';//需要动态添加的路由从此处引入
import store from "../store/index.js";//引入全局变量

//路由设置
const routes = [
    {
        path: "/login",
        name: "login",
        component: Login,
        meta: {
            title: "欢迎使用VoteXX投票系统"
        }
    },
    {
        path: "/signup",
        name: "signup",
        component: SignUp,
        meta: {
            title: "注册新账户"
        }
    },
    {
        path: "/mainbox",
        name: "mainbox",
        component: MainBox,
        meta: {
            title: "主页"
        }
        //嵌套路由在后面动态添加
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});


const ConfigRouter = () => {
    //依次添加动态路由
    routesConfig.forEach(item => {
        router.addRoute("mainbox", item);
    });

    //调用store中方法修改全局变量
    store.commit("changeGetterRouter", true);
};


//根据路由设置中的meta.title字段设置标题
router.beforeEach((to, from, next) => {
    //设置过标题，则使用该标题
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    //未设置标题，使用默认标题
    else {
        document.title = "VoteXX投票系统";
    }
    next();
});

//路由守卫（路由跳转前，进行判断）
router.beforeEach((to, from, next) => {
    //to为login，直接跳转
    if (to.name === "login" || to.name === "signup") {
        next();//调用next()跳转到to
        return;
    }

    //否则，进行判断
    else {
        //未授权
        if (!localStorage.getItem("token")) {
            next({
                path: "/login"
            });
        }
        //已授权
        else {
            //还未加载动态路由
            if (!store.state.isGetterRouter) {
                //加载路由配置
                ConfigRouter();
                //next中含有参数时会调用router.beforeEach，要避免循环调用
                next({
                    path: to.fullPath
                });
            } else {
                next();
            }
        }
    }
});

export default router;
