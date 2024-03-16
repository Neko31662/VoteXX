var express = require('express');
const UserController = require('../../controllers/admin/UserController');
var UserRouter = express.Router();

//处理传来的请求，调用Controller层的函数来处理
UserRouter.post("/adminapi/user/login", UserController.login);
UserRouter.get("/adminapi/user/home", (req, res) => {
    res.send({ ok: 1 });
});

module.exports = UserRouter;
