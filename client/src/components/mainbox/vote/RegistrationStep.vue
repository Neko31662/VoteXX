<template>
    <el-card>
        <template #header>
            <h3>Registration phase</h3>
        </template>
        <el-form
            label-width="auto"
            label-position="left"
            ref="registrationFormRef"
            :model="registrationForm"
            status-icon
            :rules="registrationRules"
        >
            <el-form-item label="Registration deadline">
                <el-text tag="p" line-clamp="10000">
                    {{ dateToString(regEndTime) }}
                </el-text>
            </el-form-item>

            <!-- 选择投票密钥 -->
            <el-card shadow="never" v-if="!confirmKey" class="copy-card">
                <template #header>
                    <el-text tag="p" line-clamp="10000">
                        <b>Choose a set of voting keys</b>
                    </el-text>
                </template>
                <el-form label-width="auto">
                    <el-form-item label="sk_yes">
                        <el-text tag="p" line-clamp="10000">
                            {{ sk_yes_string }}
                        </el-text>
                    </el-form-item>
                    <el-form-item label="sk_no">
                        <el-text tag="p" line-clamp="10000">
                            {{ sk_no_string }}
                        </el-text>
                    </el-form-item>
                </el-form>

                <template #footer>
                    <!-- 刷新按钮 -->
                    <el-tooltip content="Refresh" placement="bottom">
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
                        Voting secret keys are very important, and
                        <b>cannot be retrieved by any means</b>
                        , please keep your voting secret keys safe.
                    </el-text>
                </el-form-item>
                <el-form-item>
                    <el-text tag="p" line-clamp="10000">
                        <h3>Confirm your voting key to continue</h3>
                    </el-text>
                </el-form-item>
                <el-form-item
                    label="Please enter sk_yes"
                    prop="sk_yes_stringVerify"
                >
                    <el-input
                        v-model="registrationForm.sk_yes_stringVerify"
                        autocomplete="off"
                    />
                </el-form-item>
                <el-form-item
                    label="Please enter sk_no"
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
            <el-button @click="router.push('/vote-manage/votelist')">
                Exit
            </el-button>
            <el-button
                type="primary"
                v-if="!confirmKey"
                @click="confirmKey = !confirmKey"
            >
                Next
            </el-button>

            <el-button v-if="confirmKey" @click="confirmKey = !confirmKey">
                Back
            </el-button>

            <el-button type="primary" v-if="confirmKey" @click="submitForm()">
                Register
            </el-button>
        </template>
    </el-card>
</template>

<script setup>
import { onBeforeMount, ref, reactive } from "vue";
import { DocumentCopy, Refresh } from "@element-plus/icons-vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
import { ElMessage } from "element-plus";

import elliptic from "elliptic";
const EC = elliptic.ec;
const ec = new EC("secp256k1");
const ElgamalPublicKey =
    require("@/../../crypt/primitiv/encryption/ElgamalEncryption").ElgamalPublicKey;
import { serialize, deserialize } from "@/../../crypt/util/CryptoSerializer";

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
let pk_yes = null;
let pk_no = null;
/**
 * 生成投票密钥
 */
const generateKeys = () => {
    // 生成两组密钥对
    const yes_keyPair = ec.genKeyPair();
    sk_yes_string.value = yes_keyPair.getPrivate().toString(16);
    pk_yes = yes_keyPair.getPublic();

    const no_keyPair = ec.genKeyPair();
    sk_no_string.value = no_keyPair.getPrivate().toString(16);
    pk_no = no_keyPair.getPublic();
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
            message: "sk_yes entered incorrectly",
            trigger: "blur",
        },
    ],
    sk_no_stringVerify: [
        {
            validator: (rule, value) => {
                return value === sk_no_string.value;
            },
            message: "sk_no entered incorrectly",
            trigger: "blur",
        },
    ],
});

/**
 * 上传公钥
 */
const submitForm = () => {
    registrationFormRef.value.validate(async (valid) => {
        //通过校验
        if (valid) {
            let pk_serialized = null;
            try {
                let res = await axios.get("/serverapi/vote-private/get-pk", {
                    params: {
                        _id: route.query._id,
                    },
                });
                if (res.data.ActionType === "ok") {
                    pk_serialized = res.data.data;
                } else {
                    ElMessage.error(res.data.error);
                    return;
                }
            } catch (err) {
                ElMessage.error("Failed to get public key");
                return;
            }
            let pk = new ElgamalPublicKey(ec, deserialize(pk_serialized, ec));
            let enc_pk_yes = pk.encrypt(pk_yes);
            let enc_pk_no = pk.encrypt(pk_no);
            let enc_pk_yes_serialized = serialize(enc_pk_yes);
            let enc_pk_no_serialized = serialize(enc_pk_no);

            axios
                .post("/serverapi/vote/registration-step", {
                    voteID: route.query._id,
                    enc_pk_yes: enc_pk_yes_serialized,
                    enc_pk_no: enc_pk_no_serialized,
                })
                .then((res) => {
                    if (res.data.ActionType === "ok") {
                        ElMessage.success("Registration successful");
                        router.push("/vote-manage/votelist");
                    } else {
                        ElMessage.error(res.data.error);
                    }
                })
                .catch((err) => {
                    ElMessage.error("Registration failed");
                });
        }
    });
};

//鼠标悬停在复制投票凭证的按钮上时，显示的提示文字
const privateKeyCopyTipContent = ref("Copy secret key");

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
        "sk_yes: " +
        sk_yes_string.value +
        "\n" +
        "sk_no: " +
        sk_no_string.value;

    navigator.clipboard.writeText(str).then(() => {
        privateKeyCopyTipContent.value = "Copied to clipboard";
        setTimeout(() => {
            privateKeyCopyTipContent.value = "Copy secret key";
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
    max-width: 800px;
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
