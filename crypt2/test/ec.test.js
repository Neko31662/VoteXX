let BN = require('bn.js');
let ec = require('../primitiv/ec/ec');

let chai = require('chai');
let assert = chai.assert;

describe("Test of 'ec.js'", () => {

    it("Test for using new prototypes", () => {
        try {
            ec.randomBN();
            ec.randomPoint();
        } catch (err) {
            assert.fail("Catch error: " + err);
        }
    });

    describe("Test for function 'randomBN'", () => {
        let random_times = 50;

        it(`Result should between 0 and ec.curve.p (check ${random_times} times)`, () => {
            for (let i = 0; i < random_times; i++) {
                let v = ec.randomBN();
                assert.isTrue((v.gte(new BN(0))) && (v.lte(ec.curve.p)));
            }
        });
    });
});