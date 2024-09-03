<template>
    <div>
        <!-- 页头 -->
        <PageHeader content="Developers" />

        <el-card>
            <template #header>
                <div class="card-header">
                    <span>Developers</span>
                </div>
            </template>
            <p>Main Developer: Yuyang Feng.</p>
            <p class="not-first-paragraph">
                Special Thanks: Xiaoyuan Zhang, Leiyuan Tian, Xinting Ji, Xun
                Zhang, Lekun Peng.
            </p>
        </el-card>
    </div>
</template>

<script setup>
import PageHeader from "@/components/mainbox/PageHeader.vue";
</script>

<style lang="scss" scoped>
.el-card {
    margin-top: 50px;
}

.not-first-paragraph{
    margin-top: 20px;
}
</style>
