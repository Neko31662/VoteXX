var express = require('express');
var TestRouter = express.Router();

TestRouter.get("/test", (req, res) => {
    res.send({ ok: 1 });
});

module.exports = TestRouter;