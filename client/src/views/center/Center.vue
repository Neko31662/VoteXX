<template>
    <div>
        <!-- 页头 -->
        <PageHeader content="个人中心" />

        <el-row :gutter="20" class="top-box">
            <el-col :span="8">111</el-col>
            <el-col :span="16">222</el-col>
        </el-row>
    </div>
</template>

<script setup>
import PageHeader from "@/components/mainbox/PageHeader.vue";
</script>