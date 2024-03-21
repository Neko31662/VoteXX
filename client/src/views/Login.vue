<template>
    <div>
        <Particle />
        <div class="formContainer">
            <h3>VoteXX投票系统</h3>
            <LoginForm />
        </div>
    </div>
</template>

<script setup>
import Particle from "@/components/Particle.vue"; //粒子效果
import LoginForm from "@/components/login/LoginForm.vue"; //登录表单
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

}
/*---登录框样式---*/
</style>
