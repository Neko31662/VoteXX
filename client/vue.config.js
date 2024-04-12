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
    },

    configureWebpack: {
        resolve: {
            fallback: {
                crypto: require.resolve('crypto-browserify'),
                os: require.resolve("os-browserify/browser"),
                stream: require.resolve("stream-browserify"),
                vm: require.resolve("vm-browserify")
                // 其他需要回退的模块...
            },
        },
    },
});
