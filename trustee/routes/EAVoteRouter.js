var express = require('express');
var EAVoteRouter = express.Router();
var EAVoteController = require("../controllers/EAVoteController.js");

EAVoteRouter.post("/ea-vote/join-vote",EAVoteController.joinVote);

module.exports = EAVoteRouter;