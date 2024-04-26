<template>
    <el-page-header icon="" title="Return to home page" @back="goBack">
        <template #content>
            <span>{{ content }}</span>
        </template>
    </el-page-header>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

//声明传入组件的props
defineProps({
    content: String,
});

//点击页头后触发该函数回到首页
const goBack = () => {
    router.push("/index");
};
</script>

<style lang="scss" scoped></style>
