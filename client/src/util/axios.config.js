import axios from "axios";

//请求前执行
axios.interceptors.request.use(function (config) {

    let { url } = config;
    if (url.includes("/serverapi/vote-private")) {
        return config;
    }
    //挂载存储的token
    const token = localStorage.getItem("token");
    config.headers.Authorization = `Bearer ${token}`;

    return config;
}, function (error) {
    //错误处理
    return Promise.reject(error);
});

//接收响应时执行
axios.interceptors.response.use(function (response) {

    //获取token，如果获取到就存储至localStorage
    const { authorization } = response.headers;
    if (authorization) {
        localStorage.setItem("token", authorization);
    }
    return response;
}, function (error) {
    //错误处理

    const { status } = error.response;
    if (status === 401) {
        //token过期，跳转login
        window.location.href = "#/login";
    }
    return Promise.reject(error);
});
