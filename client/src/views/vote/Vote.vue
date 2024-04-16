<template>
    <el-skeleton :loading="loading" animated>
        <template #template>
            <el-skeleton :rows="5" animated />
        </template>

        <template #default>
            <VoteSteps :voteInfo="voteInfo" />
        </template>
    </el-skeleton>
</template>

<script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
import axios from "axios";
import { ElMessage } from "element-plus";
import VoteSteps from "@/components/mainbox/vote/VoteSteps.vue";

const loading = ref(true);
let voteInfo = {};

onBeforeMount(() => {
    axios
        .get("/serverapi/vote/get-vote-details", {
            params: {
                _id: route.query._id,
            },
        })
        .then((res) => {
            if (res.data.ActionType !== "ok") {
                ElMessage.error(res.data.error);
                router.push("/vote-manage/votelist");
            } else {
                voteInfo = res.data.data;
                voteInfo.regEndTime = new Date(voteInfo.regEndTime);
                voteInfo.voteEndTime = new Date(voteInfo.voteEndTime);
                voteInfo.nulStartTime = new Date(voteInfo.nulStartTime);
                voteInfo.nulEndTime = new Date(voteInfo.nulEndTime);
                loading.value = false;
            }
        })
        .catch(() => {
            router.push("/vote-manage/votelist");
        });
});
</script>

<style lang="scss" scoped></style>
