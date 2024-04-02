<template>
    <el-skeleton :loading="loading" animated>
        <template #template>
            <el-skeleton :rows="5" animated />
        </template>

        <template #default>
            <VoteSteps />
        </template>
    </el-skeleton>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
import axios from "axios";
import { ElMessage } from "element-plus";
import VoteSteps from "@/components/mainbox/vote/VoteSteps.vue";

const loading = ref(true);

onMounted(() => {
    axios
        .get("/serverapi/vote/get-vote-details", {
            params: {
                _id: route.query._id,
            },
        })
        .then((res) => {
            if (res.data.error) {
                ElMessage.error(res.data.error);
                router.push("/vote-manage/votelist");
            } else {
                loading.value = false;
            }
        })
        .catch(() => {
            router.push("/vote-manage/votelist");
        });
});
</script>

<style lang="scss" scoped></style>
