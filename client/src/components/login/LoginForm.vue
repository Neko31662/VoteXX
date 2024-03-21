<template>
    <el-form
        ref="loginFormRef"
        :model="loginForm"
        status-icon
        :rules="loginRules"
        label-width="80px"
        hide-required-asterisk="true"
        class="login-form"
    >
        <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
            <el-input
                v-model="loginForm.password"
                autocomplete="off"
                type="password"
            />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm()">登录</el-button>
        </el-form-item>
        <div>
            <el-link href="/#/signup" type="primary">还没有账号？</el-link>
        </div>
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
const loginForm = reactive({
    username: "",
    password: "",
});

//表单的引用对象
const loginFormRef = ref();

//校验规则
const loginRules = reactive({
    username: [
        {
            required: true,
            message: "请输入用户名",
            trigger: "blur",
            //required：要求，不符合要求触发message
            //trigger：触发校验的条件，“blur”为失去焦点
        },
    ],
    password: [
        {
            required: true,
            message: "请输入密码",
            trigger: "blur",
        },
    ],
});

/**
 * 提交表单
 */
const submitForm = () => {
    //1.校验
    loginFormRef.value.validate((valid) => {
        //全部通过校验，valid为true，反之为false
        if (valid) {
            //2.提交后台
            axios.post("/serverapi/user/login", loginForm).then((res) => {
                if (res.data.ActionType === "ok") {
                    //3.服务器返回token(这一步在axios拦截器中实现)
                    //4.服务器返回用户相关信息
                    store.commit("changeUserInfo", res.data.data);
                    //5.跳转
                    router.push("/index");
                } else {
                    ElMessage.error("用户名和密码不匹配");
                }
            });
        }
    });
};
</script>

<style lang="scss" scoped>
.login-form {
    margin-top: 20px;
}

::v-deep .el-form-item__label {
    color: white;
}
</style>
