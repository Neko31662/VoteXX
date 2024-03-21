<template>
    <el-form
        ref="signUpFormRef"
        :model="signUpForm"
        status-icon
        :rules="signUpRules"
        label-width="80px"
        hide-required-asterisk="true"
        class="sign-up-form"
    >
        <el-form-item label="用户名" prop="username">
            <el-input v-model="signUpForm.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
            <el-input
                v-model="signUpForm.password"
                autocomplete="off"
                type="password"
            />
        </el-form-item>
        <el-form-item label="确认密码" prop="passwordConfirm">
            <el-input
                v-model="signUpForm.passwordConfirm"
                autocomplete="off"
                type="password"
            />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm()">注册</el-button>
            <el-button @click="cancelForm()">取消</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
import axios from "axios";
import { useStore } from "vuex";
const store = useStore();
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus"; //消息弹框

//表单绑定的响应式对象
const signUpForm = reactive({
    username: "",
    password: "",
    passwordConfirm: "",
});

//表单的引用对象
const signUpFormRef = ref();

//校验规则
const signUpRules = reactive({
    username: [
        {
            required: true,
            message: "请输入用户名",
            trigger: "blur",
        },
        {
            max: 32,
            message: "用户名长度请勿超过32",
            trigger: "blur",
        },
        {
            //自定义异步验证函数：验证用户名是否重复
            asyncValidator: (rule, value) => {
                return new Promise((resolve, reject) => {
                    axios
                        .get(
                            `/serverapi/user/check-username-valid?username=${value}`
                        )
                        .then((res) => {
                            if (res.data.UsernameValid === true) {
                                resolve();
                            } else {
                                reject("用户名已存在");
                            }
                        });
                });
            },
            trigger: "blur",
        },
    ],
    password: [
        {
            required: true,
            message: "请输入密码",
            trigger: "blur",
        },
        {
            min: 8,
            max: 64,
            message: "密码长度应在8~64位之间",
            trigger: "blur",
        },
        {
            validator: (rule, value) => {
                const hasDigit = /[0-9]/.test(value);
                const hasLetter = /[a-zA-Z]/.test(value);
                const hasNonASCII = /[^\x00-\x7F]/.test(value);
                return hasDigit && hasLetter && !hasNonASCII;
            },
            message: "密码应当包含至少一个数字和一个字母，且不含非英文字符",
            trigger: "blur",
        },
    ],
    passwordConfirm: [
        {
            validator: (rule, value) => {
                return value === signUpForm.password;
            },
            message: "两次密码输入不相同",
            trigger: "blur",
        },
    ],
});

/**
 * 提交注册表单
 */
const submitForm = () => {
    signUpFormRef.value.validate((valid) => {
        //通过校验
        if (valid) {
            axios.post("/serverapi/user/signup", signUpForm).then((res) => {
                if (res.data.ActionType === "ok") {
                    ElMessage.success("注册成功");
                    router.push("/index");
                } else {
                    ElMessage.error("注册失败");
                }
            });
        }else{
            console.log("fail!!!!!!!!!");
        }
    });
};

/**
 * 取消注册，返回登录页面
 */
const cancelForm = () => {
    router.push("/login");
};
</script>

<style lang="scss" scoped>
.sign-up-form {
    margin-top: 20px;
}

::v-deep .el-form-item__label {
    color: white;
}
</style>
