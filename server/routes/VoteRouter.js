var express = require('express');
var VoteRouter = express.Router();
const VoteController = require('../controllers/VoteController');

VoteRouter.post("/serverapi/vote/create",VoteController.create);

module.exports = VoteRouter;