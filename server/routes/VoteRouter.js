var express = require('express');
var VoteRouter = express.Router();
const VoteController = require('../controllers/VoteController');

VoteRouter.post("/serverapi/vote/create",VoteController.create);
VoteRouter.post("/serverapi/vote/join",VoteController.join);

module.exports = VoteRouter;