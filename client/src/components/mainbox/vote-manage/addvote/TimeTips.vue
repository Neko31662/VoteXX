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
    "创建投票成功至注册时间结束为开放注册时间，所有参与投票的用户须在注册时间结束前注册，注册时间结束后，投票将在短时间内开始",
    "所有成功注册的用户均可在投票结束时间前投票",
    "在弃票阶段中，投票者（或知晓了投票者密钥的代理人）可以废弃原本的投票，注意，若弃票阶段开始后EA仍未完成第一次计票，弃票阶段的启动将被推迟",
    "弃票阶段结束后，EA将进行最终计票，并在完成后公布投票结果",
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
