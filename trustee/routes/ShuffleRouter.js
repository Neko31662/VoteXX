var express = require('express');
var ShuffleRouter = express.Router();
var ShuffleController = require("../controllers/ShuffleController");

ShuffleRouter.post("/ea-vote/shuffle/step1", ShuffleController.shuffle_step1);
ShuffleRouter.post("/ea-vote/shuffle/step2", ShuffleController.shuffle_step2);

module.exports = ShuffleRouter;