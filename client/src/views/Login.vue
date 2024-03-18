<template>
    <div>
        <Particle />
        <div class="formContainer">
            <h3>VoteXX投票系统</h3>
            <el-form ref="loginFormRef" :model="loginForm" status-icon :rules="loginRules" label-width="80px"
                hide-required-asterisk="true" class="loginform">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="loginForm.username" autocomplete="off" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="loginForm.password" autocomplete="off" type="password" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitForm()">
                        登录
                    </el-button>
                </el-form-item>
                <div>
                    <el-link href="/#/register" type="primary">还没有账号？</el-link>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup>
import { ElMessage } from "element-plus"; //消息弹框
import Particle from "@/components/Particle.vue"; //粒子效果
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useStore } from "vuex";
const store = useStore();

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

const router = useRouter();

/**
 * 提交表单
 */
const submitForm = () => {
    //1.校验
    loginFormRef.value.validate((valid) => {
        //全部通过校验，valid为true，反之为false
        // console.log("表单校验：" + valid);
        if (valid) {

            //2.提交后台
            axios.post("/adminapi/user/login", loginForm).then((res) => {
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
/*---登录框样式---*/
.formContainer {
    width: 500px;
    height: 250px;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba($color: #000000, $alpha: 0.5);
    color: white;
    text-align: center;
    padding: 20px;

    h3 {
        font-size: 20px;
    }

    .loginform {
        margin-top: 20px;
    }
}

::v-deep .el-form-item__label {
    color: white;
}

/*---登录框样式---*/
</style>