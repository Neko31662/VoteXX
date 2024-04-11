<template>
    <el-card>
        <template #header>
            <h3>最终统计结束</h3>
        </template>
    </el-card>
</template>

<script setup>
const props = defineProps({
    _id: String,
    voteName: String,
    voteIntro: String,
    regEndTime: Date,
    voteEndTime: Date,
    nulStartTime: Date,
    nulEndTime: Date,
    EACount: Number,
    state: Number,
});
</script>

<style lang="scss" scoped>
/*---元素宽度---*/
.el-card {
    max-width: 700px;
}
/*---元素宽度---*/

/*---卡片尾部右对齐---*/
::v-deep .el-card__footer {
    display: flex;
    justify-content: flex-end;
}
/*---卡片尾部右对齐---*/
</style>
