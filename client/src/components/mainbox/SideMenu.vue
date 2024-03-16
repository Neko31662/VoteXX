<template>
    <el-aside width="auto">
        <el-menu :collapse="$store.state.isCollapsed" :router="true" :default-active="route.fullPath">
            <el-menu-item index="/index">
                <!-- 使用图标的方式：el-icon里套图标名称
                需要在"@element-plus/icons-vue"中引入图标名 -->
                <el-icon>
                    <HomeFilled />
                </el-icon>
                <span>首页</span>
            </el-menu-item>

            <el-menu-item index="/center">
                <el-icon>
                    <Avatar />
                </el-icon>
                <span>个人中心</span>
            </el-menu-item>

            <el-sub-menu index="/user-manage">
                <template #title>
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    <span>用户管理</span>
                </template>
                <el-menu-item index="/user-manage/adduser">添加用户</el-menu-item>
                <el-menu-item index="/user-manage/userlist">用户列表</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="/news-manage">
                <template #title>
                    <el-icon>
                        <MessageBox />
                    </el-icon>
                    <span>新闻管理</span>
                </template>
                <el-menu-item index="/news-manage/addnews">创建新闻</el-menu-item>
                <el-menu-item index="/news-manage/newslist">新闻列表</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="/product-manage">
                <template #title>
                    <el-icon>
                        <Reading />
                    </el-icon>
                    <span>产品管理</span>
                </template>
                <el-menu-item index="/product-manage/addproduct">添加产品</el-menu-item>
                <el-menu-item index="/product-manage/productlist">产品列表</el-menu-item>
            </el-sub-menu>
        </el-menu>
    </el-aside>
</template>

<style lang="scss" scoped>
.el-aside {
    height: 100vh;

    // vh：Viewport Height，视窗高度百分比
    .el-menu {
        height: 100vh;
    }
}
</style>

<script setup>
import {
    HomeFilled,
    Avatar,
    UserFilled,
    MessageBox,
    Reading,
    Pointer,
} from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
const route = useRoute();
</script>