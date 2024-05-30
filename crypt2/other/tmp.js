const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
var BN = require('bn.js');

let a = new BN('100000000000000000000000000000000000000000000000000001');
let b = new BN(3);
let c = a.divn(3);

console.log(c.toString(10));
