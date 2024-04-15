var express = require('express');
var FinalTallyRouter = express.Router();
var FinalTallyController = require("../controllers/FinalTallyController");

FinalTallyRouter.post("/ea-vote/final-tally/init", FinalTallyController.init);
FinalTallyRouter.post("/ea-vote/final-tally/mix-and-match/step1", FinalTallyController.mixAndMatch_step1);
FinalTallyRouter.post("/ea-vote/final-tally/mix-and-match/step2", FinalTallyController.mixAndMatch_step2);
FinalTallyRouter.post("/ea-vote/final-tally/mix-and-match/step3", FinalTallyController.mixAndMatch_step3);
FinalTallyRouter.post("/ea-vote/final-tally/mix-and-match/step4", FinalTallyController.mixAndMatch_step4);
FinalTallyRouter.post("/ea-vote/final-tally/mix-and-match/step5", FinalTallyController.mixAndMatch_step5);

module.exports = FinalTallyRouter;

