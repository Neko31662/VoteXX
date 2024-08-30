//这一路由下的请求不携带用户token
var express = require('express');
var VotePrivateRouter = express.Router();
const VotePrivateController = require('../controllers/VotePrivateController');

VotePrivateRouter.get("/serverapi/vote-private/get-pk", VotePrivateController.getPk);
VotePrivateRouter.get("/serverapi/vote-private/get-ck", VotePrivateController.getCk);
VotePrivateRouter.post("/serverapi/vote-private/voting-step", VotePrivateController.votingStep);
VotePrivateRouter.get("/serverapi/vote-private/get-provisional-tally-votes", VotePrivateController.getProvisionalTallyVotes);
VotePrivateRouter.post("/serverapi/vote-private/nullify", VotePrivateController.nullify);

module.exports = VotePrivateRouter;