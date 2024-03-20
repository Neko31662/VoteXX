const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
    transpileDependencies: true,

    devServer: {
        //反向代理
        proxy: {
            "/serverapi": {
                target: "http://localhost:3000",
                changeOrigin: true
            }
        },

        //报错显示
        client: {
            overlay: false
        }
    }
});
