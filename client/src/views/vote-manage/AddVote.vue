<template>
    <PageHeader content="创建/加入投票" />
    <CreateVote
        v-if="creating"
        @cancel-create="() => (creating = false)"
        @finish-create="() => (creating = false)"
    />

    <JoinVote
        v-else-if="joining"
        @cancel-join="() => (joining = false)"
        @finish-join="() => (joining = false)"
    />

    <div v-else>
        <el-card class="box-card">
            <p>创建一个新投票</p>
            <template #footer>
                <el-button type="primary" @click="startCreate">
                    创建投票
                </el-button>
            </template>
        </el-card>
        <el-card class="box-card">
            <p>加入一个投票</p>
            <template #footer>
                <el-button type="primary" @click="startJoin">
                    加入投票
                </el-button>
            </template>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from "vue";

import PageHeader from "@/components/mainbox/PageHeader.vue";
import CreateVote from "@/components/mainbox/vote-manage/addvote/CreateVote.vue";
import JoinVote from "@/components/mainbox/vote-manage/addvote/JoinVote.vue";
const creating = ref(false);
const joining = ref(false);

const startCreate = () => {
    creating.value = true;
};

const startJoin = () => {
    joining.value = true;
};
</script>

<style lang="scss" scoped>
/*---卡片组件样式设置---*/
.box-card {
    margin-top: 50px;
    max-width: 600px;
}
/*---卡片组件样式设置---*/
</style>
