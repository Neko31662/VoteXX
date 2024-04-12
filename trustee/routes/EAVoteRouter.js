var express = require('express');
var EAVoteRouter = express.Router();
var EAVoteController = require("../controllers/EAVoteController");

const DKGRouter = require("./DKGRouter");

EAVoteRouter.post("/ea-vote/join-vote", EAVoteController.joinVote);
EAVoteRouter.post("/ea-vote/get-private-key", EAVoteController.getPrivateKey);
EAVoteRouter.use(DKGRouter);

module.exports = EAVoteRouter;