const BN = require('../../primitiv/bn/bn');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { LiftedElgamalEnc } = require('../../primitiv/encryption/LiftedElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const assert = require('assert');

/**
 * @typedef {import('../../primitiv/encryption/ElGamal').ElgamalCiphertext} ElgamalCiphertext
 */

class MixAndMatch {
    /**
     * Generate a encrypted truth table,
     * a '0' bit is represented by the plaintext value g^0,
     * a '1' bit is represented by the plaintext value g.
     * @param {EC} ec 
     * @param {Point} pk 
     * @param {'or' | 'and' | 'xor' | 'xnor' | Boolean[][]} tableType 
     * @returns {ElgamalCiphertext[][]}
     */
    generateTruthTable(ec, pk, tableType) {
        let plainTruthTable = [];
        if (typeof tableType === 'string') {
            let str = tableType.toLowerCase();
            let func = null;
            switch (str) {
                case "or":
                    func = (a, b) => Boolean(a | b);
                    break;
                case "and":
                    func = (a, b) => Boolean(a & b);
                    break;
                case "xor":
                    func = (a, b) => Boolean(a ^ b);
                    break;
                case "xnor":
                    func = (a, b) => Boolean(!(a ^ b));
                    break;
                default:
                    throw new Error("Invalid operation name.");
            }
            for (let i = 0; i < 4; i++) {
                plainTruthTable[i] = [];
            }
            plainTruthTable[0][0] = 0, plainTruthTable[0][1] = 0;
            plainTruthTable[1][0] = 0, plainTruthTable[1][1] = 1;
            plainTruthTable[2][0] = 1, plainTruthTable[2][1] = 0;
            plainTruthTable[3][0] = 1, plainTruthTable[3][1] = 1;
            for (let i = 0; i < 4; i++) {
                plainTruthTable[i][2] = func(plainTruthTable[i][0], plainTruthTable[i][1]);
            }
        } else if (Array.isArray(tableType)) {
            assert.ok(tableType.length === 4);
            for (let i = 0; i < 4; i++) {
                assert.ok(tableType[i].length === 3);
            }
            for (let i = 0; i < 4; i++) {
                plainTruthTable[i] = [];
                for (let j = 0; j < 3; j++) {
                    plainTruthTable[i][j] = Boolean(tableType[i][j]);
                }
            }
            let tmp = [];
            for (let i = 0; i < 4; i++) {
                let index = plainTruthTable[i][0] * 2 + plainTruthTable[i][1];
                tmp[index] = 1;
            }
            for (let i = 0; i < 4; i++) {
                assert.ok(tmp[i] === 1, "It's not a truth table.");
            }
        }

        let encryptedTruthTable = [];
        let inf = ec.infinitePoint();
        for (let i = 0; i < 4; i++) {
            encryptedTruthTable[i] = [];
            for (let j = 0; j < 3; j++) {
                let m = plainTruthTable[i][j] ? ec.curve.g : inf;
                encryptedTruthTable[i][j] = ElgamalEnc.encrypt(ec, pk, m, new BN(1));
            }
        }
        return encryptedTruthTable;
    }
}

module.exports = {
    /**
     * Usage: 
     * 
     * Step1: Assign the truth table and invoke in 'generateTruthTable'
     * to generate an encrypted truth table.
     * 
     * Step2: Each player shuffles the encrypted truth table sequentially
     * (Use the protocol in 'rootpath/protocol/shuffle_argument/ShuffleArgument.js').
     * 
     * Step3: For each row i in the truth table T, Invoke in the PET protocol to check
     * whether PET(T[i][0],input0) == 1 && PET(T[i][1],input1) == 1.
     * 
     * Step4: For line p that passed the test in step3, T[p][2] is the output.
     */
    MixAndMatch: new MixAndMatch()
};