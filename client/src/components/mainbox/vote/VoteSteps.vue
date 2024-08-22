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
            <!-- active值为0,2,4,6时显示 -->
            <div v-if="active % 2 === 0">
                <el-card>
                    <template #header>
                        <h3>Please wait</h3>
                    </template>
                    <el-empty description=" ">
                        <el-text>Trustees are organizing information, please wait.</el-text>
                    </el-empty>
                    <template #footer>
                        <el-button
                            @click="router.push('/vote-manage/votelist')"
                        >
                            Exit
                        </el-button>
                    </template>
                </el-card>
            </div>

            <!-- active值为1时显示 -->
            <div v-else-if="active === 1">
                <RegistrationStep v-bind="voteInfo" />
            </div>

            <!-- active值为3时显示 -->
            <div v-else-if="active === 3">
                <VotingStep v-bind="voteInfo" />
            </div>

            <!-- active值为5时显示 -->
            <div v-else-if="active === 5">
                <NullificationStep v-bind="voteInfo" />
            </div>

            <!-- active值为7时显示 -->
            <div v-else>
                <AfterTallyStep v-bind="voteInfo" />
            </div>
        </el-col>
    </el-row>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
import RegistrationStep from "./RegistrationStep.vue";
import VotingStep from "./VotingStep.vue";
import NullificationStep from "./NullificationStep.vue";
import AfterTallyStep from "./AfterTallyStep.vue";

const props = defineProps({
    voteInfo: Object,
});

const active = ref(0);
active.value = props.voteInfo.state;

const stepMessages = [
    "Pre-registration phase",
    "Registration phase",
    "Registration finalization phase",
    "Voting phase",
    "Provisional tally phase",
    "Nullification phase",
    "Final tally phase",
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

.vote-container {
    margin-top: 50px;
}

/*---进度条高度---*/
.steps-container {
    height: calc(100vh - 200px);
}
/*---进度条高度---*/
</style>
