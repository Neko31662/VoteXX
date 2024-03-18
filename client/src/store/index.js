//存储全局变量等
import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";

export default createStore({
    state: {
        isGetterRouter: false,
        isCollapsed: false,
        userInfo: {}
    },
    getters: {
    },
    mutations: {
        changeGetterRouter(state, value) {
            state.isGetterRouter = value;
        },
        changeCollapsed(state) {
            state.isCollapsed = !state.isCollapsed;
        },
        changeUserInfo(state, value) {
            state.userInfo = {
                ...state.userInfo,
                ...value
            };
        },
        clearUserInfo(state) {
            state.userInfo = {};
        }
    },
    actions: {
    },
    modules: {
    },
    plugins: [
        //放在里面的数据会持久化（存在本地，被记住）
        createPersistedState({
            paths: [
                "isCollapsed",
                "userInfo"
            ]
        })
    ]
});
