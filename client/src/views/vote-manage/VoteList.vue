<template>
    <PageHeader content="Participated elections" />

    <el-row
        v-for="i in 5"
        justify="center"
        :gutter="40"
        class="joined-vote-card-container"
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
                    <JoinedVoteCard
                        v-if="joinedVoteCardArray[i * 2 + j - 3]"
                        v-bind="joinedVoteCardArray[i * 2 + j - 3]"
                    />
                </template>
            </el-skeleton>
        </el-col>
    </el-row>

    <el-row class="joined-vote-card-container">
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
import JoinedVoteCard from "@/components/mainbox/vote-manage/votelist/JoinededVoteCard.vue";

const totalVotes = ref(0);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);
const joinedVoteCardArray = [];

//刚进入页面时，统计符合条件的投票数量
axios
    .get("/serverapi/vote/count-joined-vote")
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
        .get("/serverapi/vote/show-joined-vote", {
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
                    joinedVoteCardArray[i] = res.data.data.responseData[i];
                    if (joinedVoteCardArray[i]) {
                        joinedVoteCardArray[i].regEndTime = new Date(
                            joinedVoteCardArray[i].regEndTime
                        );
                        joinedVoteCardArray[i].voteEndTime = new Date(
                            joinedVoteCardArray[i].voteEndTime
                        );
                        joinedVoteCardArray[i].nulStartTime = new Date(
                            joinedVoteCardArray[i].nulStartTime
                        );
                        joinedVoteCardArray[i].nulEndTime = new Date(
                            joinedVoteCardArray[i].nulEndTime
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
</script>

<style lang="scss" scoped>
.joined-vote-card-container {
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
