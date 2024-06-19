var BN = require('bn.js');

BN.prototype.modPow = function (b, m) {
    let red = this.toRed(m);
    let res = red.redPow(b);
    return res.fromRed();
};


module.exports = BN;