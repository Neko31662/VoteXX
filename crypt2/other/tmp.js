const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize } = require('../util/Serializer');

let red = BN.red(ec.curve.n);
let val = new BN(10002000);
val = val.tryToRed(red);
let val2 = val.clone();
val.iaddn(100);

console.log(val2);


