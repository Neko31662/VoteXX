var express = require('express');
var DKGRouter = express.Router();
var DKGController = require("../controllers/DKGController");


DKGRouter.post("/ea-vote/dkg/step1", DKGController.DKG_step1);
DKGRouter.post("/ea-vote/dkg/step2", DKGController.DKG_step2);
DKGRouter.post("/ea-vote/dkg/step3", DKGController.DKG_step3);

module.exports = DKGRouter;