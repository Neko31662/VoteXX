require("./config/db.config");
const UserController = require("./controllers/UserController");

var req = {};
req.body = {
    username: "admin2",
    gender: 1,
    introduction: "管理员"
};
req.file = {
    filename: "test_file_name"
};

var res = {};

UserController.upload(req, res);