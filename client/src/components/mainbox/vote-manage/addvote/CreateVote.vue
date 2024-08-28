<template>
    <el-row class="create-vote-container">
        <!-- 进度条 -->
        <el-col :span="4" class="steps-container" :offset="1">
            <el-steps
                direction="vertical"
                :active="active"
                finish-status="success"
            >
                <el-step
                    v-for="(message, index) in stepMessages"
                    :key="index"
                    :title="message"
                />
            </el-steps>
        </el-col>

        <el-col :span="16">
            <el-card>
                <!-- 卡片header：当前步骤名称 -->
                <template #header>
                    <h3>
                        {{
                            active !== stepNumber
                                ? stepMessages[active]
                                : "Created successfully"
                        }}
                    </h3>
                </template>

                <!-- 投票各个步骤的表单 -->
                <!-- 第一步 -->
                <el-form
                    v-show="active === 0"
                    ref="createVoteFormRef0"
                    class="create-vote-form"
                    :model="createVoteForm[0]"
                    :rules="createVoteRules[0]"
                    label-width="auto"
                    status-icon
                >
                    <el-form-item label="Election name" prop="voteName">
                        <el-input v-model="createVoteForm[0].voteName" />
                    </el-form-item>

                    <el-form-item
                        label="Election introduction"
                        prop="voteIntro"
                    >
                        <el-input
                            v-model="createVoteForm[0].voteIntro"
                            type="textarea"
                        />
                    </el-form-item>

                    <el-checkbox
                        prop="voteByOwner"
                        v-model="createVoteForm[0].voteByOwner"
                        label="Allow the creater to vote"
                    />
                </el-form>

                <!-- 第二步 -->
                <el-form
                    v-show="active === 1"
                    ref="createVoteFormRef1"
                    class="create-vote-form"
                    :model="createVoteForm[1]"
                    :rules="createVoteRules[1]"
                    label-width="auto"
                    status-icon
                >
                    <el-form-item
                        label="Registration deadline"
                        prop="regEndTime"
                    >
                        <el-date-picker
                            v-model="createVoteForm[1].regEndTime"
                            type="datetime"
                            placeholder="Choose date and time"
                            format="YYYY/MM/DD HH:mm"
                            value-format="YYYY/MM/DD HH:mm"
                        />
                        <!-- 提示 -->
                        <TimeTips :index="0" />
                    </el-form-item>

                    <el-form-item label="Voting deadline" prop="voteEndTime">
                        <el-date-picker
                            v-model="createVoteForm[1].voteEndTime"
                            type="datetime"
                            placeholder="Choose date and time"
                            format="YYYY/MM/DD HH:mm"
                            value-format="YYYY/MM/DD HH:mm"
                        ></el-date-picker>
                        <TimeTips :index="1" />
                    </el-form-item>

                    <el-form-item
                        label="Nullification start time"
                        prop="nulStartTime"
                    >
                        <el-date-picker
                            v-model="createVoteForm[1].nulStartTime"
                            type="datetime"
                            placeholder="Choose date and time"
                            format="YYYY/MM/DD HH:mm"
                            value-format="YYYY/MM/DD HH:mm"
                        ></el-date-picker>
                        <TimeTips :index="2" />
                    </el-form-item>

                    <el-form-item
                        label="Nullification deadline"
                        prop="nulEndTime"
                    >
                        <el-date-picker
                            v-model="createVoteForm[1].nulEndTime"
                            type="datetime"
                            placeholder="Choose date and time"
                            format="YYYY/MM/DD HH:mm"
                            value-format="YYYY/MM/DD HH:mm"
                        ></el-date-picker>
                        <TimeTips :index="3" />
                    </el-form-item>
                </el-form>

                <!-- 第三步 -->
                <el-form
                    v-show="active === 2"
                    ref="createVoteFormRef2"
                    class="create-vote-form"
                    :model="createVoteForm[2]"
                    :rules="createVoteRules[2]"
                    label-width="auto"
                    status-icon
                >
                    <el-form-item label="Confirm trustee number" prop="EACount">
                        <el-input-number
                            v-model.number="createVoteForm[2].EACount"
                            :min="2"
                            :max="5"
                            controls-position="right"
                        />
                    </el-form-item>

                    <el-form-item>
                        <el-text>
                            The greater the number of trustees, the more secure
                            the election will be, but the tally will also take
                            longer.
                            <br />
                            The set of trustees are called EA.
                            <br />
                            Need to ensure that trustees do not collude with
                            each other.
                        </el-text>
                    </el-form-item>
                </el-form>

                <!-- 创建完成 -->
                <el-form
                    v-show="active === stepNumber"
                    label-width="auto"
                    status-icon
                >
                    <el-form-item>
                        <el-text tag="p">
                            The election is created successfully and users can
                            join the election in the
                            <strong>Create/join election</strong>
                            interface:
                            <br />
                        </el-text>
                    </el-form-item>

                    <el-form-item>
                        <el-card shadow="never" class="copy-card">
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

                <!-- 卡片footer：控制进度的按钮 -->
                <template #footer>
                    <div>
                        <el-button
                            v-if="active === 0"
                            @click="$emit('cancelCreate')"
                        >
                            Cancel
                        </el-button>
                        <el-button
                            v-else-if="active !== stepNumber"
                            @click="last"
                        >
                            Back
                        </el-button>

                        <el-button
                            v-if="active < stepNumber - 1"
                            type="primary"
                            @click="next"
                        >
                            Next
                        </el-button>
                        <el-button
                            v-else-if="active === stepNumber - 1"
                            type="primary"
                            @click="submitForm"
                            :disabled="formSubmitting"
                        >
                            Create election
                        </el-button>
                        <el-button
                            v-else
                            type="primary"
                            @click="$emit('finishCreate')"
                        >
                            Finish
                        </el-button>
                    </div>
                </template>
            </el-card>
        </el-col>
    </el-row>
