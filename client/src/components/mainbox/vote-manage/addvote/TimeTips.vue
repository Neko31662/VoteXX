<template>
    <el-tooltip
        placement="right-end"
        effect="light"
        :content="timeTipsHTML[index]"
        raw-content
    >
        <el-icon class="tip-icon">
            <Warning />
        </el-icon>
    </el-tooltip>
</template>

<script setup>
import { ref } from "vue";
import { Warning } from "@element-plus/icons-vue";

defineProps({
    index: Number,
});

const timeTipsContent = [
    "The registration period is open from the time the poll is successfully created to the end of the registration time. All users participating in the vote must register before the registration time ends. After the registration time ends, voting will start within a short time.",
    "All successfully registered users can vote before the voting deadline",
    "During the nullification phase, the voter (or the agent who knows the voter's secret key) can nullify the original vote. Note that if EA has not completed the provisional tally at the nullification start time, the nullification phase will be delayed",
    "After the nullification phase, EA will conduct a final tally and announce the election results upon completion",
];

/**
 * 将提示字符串转化为html格式
 */
const TipsFormater = (tips) => {
    const header = "<span style='font-size:15px;'>";
    const footer = "<span/>";
    const rowLength = 21;
    var result = header;
    for (let i in tips) {
        if (i > 0 && i % rowLength === 0) {
            result += "<br/>";
        }
        result += tips[i];
    }
    return result;
};

const timeTipsHTML = [];
timeTipsContent.forEach((tips, index) => {
    timeTipsHTML[index] = TipsFormater(tips);
});
</script>

<style lang="scss" scoped>
.tip-icon {
    margin-left: 15px;
    cursor: pointer;
}
</style>
