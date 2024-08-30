const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize, encodePoint, deserialize } = require('../util/Serializer');

let g = ec.curve.g;
let n = ec.curve.n;
let p = ec.curve.p;

let key = ec.genKeyPair();

let signature = key.sign("route.query._id");

console.log(signature);

signature = deserialize(serialize(signature), ec);
console.log(signature);

console.log(key.verify("route.query._id", signature));


// let s2 = new ec.Signature()









