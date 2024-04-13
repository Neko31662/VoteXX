<template>
    <el-card>
        <template #header>
            <h3>投票阶段</h3>
        </template>
        <el-form
            label-width="auto"
            label-position="left"
            ref="votingFormRef"
            :model="votingForm"
            status-icon
            :rules="votingRules"
        >
            <el-form-item label="投票截止时间">
                <el-text tag="p" line-clamp="10000">
                    {{ dateToString(voteEndTime) }}
                </el-text>
            </el-form-item>
            <el-form-item label="请输入投票密钥" prop="sk_string">
                <el-input v-model="votingForm.sk_string" autocomplete="off" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="vote()">投票</el-button>
        </template>
    </el-card>
</template>

<script setup>
import { onBeforeMount, ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
const route = useRoute();
const router = useRouter();
import { ElMessage } from "element-plus";

import elliptic from "elliptic";
const EC = elliptic.ec;
const ec = new EC("secp256k1");
import BN from "bn.js";

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

//表单的引用对象
const votingFormRef = ref();

//表单绑定的响应式对象
const votingForm = reactive({
    sk_string: "",
});

//表单的校验规则
const votingRules = reactive({
    sk_string: [
        {
            validator: (rule, value) => {
                const hexRegex = /^[0-9a-f]+$/;
                return hexRegex.test(value);
            },
            message: "密钥应当只包含0-9以及小写字母a-f",
            trigger: "blur",
        },
    ],
});

/**
 * 点击按钮后进行投票
 */
const vote = () => {
    votingFormRef.value.validate(async (valid) => {
        if (valid) {
            //获取投票公钥
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
                ElMessage.error("获取公钥失败");
                return;
            }
            let election_pk = deserialize(pk_serialized, ec);

            //生成签名
            let sk = new BN(votingForm.sk_string, 16);
            let pk = ec.curve.g.mul(sk);
            let sign_privateKey = ec.keyFromPrivate(sk);
            let signature = sign_privateKey.sign(route.query._id);
            let enc_pk = election_pk.encrypt(pk);

            let signature_serialized = serialize(signature);
            let enc_pk_serialized = serialize(enc_pk);

            axios
                .post("/serverapi/vote-private/voting-step", {
                    voteID: route.query._id,
                    signature: signature_serialized,
                    enc_pk: enc_pk_serialized,
                })
                .then((res) => {
                    if (res.data.ActionType === "ok") {
                        ElMessage.success("投票成功");
                        router.push("/vote-manage/votelist");
                    } else {
                        ElMessage.error(res.data.error);
                    }
                })
                .catch((err) => {
                    ElMessage.error("投票失败");
                });
        }
    });
};

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
</script>

<style lang="scss" scoped>
/*---元素宽度---*/
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
</style>
