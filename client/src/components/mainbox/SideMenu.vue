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
                <span>首页</span>
            </el-menu-item>

            <el-menu-item index="/center">
                <el-icon>
                    <Avatar />
                </el-icon>
                <span>个人中心</span>
            </el-menu-item>

            <!-- <el-sub-menu index="/user-manage">
                <template #title>
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    <span>测试路径</span>
                </template>
                <el-menu-item index="/user-manage/adduser">
                    测试路径1
                </el-menu-item>
                <el-menu-item index="/user-manage/userlist">
                    测试路径2
                </el-menu-item>
            </el-sub-menu> -->

            <el-sub-menu index="/vote-manage">
                <template #title>
                    <el-icon>
                        <MessageBox />
                    </el-icon>
                    <span>投票管理</span>
                </template>
                <el-menu-item index="/vote-manage/addvote">
                    创建/加入投票
                </el-menu-item>
                <el-menu-item index="/vote-manage/votelist">
                    参加中的投票
                </el-menu-item>
                <el-menu-item index="/vote-manage/myvote">
                    我创建的投票
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
