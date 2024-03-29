<template>
    <div class="join-vote-form-container">
        <el-card style="width: 700px">
            <template #header>
                <h3>输入凭证以加入投票</h3>
            </template>

            <el-form
                ref="joinVoteFormRef"
                class="join-vote-form"
                :model="joinVoteForm"
                :rules="joinVoteRules"
                label-width="auto"
                status-icon
            >
                <el-form-item label="凭证" prop="joinVoteToken">
                    <el-input
                        v-model="joinVoteForm.joinVoteToken"
                        type="textarea"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="$emit('cancelJoin')">取消</el-button>
                <el-button
                    type="primary"
                    @click="submitForm"
                    :disabled="formSubmitting"
                >
                    确认
                </el-button>
            </template>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

const emit = defineEmits(["cancelJoin", "finishJoin"]);

const formSubmitting = ref(false);

const joinVoteFormRef = ref();

const joinVoteForm = reactive({
    joinVoteToken: "",
});

const joinVoteRules = reactive({
    joinVoteToken: [
        {
            required: true,
            message: "请输入凭证",
            trigger: "blur",
        },
    ],
});

const submitForm = async () => {
    //禁止在上传时再次点击按钮
    formSubmitting.value = true;
    joinVoteFormRef.value.validate((valid) => {
        if (valid) {
            let params = { joinVoteToken: atob(joinVoteForm.joinVoteToken) };
            axios.post("/serverapi/vote/join", params).then((res) => {
                if (res.data.error) {
                    ElMessage.error(res.data.error);
                } else if (res.data.info) {
                    ElMessage.info(res.data.info);
                } else if (res.data.ActionType === "ok") {
                    ElMessage.success("加入投票成功");
                    emit("finishJoin");
                }
                formSubmitting.value = false;
            });
        } else {
            formSubmitting.value = false;
        }
    });
};
</script>

<style lang="scss" scoped>
.join-vote-form {
    max-width: 600px;
}
.join-vote-form-container {
    margin-top: 50px;
    display: flex;
    justify-content: center;
}

/*---卡片尾部右对齐---*/
::v-deep .el-card__footer {
    display: flex;
    justify-content: flex-end;
}
/*---卡片尾部右对齐---*/
</style>
