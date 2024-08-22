<template>
    <el-card shadow="hover">
        <template #header>
            <h3>{{ voteName }}</h3>
        </template>
        <el-form label-width="auto">
            <el-form-item label="Election introduction">
                <el-text tag="p" line-clamp="1">
                    {{ voteIntro }}
                </el-text>
            </el-form-item>
            <el-form-item label="Registration deadline">
                {{ dateToString(regEndTime) }}
            </el-form-item>
            <el-form-item label="Voting deadline">
                {{ dateToString(voteEndTime) }}
            </el-form-item>
            <el-form-item label="Nullification time">
                {{
                    dateToString(nulStartTime) +
                    " - " +
                    dateToString(nulEndTime)
                }}
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = true">Details</el-button>
            <el-button type="primary" @click="toVote" :disabled="goingToVote">
                Enter election
            </el-button>
        </template>
    </el-card>

    <!-- 展示投票详细信息 -->
    <el-dialog v-model="dialogVisible" width="700px">
        <template #header>
            <el-text><h2>Election details</h2></el-text>
        </template>
        <el-scrollbar max-height="500px">
            <el-form label-width="auto" class="dialog-form">
                <el-form-item label="Election name">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{ voteName }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Election introduction">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{ voteIntro }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Registration deadline">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{ dateToString(regEndTime) }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Voting deadline">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{ dateToString(voteEndTime) }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Nullification time">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{
                            dateToString(nulStartTime) +
                            " - " +
                            dateToString(nulEndTime)
                        }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Trustee number">
                    <el-text tag="p" line-clamp="100" class="dialogs">
                        {{ EACount }}
                    </el-text>
                </el-form-item>
                <el-form-item label="是否允许创建者投票">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ voteByOwner ? "允许" : "不允许" }}
                    </el-text>
                </el-form-item>
            </el-form>
        </el-scrollbar>
    </el-dialog>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { DocumentCopy } from "@element-plus/icons-vue";
import axios from "axios";
import { useRouter } from "vue-router";
const router = useRouter();

const props = defineProps({
    voteName: String,
    voteIntro: String,
    regEndTime: Date,
    voteEndTime: Date,
    nulStartTime: Date,
    nulEndTime: Date,
    EACount: Number,
    _id: String,
    voteByOwner: Boolean,
});

const dialogVisible = ref(false);
const goingToVote = ref(false);

//日期转换为字符串的格式
const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
};

/**
 * 将日期转换为字符串
 * @param {Date} date
 */
const dateToString = (date) => {
    return date.toLocaleString(date, options);
};

const toVote = () => {
    goingToVote.value = true;
    router.push({
        path: "/vote",
        query: {
            _id: props._id,
        },
    });
};
</script>

<style lang="scss" scoped>
.el-card {
    margin-top: 40px;
}

/*---卡片尾部右对齐---*/
::v-deep .el-card__footer {
    display: flex;
    justify-content: flex-end;
}
/*---卡片尾部右对齐---*/

/*---投票详细信息的样式---*/
.dialog-form {
    margin-right: 25px;
}

.dialogs {
    font-size: 18px;
}
/*---投票详细信息的样式---*/
</style>
