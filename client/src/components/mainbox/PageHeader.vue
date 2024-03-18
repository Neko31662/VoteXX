<template>
    <el-page-header icon="" title="VoteXX投票系统" @back="goBack">
        <template #content>
            <span> {{ content }} </span>
        </template>
    </el-page-header>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

//声明传入组件的props
defineProps({
    content:String
})

//点击页头后触发该函数回到首页
const goBack = () => {
    router.push("/index");
};
</script>

<style lang="scss" scoped>
.el-page-header {
    margin-top: 15px;
    margin-left: 15px;
}
</style>