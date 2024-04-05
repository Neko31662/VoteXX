var express = require('express');
var TrusteeRouter = express.Router();
const TrusteeController = require('../controllers/TrusteeController');

TrusteeRouter.post("/trusteeapi/trustee/register", TrusteeController.register);

module.exports = TrusteeRouter;