const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize } = require('../util/Serializer');

let red = BN.red(ec.curve.n);
let val = new BN(10002000);
let val2 = val.tryToRed(red);

for(let i=0;i<10;i++){
    val2 = val2.redAdd(ec.randomBN().tryToRed(red));
}

let val3 = val2.fromRed();

console.log(val2.toString(16));
console.log(val3.toString(16));



