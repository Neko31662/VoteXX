var express = require('express');
var EAVoteRouter = express.Router();
var EAVoteController = require("../controllers/EAVoteController.js");

EAVoteRouter.post("/ea-vote/join-vote", EAVoteController.joinVote);

EAVoteRouter.post("/ea-vote/dkg/step1", EAVoteController.DKG_step1);

module.exports = EAVoteRouter;