<template>
    <el-card>
        <template #header>
            <h3>Nullification phase</h3>
        </template>
        <el-form
            label-width="auto"
            label-position="left"
            ref="nullificationFormRef"
            :model="nullificationForm"
            status-icon
            :rules="nullificationRules"
        >
            <el-form-item label="Nullification time">
                <el-text tag="p" line-clamp="10000">
                    {{
                        dateToString(nulStartTime) +
                        " ~ " +
                        dateToString(nulEndTime)
                    }}
                </el-text>
            </el-form-item>
            <el-form-item>
                <el-text tag="p" line-clamp="10000">
                    If you wish to nullify a yes vote, please enter
                    <b>the corresponding sk_no</b>
                    ; If you wish to nullify a no vote, please enter
                    <b>the corresponding sk_yes</b>
                </el-text>
            </el-form-item>
            <el-form-item label="Please enter secret key" prop="sk_string">
                <el-input
                    v-model="nullificationForm.sk_string"
                    autocomplete="off"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="router.push('/vote-manage/votelist')">
                Exit
            </el-button>
            <el-button type="primary" @click="nullify()">
                Confirm nullification
            </el-button>
        </template>
    </el-card>
</template>

<script setup>
import { ref, reactive } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
import { ElMessage } from "element-plus";

import ec from "@/../../crypt/primitiv/ec/ec";
import BN from "@/../../crypt/primitiv/bn/bn";
import { LiftedElgamalEnc } from "@/../../crypt/primitiv/encryption/LiftedElGamal";
import { serialize, deserialize } from "@/../../crypt/util/Serializer";
import { NullificationArgument } from "@/../../crypt/protocol/nullification/NullificationArgument";

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
const nullificationFormRef = ref();

//表单绑定的响应式对象
const nullificationForm = reactive({
    sk_string: "",
});

//表单的校验规则
const nullificationRules = reactive({
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

const nullify = () => {
    nullificationFormRef.value.validate(async (valid) => {
        if (valid) {
            //获取投票公钥
            let election_pk_serialized = null;
            try {
                let res = await axios.get("/serverapi/vote-private/get-pk", {
                    params: {
                        _id: route.query._id,
                    },
                });
                if (res.data.ActionType === "ok") {
                    election_pk_serialized = res.data.data;
                } else {
                    ElMessage.error(res.data.error);
                    return;
                }
            } catch (err) {
                ElMessage.error("Failed to get public key");
                return;
            }

            //获取Pedersen公钥
            let ck_serialized = null;
            try {
                let res = await axios.get("/serverapi/vote-private/get-ck", {
                    params: {
                        _id: route.query._id,
                    },
                });
                if (res.data.ActionType === "ok") {
                    ck_serialized = res.data.data;
                } else {
                    ElMessage.error(res.data.error);
                    return;
                }
            } catch (err) {
                ElMessage.error("Failed to get Pedersen public key");
                return;
            }

            //获取yesVotes和noVotes
            let yesVotes_serialized = [];
            let noVotes_serialized = [];
            try {
                let res = await axios.get(
                    "/serverapi/vote-private/get-provisional-tally-votes",
                    {
                        params: {
                            _id: route.query._id,
                        },
                    }
                );
                if (res.data.ActionType === "ok") {
                    yesVotes_serialized = res.data.data.yesVotes;
                    noVotes_serialized = res.data.data.noVotes;
                } else {
                    ElMessage.error(res.data.error);
                    return;
                }
            } catch (err) {
                ElMessage.error("Failed to get provisional tally result");
                return;
            }

            //计算用户公钥
            let sk = new BN(nullificationForm.sk_string, 16);
            let pk = ec.curve.g.mul(sk);
            let pk_serialized = serialize(pk);

            //查看用户输入的私钥是否对应某一个公钥
            let hit = false;
            let nullifyYes = false; //该值为真说明弃掉的是赞成票，为假说明弃的是反对票
            let Votes_serialized = null;
            //查看该公钥是在yesVotes还是noVotes中
            for (let i = 0; i < yesVotes_serialized.length; i++) {
                if (yesVotes_serialized[i] === pk_serialized) {
                    hit = true;
                    nullifyYes = true;
                    Votes_serialized = yesVotes_serialized;
                    break;
                }
            }
            if (!hit) {
                for (let i = 0; i < noVotes_serialized.length; i++) {
                    if (noVotes_serialized[i] === pk_serialized) {
                        hit = true;
                        nullifyYes = false;
                        Votes_serialized = noVotes_serialized;
                        break;
                    }
                }
            }
            //如果都不在
            if (!hit) {
                ElMessage.error("No valid vote was found for this key");
                return;
            }

            let election_pk = deserialize(election_pk_serialized, ec);
            let ck = deserialize(ck_serialized, ec);
            let Votes = Votes_serialized.map((value) => deserialize(value, ec));
            let index = null;
            let E_list = [];
            let r_list = [];
            for (let i = 0; i < Votes_serialized.length; i++) {
                if (pk_serialized === Votes_serialized[i]) {
                    index = i;
                    break;
                }
            }
            for (let i = 0; i < Votes_serialized.length; i++) {
                if (index !== i) {
                    r_list[i] = ec.randomBN();
                    E_list[i] = LiftedElgamalEnc.encrypt(
                        ec,
                        election_pk,
                        1,
                        r_list[i]
                    );
                } else {
                    r_list[i] = ec.randomBN();
                    E_list[i] = LiftedElgamalEnc.encrypt(
                        ec,
                        election_pk,
                        0,
                        r_list[i]
                    );
                }
            }

            let proof = NullificationArgument.generateNullificationProof(
                ec,
                election_pk,
                ck,
                Votes,
                E_list,
                r_list,
                sk,
                index
            );

            let data = {
                voteID: route.query._id,
                nullifyYes,
                flagList: E_list.map((item) => serialize(item)),
                proof: serialize(proof),
            };

            try {
                let res = await axios.post(
                    "/serverapi/vote-private/nullify",
                    data
                );
                if (res.data.ActionType === "ok") {
                    ElMessage.success("Nullification succesful");
                    router.push("/vote-manage/votelist");
                } else {
                    ElMessage.error(res.data.error);
                    return;
                }
            } catch (err) {
                ElMessage.error("Nullification failed");
                return;
            }
        }
    });
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
