<template>
    <div>
        <vue-particles id="tsparticles" :options="options" :particlesLoaded="particlesLoaded" />
        <div class="formContainer">
            <h3>企业门户管理系统</h3>
            <el-form ref="loginFormRef" :model="loginForm" status-icon :rules="loginRules" label-width="80px" class="loginform">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="loginForm.username" autocomplete="off" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="loginForm.password" autocomplete="off" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitForm()">
                        登录
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
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

const router = useRouter();
//提交表单的函数
const submitForm = () => {
    //1.校验
    loginFormRef.value.validate((valid) => {
        //全部通过校验，valid为true，反之为false
        // console.log("表单校验：" + valid);
        if (valid) {

            //2.提交后台
            axios.post("/adminapi/user/login", loginForm).then((res) => {
                if (res.data.ActionType === "ok") {
                    //3.提供token(这一步在axios拦截器中实现)
                    //4.跳转
                    router.push("/index");
                } else {
                    ElMessage.error("用户名和密码不匹配");
                }
            });
        }
    });
};

//配置particles粒子效果
const options = {
    background: {
        color: {
            value: "#2d3a4b",
        },
    },
    fpsLimit: 120,
    interactivity: {
        events: {
            onClick: {
                enable: true,
                mode: "push",
            },
            onHover: {
                enable: true,
                mode: "repulse",
            },
        },
        modes: {
            bubble: {
                distance: 400,
                duration: 2,
                opacity: 0.8,
                size: 40,
            },
            push: {
                quantity: 4,
            },
            repulse: {
                distance: 200,
                duration: 0.4,
            },
        },
    },
    particles: {
        color: {
            value: "#ffffff",
        },
        links: {
            color: "#ffffff",
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
        },
        move: {
            direction: "none",
            enable: true,
            outModes: "bounce",
            random: false,
            speed: 6,
            straight: false,
        },
        number: {
            density: {
                enable: true,
            },
            value: 80,
        },
        opacity: {
            value: 0.5,
        },
        shape: {
            type: "circle",
        },
        size: {
            value: { min: 1, max: 5 },
        },
    },
    detectRetina: true,
};
</script>

<style lang="scss" scoped>
.formContainer {
    width: 500px;
    height: 300px;
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
</style>