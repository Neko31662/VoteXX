let BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');

let chai = require('chai');
let assert = chai.assert;

describe("Test of 'ec.js'", () => {

    it("Test for using new prototypes", () => {
        try {
            ec.randomBN();
            ec.randomPoint();
            ec.infinitePoint();
        } catch (err) {
            assert.fail("Catch error: " + err);
        }
    });

    describe("Test for function 'randomBN'", () => {
        let random_times = 50;

        it(`Result should be between [1, ec.curve.n - 1] (check ${random_times} times)`, () => {
            for (let i = 0; i < random_times; i++) {
                let v = ec.randomBN();
                assert.isTrue((v.gte(new BN(1))) && (v.lte(ec.curve.n.sub(new BN(1)))));
            }
        });
    });

    describe("Test for function 'randomPoint'", () => {
        let random_times = 50;

        it(`Result should be on the EC (check ${random_times} times)`, () => {
            for (let i = 0; i < random_times; i++) {
                let v = ec.randomPoint();
                assert.isTrue(ec.curve.validate(v));
            }
        });
    });

    describe("Test for function 'infinitePoint'", () => {
        it(`Result should be the infinite point`, () => {
            let p = ec.infinitePoint();
            assert.isTrue(p.isInfinity());
        });
    });
});