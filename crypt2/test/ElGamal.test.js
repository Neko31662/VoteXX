const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { encodePoint } = require('../util/Serializer');

let chai = require('chai');
let assert = chai.assert;

describe("Test of 'ElGamal.js'", () => {
    let random_times = 50;
    let specialNumberList = [
        new BN(0),
        ec.curve.n,
    ];
    describe("Test of 'ElgamalEnc'", () => {
        describe("Test of function 'ElgamalEnc.encrypt' and 'ElgamalEnc.decrypt'", () => {
            it(`Ciphertext should be legal (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m = ec.randomPoint();
                    let c = ElgamalEnc.encrypt(ec, ec.genKeyPair().getPublic(), m);
                    assert.isTrue(ec.curve.validate(c.c1), "Ciphertext.c1 should be on the EC");
                    assert.isTrue(ec.curve.validate(c.c2), "Ciphertext.c2 should be on the EC");
                }
            });

            it(`Plaintext should be equivalent to itself after encryption and decryption (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m = ec.randomPoint();
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let c = ElgamalEnc.encrypt(ec, pk, m);
                    let m2 = ElgamalEnc.decrypt(ec, sk, c);

                    let m_encode = encodePoint(m);
                    let m2_encode = encodePoint(m2);
                    assert.equal(m_encode, m2_encode);
                }
            });

            it(`When the randomness is not specified, two ciphertexts of the same plaintext should be different (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m = ec.randomPoint();
                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();
                    let ctxt1 = ElgamalEnc.encrypt(ec, pk, m);
                    let ctxt2 = ElgamalEnc.encrypt(ec, pk, m);

                    let ctxt1_encode = { c1: encodePoint(ctxt1.c1), c2: encodePoint(ctxt1.c2) };
                    let ctxt2_encode = { c1: encodePoint(ctxt2.c1), c2: encodePoint(ctxt2.c2) };
                    assert.notEqual(ctxt1_encode.c1, ctxt2_encode.c1);
                    assert.notEqual(ctxt1_encode.c2, ctxt2_encode.c2);
                }
            });
        });
        describe("Test of function 'ElgamalEnc.encode' and 'ElgamalEnc.decode'", () => {
            it(`All points after encode must be on the EC (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let msg = ec.randomBN();
                    let encodeList = ElgamalEnc.encode(ec, msg);
                    assert.isTrue(encodeList.length > 0, "encodeList is empty!");
                    for (let p of encodeList) {
                        assert.isTrue(ec.curve.validate(p), `p = (${p.getX().toString(16)}, ${p.getY().toString(16)}) is not on the EC`);
                    }
                }
            });

            it(`Massage should be equivalent to itself after encode and decode (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let msg = ec.randomBN();
                    let encodeList = ElgamalEnc.encode(ec, msg);
                    let msg2 = ElgamalEnc.decode(ec, encodeList);
                    assert.isTrue(msg.eq(msg2));
                }
            });

            let max_length = 700;
            it(`Random massage in different length (1 ~ ${max_length} bits)`, () => {
                let msg = new BN(1);
                for (let i = 0; i < max_length; i++) {
                    let encodeList = ElgamalEnc.encode(ec, msg);
                    let msg2 = ElgamalEnc.decode(ec, encodeList);
                    assert.isTrue(encodeList.length > 0, "encodeList is empty!");
                    for (let p of encodeList) {
                        assert.isTrue(ec.curve.validate(p), `p = (${p.getX().toString(16)}, ${p.getY().toString(16)}) is not on the EC`);
                    }
                    assert.isTrue(msg.eq(msg2));
                    msg.ishln(1).iaddn(Math.random() < 0.5 ? 0 : 1);
                }
            });

            for (let i = 0; i < specialNumberList.length; i++) {
                it(`Test for special number msg = ${specialNumberList[i].toString(16)}`, () => {
                    let msg = specialNumberList[i];
                    let encodeList = ElgamalEnc.encode(ec, msg);
                    let msg2 = ElgamalEnc.decode(ec, encodeList);
                    assert.isTrue(encodeList.length > 0, "encodeList is empty!");
                    for (let p of encodeList) {
                        assert.isTrue(ec.curve.validate(p), `p = (${p.getX().toString(16)}, ${p.getY().toString(16)}) is not on the EC`);
                    }
                    assert.isTrue(msg.eq(msg2));
                });
            }
        });
    });

    describe("Test of 'ElgamalCiphertext_exec'", () => {
        it("No error thrown during function execution", () => {
            let m1 = ec.randomPoint();
            let m2 = ec.randomPoint();

            let keyPair = ec.genKeyPair();
            let pk = keyPair.getPublic();
            let sk = keyPair.getPrivate();

            let ctxt1 = ElgamalEnc.encrypt(ec, pk, m1);
            let ctxt2 = ElgamalEnc.encrypt(ec, pk, m2);

            ElgamalCiphertext_exec.mul(ctxt1, ec.randomBN());
            ElgamalCiphertext_exec.mul(ctxt1, new BN(0));

            ElgamalCiphertext_exec.add(ctxt1, ctxt2);

            ElgamalCiphertext_exec.neg(ctxt1);

            ElgamalCiphertext_exec.eq(ctxt1, ctxt2);

            ElgamalCiphertext_exec.identity(ec);

            ElgamalCiphertext_exec.random(ec);
        });

        describe("Test of function 'ElgamalCiphertext_exec.add'", () => {
            it(`Homomorphism of ElGamal ciphertext (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m1 = ec.randomPoint();
                    let m2 = ec.randomPoint();
                    let m3 = m1.add(m2);

                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();

                    let ctxt1 = ElgamalEnc.encrypt(ec, pk, m1);
                    let ctxt2 = ElgamalEnc.encrypt(ec, pk, m2);
                    let ctxt3 = ElgamalCiphertext_exec.add(ctxt1, ctxt2);

                    let m3_2 = ElgamalEnc.decrypt(ec, sk, ctxt3);
                    assert.isTrue(m3.eq(m3_2));
                }
            });
        });

        describe("Test of function 'ElgamalCiphertext_exec.eq'", () => {
            it(`When using different randomness, ciphertexts are not same (check ${random_times} times)`, () => {
                for (let i = 0; i < random_times; i++) {
                    let m1 = ec.randomPoint();

                    let keyPair = ec.genKeyPair();
                    let pk = keyPair.getPublic();
                    let sk = keyPair.getPrivate();

                    let r = ec.randomBN();

                    let ctxt1 = ElgamalEnc.encrypt(ec, pk, m1, r);
                    let ctxt2 = ElgamalEnc.encrypt(ec, pk, m1, r);
                    let ctxt3 = ElgamalEnc.encrypt(ec, pk, m1);

                    assert.isTrue(ElgamalCiphertext_exec.eq(ctxt1, ctxt2));
                    assert.isFalse(ElgamalCiphertext_exec.eq(ctxt1, ctxt3));
                }
            });
        });
    });
});

