var express = require('express');
var TrusteeRouter = express.Router();
const axios = require("axios");
const net = require('net');
const TrusteeController = require('../controllers/TrusteeController');

TrusteeRouter.post("/trusteeapi/trustee/register", TrusteeController.register);

module.exports = TrusteeRouter;