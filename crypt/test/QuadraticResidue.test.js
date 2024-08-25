const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { QuadraticResidue } = require('../primitiv/QuadraticResidue/QuadraticResidue');

let chai = require('chai');
let assert = chai.assert;

describe(`Test of 'QuadraticResidue.js', where p = ${ec.curve.p.toString(16)}`, () => {
    let p = ec.curve.p;
    let specialNumberList = [
        new BN(0),
        new BN(ec.curve.p),
    ];

    let arr = [];
    for (let i = 1; i <= 50; i++) {
        arr.push(ec.randomBN());
    }
    let Qs = 0;
    for (let a of arr) {
        let valid = QuadraticResidue.check(a, p);
        if (valid) {
            Qs++;
        }
    }
    it(`Test for ${arr.length} random numbers, ${Qs} of them are quadratic residues`, () => {
        for (let a of arr) {
            let valid = QuadraticResidue.check(a, p);
            if (valid) {
                let x = QuadraticResidue.find(a, p);
                assert.isTrue(x.pow(new BN(2)).mod(p).eq(a), `x^2 != a, where a = ${a.toString(16)}, x = ${x.toString(16)}`);
            }
        }
    });

    for (let i in specialNumberList) {
        it(`Test for special number a = ${specialNumberList[i].toString(16)}`, () => {
            let a = specialNumberList[i];
            let valid = QuadraticResidue.check(a, p);
            if (valid) {
                let x = QuadraticResidue.find(a, p);
                assert.isTrue(x.pow(new BN(2)).mod(p).eq(a), `x^2 != a, where a = ${a.toString(16)}, x = ${x.toString(16)}`);
            }
        });
    }
});