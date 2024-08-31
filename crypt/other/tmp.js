const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize, encodePoint, deserialize } = require('../util/Serializer');

let g = ec.curve.g;
let n = ec.curve.n;
let p = ec.curve.p;

let key = ec.genKeyPair();

let m = new Map();
m.set("111", { a: 1, b: 2 });
let tmp = m.get("111");
m.delete("111");

console.log(tmp);









