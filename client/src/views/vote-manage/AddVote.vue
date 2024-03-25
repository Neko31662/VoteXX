<template>
    <PageHeader content="创建投票" />
    <CreateVote
        v-if="creating"
        @cancel-create="() => (creating = false)"
        @finish-create="() => (creating = false)"
    />

    <div v-else>
        <el-card class="box-card" style="max-width: 600px">
            <p>点击按钮创建一个新投票</p>
            <template #footer>
                <el-button type="primary" @click="startCreate">
                    创建投票
                </el-button>
            </template>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from "vue";

import PageHeader from "@/components/mainbox/PageHeader.vue";
import CreateVote from "@/components/mainbox/vote-manage/addvote/CreateVote.vue";
const creating = ref(false);

const startCreate = () => {
    creating.value = true;
};
</script>

<style lang="scss" scoped>
/*---卡片组件样式设置---*/
.box-card {
    margin-top: 50px;
}
/*---卡片组件样式设置---*/
</style>
