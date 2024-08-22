<template>
    <PageHeader content="Elections created by me" />

    <el-row
        v-for="i in 5"
        justify="center"
        :gutter="40"
        class="owned-vote-card-container"
    >
        <el-col v-for="j in 2" :span="12">
            <el-skeleton
                :rows="5"
                animated
                :loading="loading"
                :throttle="500"
                style="margin-top: 40px; height: 370px"
            >
                <template #default>
                    <OwnedVoteCard
                        v-if="ownedVoteCardArray[i * 2 + j - 3]"
                        v-bind="ownedVoteCardArray[i * 2 + j - 3]"
                    />
                </template>
            </el-skeleton>
        </el-col>
    </el-row>

    <el-row class="owned-vote-card-container">
        <el-col :span="22" style="display: flex">
            <el-pagination
                background
                hide-on-single-page
                layout="prev, pager, next"
                :total="totalVotes"
                :current-page="currentPage"
                @update:current-page="changePage"
                :page-size="pageSize"
            />
        </el-col>
    </el-row>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import PageHeader from "@/components/mainbox/PageHeader.vue";
import OwnedVoteCard from "@/components/mainbox/vote-manage/myvote/OwnedVoteCard.vue";

const totalVotes = ref(0);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);
const ownedVoteCardArray = [];

//刚进入页面时，统计符合条件的投票数量
axios
    .get("/serverapi/vote/count-owned-vote")
    .then((res) => {
        if (res.data.error) {
            ElMessage.error(res.data.error);
        } else {
            totalVotes.value = res.data.data.totalVotes;
            changePage(currentPage.value);
        }
    })
    .catch((err) => {
        console.log(err);
    });

/**
 * 页面更新时，执行该函数，在该函数内处理相关逻辑并最终更新当前页码
 * @param {number} newPage
 */
const changePage = (newPage) => {
    loading.value = true;
    axios
        .get("/serverapi/vote/show-owned-vote", {
            params: {
                page: `${newPage}`,
                size: `${pageSize.value}`,
            },
        })
        .then((res) => {
            if (res.data.error) {
                ElMessage.error(res.data.error);
            } else {
                for (let i = 0; i < pageSize.value; i++) {
                    ownedVoteCardArray[i] = res.data.data.responseData[i];
                    if (ownedVoteCardArray[i]) {
                        ownedVoteCardArray[i].regEndTime = new Date(
                            ownedVoteCardArray[i].regEndTime
                        );
                        ownedVoteCardArray[i].voteEndTime = new Date(
                            ownedVoteCardArray[i].voteEndTime
                        );
                        ownedVoteCardArray[i].nulStartTime = new Date(
                            ownedVoteCardArray[i].nulStartTime
                        );
                        ownedVoteCardArray[i].nulEndTime = new Date(
                            ownedVoteCardArray[i].nulEndTime
                        );
                    }
                }
                currentPage.value = newPage;
            }
            loading.value = false;
        })
        .catch((err) => {
            console.log(err);
            loading.value = false;
        });
};

/*---测试用---*/
const testObj = {
    voteName: "String",
    voteIntro: "StringString",
    regEndTime: new Date(),
    voteEndTime: new Date(),
    nulStartTime: new Date(),
    nulEndTime: new Date(),
    EACount: 4,
    _id: "String",
};
const arr = [];
for (let i = 0; i <= 9; i++) {
    arr[i] = Object.assign({}, testObj);
    arr[i].voteName += `${i}`;
}
/*---测试用---*/
</script>

<style lang="scss" scoped>
.owned-vote-card-container {
    padding-right: 30px;
    padding-left: 10px;
}
.el-pagination {
    margin-top: 40px;
    margin-bottom: 20px;
    margin-left: auto;
    margin-right: auto;
}
</style>
