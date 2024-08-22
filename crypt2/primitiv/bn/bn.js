var BN = require('bn.js');

/**
 * 
 * @param {BN.ReductionContext} reductionContext
 * @returns {RedBN}
 */
BN.prototype.tryToRed = function (reductionContext) {
    if (this.red) {
        return this.fromRed().toRed(reductionContext);
    } else {
        return this.toRed(reductionContext);
    }
};

BN.prototype.modPow = function (b, m) {
    let red = BN.red(m);
    let reda = this.tryToRed(red);
    let res = reda.redPow(b);
    return res.fromRed();
};

BN.prototype.modMul = function (b, m) {
    let red = BN.red(m);
    let reda = this.tryToRed(red);
    let redb = b.tryToRed(red);
    let res = reda.redMul(redb);
    return res.fromRed();
};


module.exports = BN;