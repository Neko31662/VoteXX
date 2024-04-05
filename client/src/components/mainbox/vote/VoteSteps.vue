<template>
    <el-row class="vote-container">
        <!-- 进度条 -->
        <el-col :span="4" class="steps-container" :offset="1">
            <el-steps
                direction="vertical"
                :active="active"
                finish-status="success"
            >
                <el-step
                    v-for="(message, index) in stepMessages"
                    :key="index"
                    :title="message"
                />
            </el-steps>
        </el-col>

        <el-col :span="16">
            <el-card>
                <!-- 卡片header：当前步骤名称 -->
                <template #header>
                    <h3>
                        {{ voteMessages[active] }}
                    </h3>
                </template>
                <div>完善中</div>
            </el-card>
        </el-col>
    </el-row>
</template>

<script setup>
import { ref } from "vue";

const stepMessages = [
    "注册前准备阶段",
    "注册阶段",
    "投票前准备阶段",
    "投票阶段",
    "初步计票阶段",
    "弃票阶段",
    "最终统计阶段",
];

const voteMessages = [
    "请稍等",
    "注册阶段",
    "请稍等",
    "投票阶段",
    "请稍等",
    "弃票阶段",
    "最终统计阶段",
];

const active = ref(0);
</script>

<style lang="scss" scoped>
/*---元素宽度---*/
.vote-form {
    max-width: 600px;
}

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

.vote-container {
    margin-top: 50px;
}

/*---进度条高度---*/
.steps-container {
    height: calc(100vh - 200px);
}
/*---进度条高度---*/
</style>
