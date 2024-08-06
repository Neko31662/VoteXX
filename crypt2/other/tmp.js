const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize, encodePoint } = require('../util/Serializer');

let g = ec.curve.g;
let n = ec.curve.n;

let g_n = g.mul(n);
console.log(n.toString(10));






