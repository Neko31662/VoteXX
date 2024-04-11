//这一路由的请求不携带用户token
var express = require('express');
var VotePrivateRouter = express.Router();
const VotePrivateController = require('../controllers/VotePrivateController');

// VotePrivateRouter.post("/serverapi/vote-private/xxx", VotePrivateController.register);

module.exports = VotePrivateRouter;