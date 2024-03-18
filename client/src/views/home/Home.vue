<template>
    <div>
        <!-- 页头 -->
        <PageHeader content="首页"/>

        <!-- 卡片1：头像+欢迎 -->
        <el-card class="box-card">
            <el-row>
                <!-- 头像 -->
                <el-col :span="4"> <!-- 24栅格系统 -->
                    <el-avatar :size="100" :src="avatarUrl" />
                </el-col>
                <!-- 欢迎 -->
                <el-col :span="20" style="display: flex;align-items:center;">
                    <h3>欢迎回来，{{ store.state.userInfo.username }}，{{ welcomeText }}</h3>
                </el-col>
            </el-row>
        </el-card>

        <!-- 卡片2：产品轮播 -->
        <el-card class="box-card">

            <!-- 卡片头 -->
            <template #header>
                <div class="card-header">
                    <span>公司产品</span>
                </div>
            </template>

            <!-- 走马灯 -->
            <el-carousel :interval="4000" type="card" height="200px">
                <el-carousel-item v-for="item in 6" :key="item">
                    <h3 text="2xl" justify="center">{{ item }}</h3>
                </el-carousel-item>
            </el-carousel>
        </el-card>
    </div>
</template>

<script setup>
import { useStore } from 'vuex';
const store = useStore();
//计算属性
import { computed } from 'vue';
import PageHeader from "@/components/mainbox/PageHeader.vue";

//头像Url，无头像时使用默认头像
const avatarUrl = computed(() => store.state.userInfo.avatar
    ? store.state.userInfo.avatar
    : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');

//根据时间计算提示词
const welcomeText = computed(() => new Date().getHours() < 12
    ? "要开心每一天"
    : "喝杯咖啡提提神吧");
</script>

<style lang="scss" scoped>

/*---卡片组件样式设置---*/
.box-card {
    margin-top: 50px;
}
/*---卡片组件样式设置---*/

/*---走马灯组件样式设置---*/
.el-carousel__item h3 {
    color: #475669;
    opacity: 0.75;
    line-height: 200px;
    margin: 0;
    text-align: center;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
}

/*---carousel走马灯组件样式设置---*/
</style>