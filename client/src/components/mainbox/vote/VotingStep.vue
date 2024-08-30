<template>
    <el-card>
        <template #header>
            <h3>Voting phase</h3>
        </template>
        <el-form
            label-width="auto"
            label-position="left"
            ref="votingFormRef"
            :model="votingForm"
            status-icon
            :rules="votingRules"
        >
            <el-form-item label="Voting deadline">
                <el-text tag="p" line-clamp="10000">
                    {{ dateToString(voteEndTime) }}
                </el-text>
            </el-form-item>
            <el-form-item
                label="Please enter voting secret key"
                prop="sk_string"
            >
                <el-input v-model="votingForm.sk_string" autocomplete="off" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="router.push('/vote-manage/votelist')">
                Exit
            </el-button>
            <el-button type="primary" @click="vote()">Vote</el-button>
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

import ec from "@/../../crypt/primitiv/ec/ec";
import BN from "@/../../crypt/primitiv/bn/bn";
import { ElgamalEnc } from "@/../../crypt/primitiv/encryption/ElGamal";
import { serialize, deserialize } from "@/../../crypt/util/Serializer";

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
            message:
                "The key should only contain 0-9 and lowercase letters a-f",
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
                ElMessage.error("Failed to get public key");
                return;
            }
            let election_pk = deserialize(pk_serialized, ec);

            //生成签名并加密
            let sk = new BN(votingForm.sk_string, 16);
            let pk = ec.curve.g.mul(sk);
            let sign_privateKey = ec.keyFromPrivate(sk);
            let signature = sign_privateKey.sign(route.query._id);
            let encode_r = ElgamalEnc.encode(ec, signature.r);
            let encode_s = ElgamalEnc.encode(ec, signature.s);
            signature.r = [];
            for (let i = 0; i < encode_r.length; i++) {
                signature.r[i] = ElgamalEnc.encrypt(
                    ec,
                    election_pk,
                    encode_r[i]
                );
            }
            signature.s = [];
            for (let i = 0; i < encode_s.length; i++) {
                signature.s[i] = ElgamalEnc.encrypt(
                    ec,
                    election_pk,
                    encode_s[i]
                );
            }
            let signature_serialized = serialize(signature);

            //加密投票公钥
            let enc_pk = ElgamalEnc.encrypt(ec, election_pk, pk);
            let enc_pk_serialized = serialize(enc_pk);

            axios
                .post("/serverapi/vote-private/voting-step", {
                    voteID: route.query._id,
                    signature: signature_serialized,
                    enc_pk: enc_pk_serialized,
                })
                .then((res) => {
                    if (res.data.ActionType === "ok") {
                        ElMessage.success("Vote successfully");
                        router.push("/vote-manage/votelist");
                    } else {
                        ElMessage.error(res.data.error);
                    }
                })
                .catch((err) => {
                    ElMessage.error("Vote failed");
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
