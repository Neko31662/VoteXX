var express = require('express');
var VoteRouter = express.Router();
const VoteController = require('../controllers/VoteController');

VoteRouter.post("/serverapi/vote/create", VoteController.create);
VoteRouter.post("/serverapi/vote/join", VoteController.join);
VoteRouter.get("/serverapi/vote/count-owned-vote", VoteController.countOwnedVote);
VoteRouter.get("/serverapi/vote/show-owned-vote", VoteController.showOwnedVote);
VoteRouter.get("/serverapi/vote/get-vote-token", VoteController.getVoteToken);

module.exports = VoteRouter;