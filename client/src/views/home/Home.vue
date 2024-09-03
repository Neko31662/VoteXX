<template>
    <div>
        <!-- 页头 -->
        <PageHeader content="Home page" />

        <!-- 卡片1：头像+欢迎 -->
        <el-card class="box-card">
            <el-row>
                <!-- 24栅格系统 -->
                <el-col :span="4">
                    <!-- 头像 -->
                    <el-avatar :size="100" :src="avatarUrl" />
                </el-col>
                <!-- 欢迎 -->
                <el-col :span="20" style="display: flex; align-items: center">
                    <h3>Welcome back, {{ store.state.userInfo.username }}</h3>
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup>
import { useStore } from "vuex";
const store = useStore();
//计算属性
import { computed } from "vue";
import PageHeader from "@/components/mainbox/PageHeader.vue";
import { ServerPublicUrl } from "@/config/config";

//头像Url，无头像时使用默认头像
const avatarUrl = computed(() =>
    store.state.userInfo.avatar
        ? ServerPublicUrl + store.state.userInfo.avatar
        : "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
);

</script>

<style lang="scss" scoped>
/*---卡片组件样式设置---*/
.box-card {
    margin-top: 50px;
}
/*---卡片组件样式设置---*/
</style>
