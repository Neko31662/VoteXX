<template>
    <el-row style="margin-top: 50px">
        <!-- 进度条 -->
        <el-col :span="4">
            <el-steps
                direction="vertical"
                style="height: 75vh"
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
                    <h3
                        v-for="(message, index) in filteredStepMessages"
                        :key="index"
                    >
                        {{ message }}
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
                    <el-form-item label="投票名称" prop="voteName">
                        <el-input v-model="createVoteForm[0].voteName" />
                    </el-form-item>

                    <el-form-item label="投票介绍" prop="voteIntro">
                        <el-input
                            v-model="createVoteForm[0].voteIntro"
                            type="textarea"
                        />
                    </el-form-item>
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
                    <el-form-item label="注册结束时间" prop="regEndTime">
                        <el-date-picker
                            v-model="createVoteForm[1].regEndTime"
                            type="datetime"
                            placeholder="选择日期时间"
                            format="YYYY/MM/DD HH:mm"
                        />
                        <!-- 提示 -->
                        <TimeTips :index="0" />
                    </el-form-item>

                    <el-form-item label="投票结束时间" prop="voteEndTime">
                        <el-date-picker
                            v-model="createVoteForm[1].voteEndTime"
                            type="datetime"
                            placeholder="选择日期时间"
                            format="YYYY/MM/DD HH:mm"
                        ></el-date-picker>
                        <TimeTips :index="1" />
                    </el-form-item>

                    <el-form-item label="弃票开始时间" prop="nulStartTime">
                        <el-date-picker
                            v-model="createVoteForm[1].nulStartTime"
                            type="datetime"
                            placeholder="选择日期时间"
                            format="YYYY/MM/DD HH:mm"
                        ></el-date-picker>
                        <TimeTips :index="2" />
                    </el-form-item>

                    <el-form-item label="弃票结束时间" prop="nulEndTime">
                        <el-date-picker
                            v-model="createVoteForm[1].nulEndTime"
                            type="datetime"
                            placeholder="选择日期时间"
                            format="YYYY/MM/DD HH:mm"
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
                    <el-form-item label="确认EA数量" prop="EACount">
                        <el-input-number
                            v-model.number="createVoteForm[2].EACount"
                            :min="2"
                            :max="5"
                            controls-position="right"
                        />
                    </el-form-item>

                    <el-form-item>
                        <el-text>
                            EA的数量越多，投票越安全，但投票用时也会越长
                            <br />
                            需要确保EA之间不会相互串通
                        </el-text>
                    </el-form-item>
                </el-form>

                <!-- 创建完成 -->
                <el-form
                    v-show="active === stepNumber"
                    class="create-vote-form"
                    label-width="auto"
                    status-icon
                >
                    <el-form-item>
                        <h3>创建投票成功</h3>
                    </el-form-item>
                </el-form>

                <!-- 卡片footer：控制进度的按钮 -->
                <template #footer>
                    <div>
                        <el-button
                            v-if="active === 0"
                            @click="$emit('cancelCreate')"
                        >
                            取消
                        </el-button>
                        <el-button
                            v-else-if="active !== stepNumber"
                            @click="last"
                        >
                            上一步
                        </el-button>

                        <el-button
                            v-if="active < stepNumber - 1"
                            type="primary"
                            @click="next"
                        >
                            下一步
                        </el-button>
                        <el-button
                            v-else-if="active === stepNumber - 1"
                            type="primary"
                            @click="submitForm"
                            :disabled="formSubmitting"
                        >
                            创建投票
                        </el-button>
                        <el-button
                            v-else
                            type="primary"
                            @click="$emit('finishCreate')"
                        >
                            完成
                        </el-button>
                    </div>
                </template>
            </el-card>
        </el-col>
    </el-row>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import TimeTips from "@/components/mainbox/vote-manage/addvote/TimeTips.vue";

const active = ref(0);
const stepNumber = 3;

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
            message: "请输入投票标题",
            trigger: "blur",
        },
        {
            max: 100,
            message: "投票标题请勿超过100字符",
            trigger: "blur",
        },
    ],
    voteIntro: [
        {
            required: true,
            message: "请输入投票介绍",
            trigger: "blur",
        },
        {
            max: 500,
            message: "投票介绍请勿超过100字符",
            trigger: "blur",
        },
    ],
});

createVoteRules[1] = reactive({
    regEndTime: [
        {
            required: true,
            message: "请选择时间",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                let now = new Date();
                return value > now;
            },
            message: "注册结束时间应晚于当前时间",
            trigger: "blur",
        },
    ],
    voteEndTime: [
        {
            required: true,
            message: "请选择时间",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return value > createVoteForm[1].regEndTime;
            },
            message: "该阶段时间应晚于上一阶段时间",
            trigger: "blur",
        },
    ],
    nulStartTime: [
        {
            required: true,
            message: "请选择时间",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return value > createVoteForm[1].voteEndTime;
            },
            message: "该阶段时间应晚于上一阶段时间",
            trigger: "blur",
        },
    ],
    nulEndTime: [
        {
            required: true,
            message: "请选择时间",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return value > createVoteForm[1].nulStartTime;
            },
            message: "该阶段时间应晚于上一阶段时间",
            trigger: "blur",
        },
    ],
});

createVoteRules[2] = reactive({
    EACount: [
        {
            required: true,
            message: "请选择正确的EA数量",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                return value >= 2 && value <= 5;
            },
            message: "请选择正确的EA数量",
            trigger: "blur",
        },
    ],
});

//创建投票各个步骤的名称
const stepMessages = ["填写投票信息", "选择时间", "确认EA数量"];
const filteredStepMessages = computed(() => {
    return stepMessages.filter((message, index) => index === active.value);
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
 * 校验并提交创建新投票的表单，处理返回结果
 */
const submitForm = async () => {
    const arr = Array.from({ length: stepNumber }, (_, index) => index);
    const validatePromises = arr.map((i) => validatePromise(i));

    formSubmitting.value = true;
    try {
        await Promise.all(validatePromises);
    } catch (error) {
        ElMessage.error("请检查各个步骤输入项有无错误");
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
            ElMessage.success("创建投票成功");
            active.value = stepNumber;
        }
        formSubmitting.value = false;
    });
};
</script>

<style lang="scss" scoped>
.create-vote-form {
    max-width: 600px;
}
</style>
