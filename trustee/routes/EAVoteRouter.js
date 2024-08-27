var express = require('express');
var EAVoteRouter = express.Router();
var EAVoteController = require("../controllers/EAVoteController");

const DKGRouter = require("./DKGRouter");
const FinalTallyRouter = require("./FinalTallyRouter");

EAVoteRouter.post("/ea-vote/join-vote", EAVoteController.joinVote);
EAVoteRouter.use(DKGRouter);
EAVoteRouter.use(FinalTallyRouter);

module.exports = EAVoteRouter;