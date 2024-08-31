var express = require('express');
var PETRouter = express.Router();
var PETController = require("../controllers/PETController");

PETRouter.post("/ea-vote/pet/step1", PETController.PET_step1);
PETRouter.post("/ea-vote/pet/step2", PETController.PET_step2);
PETRouter.post("/ea-vote/pet/step3", PETController.PET_step3);

module.exports = PETRouter;