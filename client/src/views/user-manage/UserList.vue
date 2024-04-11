<template>
    <div>{{ val }}</div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from "element-plus";
defineProps({
    val: Object,
});
</script>
