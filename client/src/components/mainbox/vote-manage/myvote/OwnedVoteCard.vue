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
            <el-button
                type="primary"
                @click="getVoteToken"
                :disabled="gettingVoteToken"
            >
                Generate token
            </el-button>
            <!-- <el-button type="danger" @click="deleteVisible = true">
                删除投票
            </el-button> -->
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
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ voteName }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Election introduction">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ voteIntro }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Registration deadline">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ dateToString(regEndTime) }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Voting deadline">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ dateToString(voteEndTime) }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Nullification time">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{
                            dateToString(nulStartTime) +
                            " - " +
                            dateToString(nulEndTime)
                        }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Trustee number">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ EACount }}
                    </el-text>
                </el-form-item>
                <el-form-item label="Allow the creater to vote">
                    <el-text tag="p" line-clamp="10000" class="dialogs">
                        {{ voteByOwner ? "Allow" : "Not allow" }}
                    </el-text>
                </el-form-item>
            </el-form>
        </el-scrollbar>
    </el-dialog>

    <el-dialog v-model="tokenVisible" width="500px">
        <el-form>
            <el-form-item>
                <el-text tag="p">
                    The election token is successfully obtained and users can join the election in the
                    <strong>Create/join election</strong>
                    interface:
                    <br />
                </el-text>
            </el-form-item>

            <el-form-item>
                <el-card
                    shadow="never"
                    class="copy-card"
                    style="margin-top: 0px"
                >
                    <p style="word-break: break-all">
                        {{ joinVoteToken }}
                    </p>

                    <template #footer>
                        <!-- 复制按钮 -->
                        <el-tooltip
                            :content="joinVoteTokenCopyTipContent"
                            placement="bottom"
                        >
                            <el-button
                                :icon="DocumentCopy"
                                link
                                @click="copyToken"
                            />
                        </el-tooltip>
                    </template>
                </el-card>
            </el-form-item>
        </el-form>
    </el-dialog>

    <!-- 用于询问是否删除 -->
    <el-dialog v-model="deleteVisible" width="500px">
        <template #header>
            <el-text type="danger"><h3>You are nullifying a vote</h3></el-text>
        </template>
        <el-text tag="p">Nullification is irrevocable, please consider carefully</el-text>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="deleteVisible = false">Cancel</el-button>
                <el-button type="danger" @click="deleteVote">
                    Confirm nullification
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { DocumentCopy } from "@element-plus/icons-vue";
import axios from "axios";

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
const deleteVisible = ref(false);
const tokenVisible = ref(false);
const gettingVoteToken = ref(false);
const joinVoteToken = ref("joinVoteToken");

//鼠标悬停在复制投票凭证的按钮上时，显示的提示文字
const joinVoteTokenCopyTipContent = ref("Copy token");

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

/**
 * 删除投票，还未实现
 */
const deleteVote = () => {
    deleteVisible.value = false;
    ElMessage.info("This part of the function is not yet complete");
};

/**
 * 获取一个可加入投票的凭证
 */
const getVoteToken = () => {
    gettingVoteToken.value = true;
    axios
        .get("/serverapi/vote/get-vote-token", {
            params: {
                _id: props._id,
            },
        })
        .then((res) => {
            joinVoteToken.value = btoa(res.data.data.token);
            tokenVisible.value = true;
            gettingVoteToken.value = false;
        })
        .catch((err) => {
            tokenVisible.value = true;
            gettingVoteToken.value = false;
        });
};

/**
 * 点击复制键复制凭证
 */
const copyToken = () => {
    navigator.clipboard.writeText(joinVoteToken.value).then(() => {
        joinVoteTokenCopyTipContent.value = "Copied to clipboard";
        setTimeout(() => {
            joinVoteTokenCopyTipContent.value = "Copy token";
        }, 2000);
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

::v-deep .copy-card .el-card__footer {
    max-height: 40px;
}

/*---投票详细信息的样式---*/
.dialog-form {
    margin-right: 25px;
}

.dialogs {
    font-size: 18px;
}
/*---投票详细信息的样式---*/
</style>
