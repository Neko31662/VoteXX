var express = require('express');
var UserRouter = express.Router();
const UserController = require('../controllers/UserController');

//文件上传
const multer = require("multer");
const upload = multer({ dest: "public/avataruploads" });

//处理传来的请求，调用Controller层的函数来处理
UserRouter.post("/serverapi/user/login", UserController.login);
UserRouter.post("/serverapi/user/upload", upload.single("avatarFile"), UserController.upload);

module.exports = UserRouter;
