<template>
    <div>
        <Particle />
        <div class="formContainer">
            <h3>注册账号</h3>
            <SignUpForm />
        </div>
    </div>
</template>

<script setup>
import Particle from "@/components/Particle.vue"; //粒子效果
import SignUpForm from "@/components/signup/SignUpForm.vue";
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