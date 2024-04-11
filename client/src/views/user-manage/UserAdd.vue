<template>
    <UserList v-bind="info" />
    <button @click="info.val.value++, console.log(info.val)">aaa</button>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
import UserList from "./UserList.vue";

let info = {
    val: ref(0),
};
</script>

<style>
.infinite-list {
    height: 300px;
    padding: 0;
    margin: 0;
    list-style: none;
}
.infinite-list .infinite-list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    background: var(--el-color-primary-light-9);
    margin: 10px;
    color: var(--el-color-primary);
}
.infinite-list .infinite-list-item + .list-item {
    margin-top: 10px;
}
</style>
