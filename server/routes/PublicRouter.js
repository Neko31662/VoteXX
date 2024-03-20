var express = require('express');
var PublicRouter = express.Router();
// const PublicController = require('../controllers/PublicController');

PublicRouter.use("/avataruploads/15da3f773f722443007e7080f588cbd3", (req, res) => {
    console.log("here");
    res.send({ ok: 1 });
});

module.exports = PublicRouter;
