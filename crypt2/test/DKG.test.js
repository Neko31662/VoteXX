const BN = require('bn.js');
let ec = require('../primitiv/ec/ec');
const { DKG, DKG_exec } = require('../protocol/DKG/DKG');
const { ElgamalEnc } = require('../primitiv/encryption/ElGamal');

let chai = require('chai');
let assert = chai.assert;

let N = 5;
let parties = Array(N);
for (let i = 0; i < N; i++) {
    parties[i] = new DKG(N, i);
}

let global = {};

describe(`Test of 'DKG.js', ${N} parties.`, () => {
    it("Test of function 'generateKey'", () => {
        for (let i = 0; i < N; i++) {
            DKG_exec.generateKey(ec, parties[i]);
            assert.ok(parties[i].xi, "'xi' should be truthy");
            assert.ok(parties[i].yi, "'yi' should be truthy");
            assert.isTrue(parties[i].yi.eq(ec.curve.g.mul(parties[i].xi)), "'yi' should equal to g^'xi'");
        }
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                assert.isFalse(parties[i].xi.eq(parties[j].xi), `Party ${i} and party ${j} has the same 'xi', it's nearly impossible`);
            }
        }
    });

    it("Test of function 'generateDKGProof'", () => {
        for (let i = 0; i < N; i++) {
            DKG_exec.generateDKGProof(ec, parties[i]);
            assert.ok(parties[i].DKGProof, "'DKGProof' should be truthy");
            assert.ok(parties[i].DKGProof.a, "'DKGProof.a' should be truthy");
            assert.ok(parties[i].DKGProof.z, "'DKGProof.z' should be truthy");
        }
    });

    it("Test of function 'verifyDKGProof'", () => {
        for (let i = 0; i < N; i++) {
            assert.isTrue(DKG_exec.verifyDKGProof(ec, parties[i].DKGProof, parties[i].yi), "Proof should be valid");
        }
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                assert.isFalse(DKG_exec.verifyDKGProof(ec, parties[i].DKGProof, parties[j].yi), "Proof should be invalid");
            }
        }
    });

    it("Test of function 'calculatePublic'", () => {
        let yiList = parties.map((value) => value.yi);
        for (let i = 0; i < N; i++) {
            DKG_exec.calculatePublic(ec, yiList, parties[i]);
            assert.ok(parties[i].yiList, "'yiList' should be truthy");
            assert.ok(parties[i].y, "'y' should be truthy");
        }
        for (let i = 0; i < N - 1; i++) {
            assert.isTrue(parties[i].y.eq(parties[i + 1].y), "Each party should generate the same public key");
        }
        let pub = ec.curve.point(parties[0].y.getX(), parties[0].y.getY());
        for (let i = 0; i < N; i++) {
            pub = pub.add(parties[i].yi.neg());
        }
        assert.isTrue(pub.isInfinity(), "The public key should be equal to the sum of 'yi'");
    });

    it("Test of function 'decryptOnePartWithProof'", () => {
        global.pubKey = parties[0].y;
        global.msg = ec.randomPoint();
        global.ciphertext = ElgamalEnc.encrypt(ec, global.pubKey, global.msg);
        global.kiList = Array(N);
        global.proofList = Array(N);

        for (let i = 0; i < N; i++) {
            [global.kiList[i], global.proofList[i]] = DKG_exec.decryptOnePartWithProof(ec, parties[i], global.ciphertext);
            assert.ok(global.kiList[i], "'ki' should be truthy");
            assert.ok(global.proofList[i], "'proof' should be truthy");
        }
    });

    it("Test of function 'verifyDecryptProof'", () => {
        for (let i = 0; i < N; i++) {
            assert.isTrue(DKG_exec.verifyDecryptProof(
                ec,
                parties[i],
                global.proofList[i],
                global.ciphertext,
                global.kiList[i]
            ), "Proof should be valid");
        }
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                assert.isFalse(DKG_exec.verifyDecryptProof(
                    ec,
                    parties[i],
                    global.proofList[j],
                    global.ciphertext,
                    global.kiList[i]
                ), "Proof should be invalid");
            }
        }
    });

    it("Test of function 'decrypt'", () => {
        let msg2 = DKG_exec.decrypt(ec, global.ciphertext, global.kiList);
        assert.isTrue(global.msg.eq(msg2), "'msg2' should be equal to 'msg'");
    });
});