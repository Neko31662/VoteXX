<template>
    <el-aside width="auto">
        <el-menu
            :collapse="$store.state.isCollapsed"
            :router="true"
            :default-active="route.fullPath"
        >
            <el-menu-item index="/index">
                <!-- 使用图标的方式：el-icon里套图标名称
                需要在"@element-plus/icons-vue"中引入图标名 -->
                <el-icon>
                    <HomeFilled />
                </el-icon>
                <span>Home page</span>
            </el-menu-item>

            <el-menu-item index="/center">
                <el-icon>
                    <Avatar />
                </el-icon>
                <span>Personal center</span>
            </el-menu-item>

            <el-sub-menu index="/user-manage">
                <template #title>
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    <span>Test path</span>
                </template>
                <el-menu-item index="/user-manage/adduser">
                    Test path 1
                </el-menu-item>
                <el-menu-item index="/user-manage/userlist">
                    Test path 2
                </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="/vote-manage">
                <template #title>
                    <el-icon>
                        <MessageBox />
                    </el-icon>
                    <span>Election management</span>
                </template>
                <el-menu-item index="/vote-manage/addvote">
                    Create/join election
                </el-menu-item>
                <el-menu-item index="/vote-manage/votelist">
                    Participated elections
                </el-menu-item>
                <el-menu-item index="/vote-manage/myvote">
                    Created elections
                </el-menu-item>
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
