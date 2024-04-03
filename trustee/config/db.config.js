const mongoose = require("mongoose");

//获取运行时传入的参数
const args = process.argv.slice(2);

mongoose.connect(`mongodb://127.0.0.1:27017/${args[3]}`);