</template>

<script setup>
import { reactive, ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { DocumentCopy } from "@element-plus/icons-vue";
import TimeTips from "@/components/mainbox/vote-manage/addvote/TimeTips.vue";

const active = ref(0); //当前完成的步骤
const stepNumber = 3; //总步数

//创建投票各个步骤的名称
const stepMessages = [
    "Enter election information",
    "Select time",
    "Confirm trustee number",
];

//创建投票后生成的投票凭证
const joinVoteToken = ref("joinVoteToken");

//鼠标悬停在复制投票凭证的按钮上时，显示的提示文字
const joinVoteTokenCopyTipContent = ref("Copy token");

//表单的响应式对象
const createVoteFormRef = [];
const createVoteFormRef0 = ref();
const createVoteFormRef1 = ref();
const createVoteFormRef2 = ref();
createVoteFormRef[0] = createVoteFormRef0;
createVoteFormRef[1] = createVoteFormRef1;
createVoteFormRef[2] = createVoteFormRef2;

//表单的数据绑定
const createVoteForm = [];
createVoteForm[0] = reactive({
    voteName: "",
    voteIntro: "",
    voteByOwner: false,
});

createVoteForm[1] = reactive({
    regEndTime: null,
    voteEndTime: null,
    nulStartTime: null,
    nulEndTime: null,
});

createVoteForm[2] = reactive({
    EACount: 2,
});

//表单的内容校验
const createVoteRules = [];
createVoteRules[0] = reactive({
    voteName: [
        {
            required: true,
            message: "Please enter election name",
            trigger: "blur",
        },
        {
            max: 100,
            message: "Election name should not exceed 100 characters",
            trigger: "blur",
        },
    ],
    voteIntro: [
        {
            required: true,
            message: "Please enter election introduction",
            trigger: "blur",
        },
        {
            max: 500,
            message: "Election introduction should not exceed 500 characters",
            trigger: "blur",
        },
    ],
});

createVoteRules[1] = reactive({
    regEndTime: [
        {
            required: true,
            message: "Please select time",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                let now = new Date();
                return new Date(value) > now;
            },
            message: "Registration deadline should be later than current time",
            trigger: "blur",
        },
    ],
    voteEndTime: [
        {
            required: true,
            message: "Please select time",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return new Date(value) > new Date(createVoteForm[1].regEndTime);
            },
            message:
                "The time of this phase should be later than the previous phase",
            trigger: "blur",
        },
    ],
    nulStartTime: [
        {
            required: true,
            message: "Please select time",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return (
                    new Date(value) > new Date(createVoteForm[1].voteEndTime)
                );
            },
            message:
                "The time of this phase should be later than the previous phase",
            trigger: "blur",
        },
    ],
    nulEndTime: [
        {
            required: true,
            message: "Please select time",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return (
                    new Date(value) > new Date(createVoteForm[1].nulStartTime)
                );
            },
            message:
                "The time of this phase should be later than the previous phase",
            trigger: "blur",
        },
    ],
});

createVoteRules[2] = reactive({
    EACount: [
        {
            required: true,
            message: "Please select correct trustee number",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return value >= 2 && value <= 5;
            },
            message: "Please select correct trustee number",
            trigger: "blur",
        },
    ],
});

/**
 * 校验当前步骤的内容，然后前往下一步
 */
const next = () => {
    const i = active.value;
    createVoteFormRef[i].value.validate((valid) => {
        if (valid) {
            active.value++;
        }
    });
};

/**
 * 前往上一步
 */
const last = () => {
    if (--active.value < 0) active.value = 0;
};

/**
 * 将合法性检验函数封装为Promise对象
 * @param {*} index 第index个表格的合法性检验函数
 */
const validatePromise = (index) => {
    return new Promise((resolve, reject) => {
        createVoteFormRef[index].value.validate((valid) => {
            if (valid) {
                resolve();
            } else {
                reject();
            }
        });
    });
};

const formSubmitting = ref(false); //表单是否正在提交
/**
 * 校验并提交创建新投票的表单，处理返回结果。
 * 创建成功后，同时生成投票凭证，用户可输入此凭证来加入投票
 */
const submitForm = async () => {
    const arr = Array.from({ length: stepNumber }, (_, index) => index);
    const validatePromises = arr.map((i) => validatePromise(i));

    formSubmitting.value = true;
    try {
        await Promise.all(validatePromises);
    } catch (error) {
        ElMessage.error(
            "Please check whether there are any errors in the input items of each step"
        );
        formSubmitting.value = false;
    }

    let params = {};
    for (let i = 0; i < stepNumber; i++) {
        params = Object.assign(params, createVoteForm[i]);
    }
    axios.post("/serverapi/vote/create", params).then((res) => {
        if (res.data.error) {
            ElMessage.error(res.data.error);
        } else if (res.data.ActionType === "ok") {
            ElMessage.success("Election created successfully");
            joinVoteToken.value = btoa(res.data.data.token);
            active.value = stepNumber;
        }
        formSubmitting.value = false;
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
/*---元素宽度---*/
.create-vote-form {
    max-width: 600px;
}

.el-card {
    max-width: 700px;
}
/*---元素宽度---*/

/*---卡片尾部右对齐---*/
::v-deep .el-card__footer {
    display: flex;
    justify-content: flex-end;
}
/*---卡片尾部右对齐---*/

::v-deep .copy-card .el-card__footer {
    max-height: 40px;
}

.create-vote-container {
    margin-top: 50px;
}

/*---进度条高度---*/
.steps-container {
    height: calc(100vh - 200px);
}
/*---进度条高度---*/
</style>
