var express = require('express');
var DKGRouter = express.Router();
var DKGController = require("../controllers/DKGController");


DKGRouter.post("/ea-vote/dkg-gen-key/step1", DKGController.DKG_genKey_step1);
DKGRouter.post("/ea-vote/dkg-gen-key/step2", DKGController.DKG_genKey_step2);
DKGRouter.post("/ea-vote/dkg-decrypt/step1", DKGController.DKG_decrypt_step1);
DKGRouter.post("/ea-vote/dkg-decrypt/step2", DKGController.DKG_decrypt_step2);

module.exports = DKGRouter;