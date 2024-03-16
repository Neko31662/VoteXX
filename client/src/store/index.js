//存储全局变量等
import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";

export default createStore({
    state: {
        isGetterRouter: false,
        isCollapsed: false
    },
    getters: {
    },
    mutations: {
        changeGetterRouter(state, value) {
            state.isGetterRouter = value;
        },
        changeCollapsed(state) {
            state.isCollapsed = !state.isCollapsed;
        }
    },
    actions: {
    },
    modules: {
    },
    plugins: [
        createPersistedState({
            paths: ["isCollapsed"]//放在里面的数据会持久化（存在本地，被记住）
        })
    ]
});
