<template>
    <!-- 更新个人信息表单 -->
    <el-form
        ref="userFormRef"
        style="max-width: 600px"
        :model="userForm"
        :rules="userFormRules"
        label-width="auto"
        status-icon
    >
        <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
            <el-select
                v-model="userForm.gender"
                placeholder="Select"
                style="width: 240px"
            >
                <el-option
                    v-for="item in genderOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-select>
        </el-form-item>

        <el-form-item label="个人简介" prop="introduction">
            <el-input v-model="userForm.introduction" type="textarea" />
        </el-form-item>

        <el-form-item label="头像" prop="avatar">
            <el-upload
                class="avatar-uploader"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleChange"
            >
                <img
                    v-if="userForm.avatar"
                    :src="userForm.avatar"
                    class="avatar"
                />
                <el-icon v-else class="avatar-uploader-icon">
                    <Plus />
                </el-icon>
            </el-upload>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="submitForm()">更新</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { useStore } from "vuex";
const store = useStore();
import { ref, reactive } from "vue";
import axios from "axios";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ServerPublicUrl } from "@/config/config";

//表单的响应式对象
const userFormRef = ref();

//表单的数据绑定
const { username, gender, introduction, avatar } = store.state.userInfo;
const userForm = reactive({
    username,
    gender,
    introduction,
    avatar: avatar ? ServerPublicUrl + avatar : "",
    avatarFile: null,
});

//表单的内容校验
const userFormRules = reactive({
    username: [
        {
            required: true,
            message: "请输入名字",
            trigger: "blur",
        },
    ],
    gender: [
        {
            required: true,
            message: "请输入性别",
            trigger: "blur",
        },
    ],
    introduction: [
        {
            required: true,
            message: "请输入介绍",
            trigger: "blur",
        },
    ],
    avatar: [
        {
            required: true,
            message: "请上传头像",
            trigger: "blur",
        },
    ],
});

//性别列表
const genderOptions = [
    {
        label: "保密",
        value: 0,
    },
    {
        label: "男",
        value: 1,
    },
    {
        label: "女",
        value: 2,
    },
];

/**
 * 选择头像后自动显示在页面上
 */
const handleChange = (file) => {
    //file.raw：原生的file对象
    //URL.createObjectURL：创建URL
    userForm.avatar = URL.createObjectURL(file.raw);
    //顺便将原生的file对象保存，以便提交给后端
    userForm.avatarFile = file.raw;
};

/**
 * 提交更新的信息
 */
const submitForm = () => {
    //校验，校验通过valid === true，否则为false
    userFormRef.value.validate((valid) => {
        //校验通过
        if (valid) {
            //将数据封装为FormData类型
            const params = new FormData();
            for (let i in userForm) {
                params.append(i, userForm[i]);
            }

            //用axios上传
            axios
                .post("/serverapi/user/upload", params, {
                    //传输内容包含文件时，注意Content-Type
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                })
                .then((res) => {
                    console.log(res.data);
                    if (res.data.error) {
                        ElMessage.error(res.data.error);
                    } else if (res.data.ActionType === "ok") {
                        store.commit("changeUserInfo", res.data.data);
                        ElMessage.success("修改成功");
                    }
                });
        }
        //校验不通过
        else {
        }
    });
};
</script>

<style lang="scss" scoped>
/*---图像上传样式设置---*/
.avatar-uploader .avatar {
    width: 178px;
    height: 178px;
    display: block;
}

::v-deep .avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

::v-deep .avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

::v-deep .el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
}
/*---图像上传样式设置---*/
</style>
