const BN = require('../primitiv/bn/bn');
const ec = require('../primitiv/ec/ec');
const { serialize } = require('../util/Serializer');

let a = new BN(10002000);
let red = BN.red(ec.curve.p);
let reda = a.tryToRed(red);
function func(a) {
    a = [a];
    return a;
}

let val = new BN(10002000);
let val2 = func(val);


console.log(ec.curve.p.toString());
console.log(ec.curve.n.toString());
let n = ec.curve.n;
n = n.subn(1).divn(2);
console.log(n.toString());



