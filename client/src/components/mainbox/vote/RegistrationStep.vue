<template>
    <el-card>
        <template #header>
            <h3>注册阶段</h3>
        </template>
        <el-form
            label-width="auto"
            label-position="left"
            ref="registrationFormRef"
            :model="registrationForm"
            status-icon
            :rules="registrationRules"
        >
            <el-form-item label="注册截止时间">
                <el-text tag="p" line-clamp="10000">
                    {{ dateToString(regEndTime) }}
                </el-text>
            </el-form-item>

            <!-- 选择投票密钥 -->
            <el-card shadow="never" v-if="!confirmKey" class="copy-card">
                <template #header>
                    <el-text tag="p" line-clamp="10000">
                        <b>选择一组投票密钥</b>
                    </el-text>
                </template>
                <el-form label-width="auto">
                    <el-form-item label="赞成票密钥">
                        <el-text tag="p" line-clamp="10000">
                            {{ sk_yes_string }}
                        </el-text>
                    </el-form-item>
                    <el-form-item label="反对票密钥">
                        <el-text tag="p" line-clamp="10000">
                            {{ sk_no_string }}
                        </el-text>
                    </el-form-item>
                </el-form>

                <template #footer>
                    <!-- 刷新按钮 -->
                    <el-tooltip content="换一组" placement="bottom">
                        <el-button :icon="Refresh" link @click="generateKeys" />
                    </el-tooltip>

                    <!-- 复制按钮 -->
                    <el-tooltip
                        :content="privateKeyCopyTipContent"
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

            <!-- 确认投票密钥 -->
            <div v-if="confirmKey">
                <el-form-item>
                    <el-text tag="p" line-clamp="10000">
                        投票密钥对于投票十分重要，且
                        <b>不可通过任何方式找回</b>
                        ，请妥善保管您的投票密钥
                    </el-text>
                </el-form-item>
                <el-form-item>
                    <el-text tag="p" line-clamp="10000">
                        <h3>确认您的投票密钥以继续</h3>
                    </el-text>
                </el-form-item>
                <el-form-item
                    label="请输入赞成票密钥"
                    prop="sk_yes_stringVerify"
                >
                    <el-input
                        v-model="registrationForm.sk_yes_stringVerify"
                        autocomplete="off"
                    />
                </el-form-item>
                <el-form-item
                    label="请输入反对票密钥"
                    prop="sk_no_stringVerify"
                >
                    <el-input
                        v-model="registrationForm.sk_no_stringVerify"
                        autocomplete="off"
                    />
                </el-form-item>
            </div>
        </el-form>
        <template #footer>
            <el-button
                type="primary"
                v-if="!confirmKey"
                @click="confirmKey = !confirmKey"
            >
                下一步
            </el-button>

            <el-button v-if="confirmKey" @click="confirmKey = !confirmKey">
                返回
            </el-button>

            <el-button type="primary" v-if="confirmKey" @click="submitForm()">
                注册
            </el-button>
        </template>
    </el-card>
</template>

<script setup>
import { onBeforeMount, ref, reactive } from "vue";
import { DocumentCopy, Refresh } from "@element-plus/icons-vue";
import axios from "axios";
import { useRoute } from "vue-router";
const route = useRoute();

import elliptic from "elliptic";
const EC = elliptic.ec;
const ec = new EC("secp256k1");

const props = defineProps({
    _id: String,
    voteName: String,
    voteIntro: String,
    regEndTime: Date,
    voteEndTime: Date,
    nulStartTime: Date,
    nulEndTime: Date,
    EACount: Number,
    state: Number,
});

//是否确认投票密钥
const confirmKey = ref(false);

//密钥中私钥字符串的引用对象
const sk_yes_string = ref("");
const sk_no_string = ref("");
let pk_yes = "";
let pk_no = "";
/**
 * 生成投票密钥
 */
const generateKeys = () => {
    // 生成两组密钥对
    const yes_keyPair = ec.genKeyPair();
    sk_yes_string.value = yes_keyPair.getPrivate().toString(16);
    pk_yes = yes_keyPair.getPublic().encode("hex");

    const no_keyPair = ec.genKeyPair();
    sk_no_string.value = no_keyPair.getPrivate().toString(16);
    pk_no = no_keyPair.getPublic().encode("hex");
};

//表单的引用对象
const registrationFormRef = ref();

//表单绑定的响应式对象
const registrationForm = reactive({
    sk_yes_stringVerify: "",
    sk_no_stringVerify: "",
});

//表单的校验规则
const registrationRules = reactive({
    sk_yes_stringVerify: [
        {
            validator: (rule, value) => {
                return value === sk_yes_string.value;
            },
            message: "赞成票密钥输入错误",
            trigger: "blur",
        },
    ],
    sk_no_stringVerify: [
        {
            validator: (rule, value) => {
                return value === sk_no_string.value;
            },
            message: "反对票密钥输入错误",
            trigger: "blur",
        },
    ],
});

/**
 * 上传公钥
 */
const submitForm = () => {
    registrationFormRef.value.validate((valid) => {
        //通过校验
        if (valid) {
            axios
                .post("/serverapi/vote/registration-step", {
                    pk_yes,
                    pk_no,
                    voteID: route.query._id,
                })
                .then((res) => {})
                .catch((err) => {});
        } else {
        }
    });
};

//鼠标悬停在复制投票凭证的按钮上时，显示的提示文字
const privateKeyCopyTipContent = ref("复制密钥");

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
 * 点击复制键复制凭证
 */
const copyToken = () => {
    const str =
        "赞成票密钥：" +
        sk_yes_string.value +
        "\n" +
        "反对票密钥：" +
        sk_no_string.value;

    navigator.clipboard.writeText(str).then(() => {
        privateKeyCopyTipContent.value = "已复制到剪贴板";
        setTimeout(() => {
            privateKeyCopyTipContent.value = "复制密钥";
        }, 2000);
    });
};

//首先生成一次密钥
onBeforeMount(() => {
    generateKeys();
});
</script>

<style lang="scss" scoped>
/*---元素宽度---*/
.el-form {
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
</style>
