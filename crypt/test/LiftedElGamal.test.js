const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { LiftedElgamalEnc } = require('../primitiv/encryption/LiftedElGamal');
const { encodePoint } = require('../util/Serializer');

let chai = require('chai');
let assert = chai.assert;

describe("Test of 'ElGamal.js'", () => {
    let random_times = 50;
    let min_val = -100;
    let max_val = 100;
    let specialNumberList = [
        min_val,
        max_val,
        max_val + 1,
        min_val - 1,
    ];

    describe("Test of 'LiftedElgamalEnc'", () => {
        describe("Test of function 'LiftedElgamalEnc.encrypt' and 'LiftedElgamalEnc.decrypt'", () => {
            it(`Plaintext should be equivalent to itself after encryption and decryption (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m = Math.floor(Math.random() * (max_val - min_val + 1)) + min_val;
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let c = LiftedElgamalEnc.encrypt(ec, pk, m);
                    let m2 = LiftedElgamalEnc.decrypt(ec, sk, c, min_val, max_val);

                    assert.equal(m, m2);
                }
                for (let m of specialNumberList) {
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let c = LiftedElgamalEnc.encrypt(ec, pk, m);
                    let m2 = LiftedElgamalEnc.decrypt(ec, sk, c, min_val, max_val);

                    if (m <= max_val && m >= min_val) {
                        assert.equal(m, m2);
                    } else {
                        assert.equal(false, m2);
                    }
                }
            });

            it(`When the randomness is not specified, two ciphertexts of the same plaintext should be different (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m = Math.floor(Math.random() * (max_val - min_val + 1)) + min_val;
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let ctxt1 = LiftedElgamalEnc.encrypt(ec, pk, m);
                    let ctxt2 = LiftedElgamalEnc.encrypt(ec, pk, m);

                    let ctxt1_encode = { c1: encodePoint(ctxt1.c1), c2: encodePoint(ctxt1.c2) };
                    let ctxt2_encode = { c1: encodePoint(ctxt2.c1), c2: encodePoint(ctxt2.c2) };
                    assert.notEqual(ctxt1_encode.c1, ctxt2_encode.c1);
                    assert.notEqual(ctxt1_encode.c2, ctxt2_encode.c2);
                }
            });

            it(`The homomorphism (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m1 = Math.floor(Math.random() * (max_val - min_val + 1)) + min_val;
                    let m2 = Math.floor(Math.random() * (21)) + (-10);
                    if (m1 + m2 < min_val || m1 + m2 > max_val) {
                        i--;
                        continue;
                    }
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let c1 = LiftedElgamalEnc.encrypt(ec, pk, m1);
                    let c2 = LiftedElgamalEnc.encrypt(ec, pk, m2);
                    let c3 = ElgamalCiphertext_exec.add(c1, c2);
                    let m3 = LiftedElgamalEnc.decrypt(ec, sk, c3, min_val, max_val);

                    assert.equal(m1 + m2, m3);
                }
            });
        });
    });
});