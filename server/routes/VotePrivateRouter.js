//这一路由的请求不携带用户token
var express = require('express');
var VotePrivateRouter = express.Router();
const VotePrivateController = require('../controllers/VotePrivateController');

VotePrivateRouter.get("/serverapi/vote-private/get-pk", VotePrivateController.getPk);

module.exports = VotePrivateRouter;