const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
let { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');

let chai = require('chai');
let assert = chai.assert;
let { class_of } = require('../util/BasicFunction');

let n = 5;

let global = {};

describe("Test of 'pedersen_commitment.js'", () => {
    describe("Test of 'PedersenPublicKey'", () => {
        it("Test of the constructor", () => {
            let pk = new PedersenPublicKey(ec, n);
            assert.equal(pk.n, n);
            assert.equal(pk.generators.length, n + 1);
            for (let i = 0; i < n + 1; i++) {
                for (let j = i + 1; j < n + 1; j++) {
                    assert.isFalse(pk.generators[i].eq(pk.generators[j]));
                }
            }
            global.pk = pk;
        });

        it("Test of function 'commit', 'values.length == n'", () => {
            let values = [];
            for (let i = 0; i < n; i++) {
                values.push(ec.randomBN());
            }

            let randomness1 = ec.randomBN();
            let commitment1 = PedersenPublicKey_exec.commit(ec, global.pk, values, randomness1)[0];
            assert.equal(class_of(commitment1), "Commitment");

            let [commitment2, randomness2] = PedersenPublicKey_exec.commit(ec, global.pk, values);
            assert.equal(class_of(randomness2), "BN");
            assert.equal(class_of(commitment2), "Commitment");

            global.values = values;
            global.randomness = [randomness1, randomness2];
            global.commitment = [commitment1, commitment2];
        });

        it("Test of function 'commit', 'values.length < n'", () => {
            let values = [];
            for (let i = 0; i < n - 1; i++) {
                values.push(ec.randomBN());
            }

            let randomness1 = ec.randomBN();
            let commitment1 = PedersenPublicKey_exec.commit(ec, global.pk, values, randomness1)[0];
            assert.equal(class_of(commitment1), "Commitment");

            let [commitment2, randomness2] = PedersenPublicKey_exec.commit(ec, global.pk, values);
            assert.equal(class_of(randomness2), "BN");
            assert.equal(class_of(commitment2), "Commitment");

        });

        it("Test of function 'verify'", () => {
            for (let i = 0; i <= 1; i++) {
                assert.isTrue(PedersenPublicKey_exec.verify(
                    ec,
                    global.pk,
                    global.values,
                    global.randomness[i],
                    global.commitment[i]
                ));
                assert.isFalse(PedersenPublicKey_exec.verify(
                    ec,
                    global.pk,
                    global.values,
                    global.randomness[i],
                    global.commitment[i ^ 1]
                ));
            }

        });
    });
    describe("Test of 'Commitment'", () => {
        it("Test of function 'mul'", () => {
            let c_mul = Commitment_exec.mul(global.commitment[0], global.commitment[1]);
            let values_mul = global.values.map((val) => val.muln(2).mod(ec.curve.n));
            let randomness_mul = global.randomness[0].add(global.randomness[1]).mod(ec.curve.n);
            assert.isTrue(PedersenPublicKey_exec.verify(ec, global.pk, values_mul, randomness_mul, c_mul));
            assert.isFalse(PedersenPublicKey_exec.verify(ec, global.pk, global.values, randomness_mul, c_mul));
        });

        it("Test of function 'pow'", () => {
            let e = ec.randomBN();
            let c_pow = Commitment_exec.pow(global.commitment[0], e);
            let values_pow = global.values.map((val) => val.modMul(e, ec.curve.n));
            let randomness_pow = global.randomness[0].modMul(e, ec.curve.n);
            assert.isTrue(PedersenPublicKey_exec.verify(ec, global.pk, values_pow, randomness_pow, c_pow));
            assert.isFalse(PedersenPublicKey_exec.verify(ec, global.pk, global.values, randomness_pow, c_pow));
        });
    });
});