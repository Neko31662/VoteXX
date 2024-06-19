var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var BN = require('../bn/bn');

EC.prototype.randomBN = function () {
    return this.genKeyPair().getPrivate();
};

EC.prototype.randomPoint = function () {
    return this.curve.g.mul(this.randomBN());
};

EC.prototype.infinitePoint = function(){
    return this.curve.g.mul(new BN(0));
}

module.exports = ec;