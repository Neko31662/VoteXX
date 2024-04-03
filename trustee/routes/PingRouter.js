var express = require('express');
var PingRouter = express.Router();

PingRouter.get("/ping", (req, res) => {
    res.send({ ActionType: "ok" });
});

module.exports = PingRouter;