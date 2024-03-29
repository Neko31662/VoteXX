<template>
    <div>
        <!-- 页头 -->
        <PageHeader content="个人中心" />

        <el-row :gutter="20">
            <el-col :span="8">
                <el-card class="box-card">
                    <el-avatar :size="100" :src="avatarUrl" />
                    <h3>{{ store.state.userInfo.username }}</h3>
                    <h5>{{ getRole(store.state.userInfo.role) }}</h5>
                </el-card>
            </el-col>
            <el-col :span="16">
                <el-card>
                    <!-- 卡片头部 -->
                    <template #header>
                        <div class="card-header">
                            <span>个人信息</span>
                        </div>
                    </template>

                    <UpdateForm />
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import PageHeader from "@/components/mainbox/PageHeader.vue";
import UpdateForm from "@/components/mainbox/center/UpdateForm.vue";

import { useStore } from "vuex";
const store = useStore();
import { computed } from "vue";
import { ServerPublicUrl } from "@/config/config";

/**
 * 获得头像Url，无头像时使用默认头像
 */
const avatarUrl = computed(() =>
    store.state.userInfo.avatar
        ? ServerPublicUrl + store.state.userInfo.avatar
        : "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
);

/**
 * 获取角色名称
 */
const getRole = (role) => {
    switch (role) {
        case 1:
            return "管理员";
        case 2:
            return "用户";
        case 3:
            return "trustee";
        default:
            return "用户权限信息错误";
    }
};
</script>

<style lang="scss" scoped>
.el-row {
    margin-top: 20px;

    .box-card {
        text-align: center;
    }
}
</style>
