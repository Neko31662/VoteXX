<template>
    <el-container>
        <!-- 使用该方式使用导入的组件 -->
        <SideMenu />
        <el-container direction="vertical">
            <TopHeader />
            <router-view></router-view>
        </el-container>
    </el-container>
</template>

<script setup>
import TopHeader from "../components/mainbox/TopHeader.vue";
import SideMenu from "../components/mainbox/SideMenu.vue"
</script>