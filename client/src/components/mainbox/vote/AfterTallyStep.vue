<template>
    <el-card>
        <template #header>
            <h3>End of final tally</h3>
        </template>
        <el-text tag="p" line-clamp="10000">
            <h2>Election results</h2>
        </el-text>
        <!-- <template #default> -->
        <el-table :data="tableData" border stripe style="width: 80%">
            <el-table-column prop="vote_type" label="Vote type" />
            <el-table-column prop="pro_num" label="Provisional tally" />
            <el-table-column prop="nul_num" label="Nullification number" />
            <el-table-column prop="fin_num" label="Final result" />
        </el-table>
        <!-- </template> -->
        <!-- <el-skeleton :loading="loading" animated>
            <template #template>
                <el-skeleton :rows="3" animated />
            </template>
        </el-skeleton> -->
        <template #footer>
            <el-button @click="router.push('/vote-manage/votelist')">
                Exit
            </el-button>
        </template>
    </el-card>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

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
    results: {
        nullified_yes: Number,
        nullified_no: Number,
        nr_yes: Number,
        nr_no: Number,
    },
});

const tableData = [
    {
        vote_type: "Yes vote",
        pro_num: props.results.nr_yes,
        nul_num: props.results.nullified_yes,
        fin_num: props.results.nr_yes - props.results.nullified_yes,
    },
    {
        vote_type: "No vote",
        pro_num: props.results.nr_no,
        nul_num: props.results.nullified_no,
        fin_num: props.results.nr_no - props.results.nullified_no,
    },
];
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
