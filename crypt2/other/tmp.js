const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize, encodePoint } = require('../util/Serializer');

let g = ec.curve.g;
let n = ec.curve.n;
let p = ec.curve.p;

let red = BN.red(n);
let redn = n.tryToRed(red);
let a1 = g.mul(new BN(1).tryToRed(red).redNeg());
let a2 = g.mul(n.subn(1));
let a3 = g.mul(n.add(n).subn(1));

console.log(a1.encode('hex',1));
console.log(a2.encode('hex',1));
console.log(a3.encode('hex',1));








