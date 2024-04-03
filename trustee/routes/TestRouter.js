var express = require('express');
var TestRouter = express.Router();

TestRouter.get("/test", (req, res) => {
    res.send({ ActionType: 1 });
});

module.exports = TestRouter;