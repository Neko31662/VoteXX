var express = require('express');
var EAVoteRouter = express.Router();
var EAVoteController = require("../controllers/EAVoteController");

const DKGRouter = require("./DKGRouter");
const FinalTallyRouter = require("./FinalTallyRouter");
const ShuffleRouter = require("./ShuffleRouter");
const PETRouter = require("./PETRouter");

EAVoteRouter.post("/ea-vote/join-vote", EAVoteController.joinVote);
EAVoteRouter.use(DKGRouter);
EAVoteRouter.use(FinalTallyRouter);
EAVoteRouter.use(ShuffleRouter);
EAVoteRouter.use(PETRouter);

module.exports = EAVoteRouter;