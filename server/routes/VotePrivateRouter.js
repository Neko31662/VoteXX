//这一路由下的请求不携带用户token
var express = require('express');
var VotePrivateRouter = express.Router();
const VotePrivateController = require('../controllers/VotePrivateController');

VotePrivateRouter.get("/serverapi/vote-private/get-pk", VotePrivateController.getPk);
VotePrivateRouter.post("/serverapi/vote-private/voting-step", VotePrivateController.votingStep);

module.exports = VotePrivateRouter;