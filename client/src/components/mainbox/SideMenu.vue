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

            <el-menu-item index="/developers">
                <el-icon>
                    <Warning />
                </el-icon>
                <span>Developers</span>
            </el-menu-item>
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
    Warning
} from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
const route = useRoute();
</script>
