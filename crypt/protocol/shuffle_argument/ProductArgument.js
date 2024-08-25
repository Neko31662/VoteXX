const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');
const { HadamardProductArgument } = require('./HadamardProductArgument');
const { SingleValueProductArgument } = require('./SingleValueProductArgument');

class ProductArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m) 
     * @param {BN} b A BN
     * @param {BN[][]} A_matrix A BN matrix (n*m)
     * @param {BN[]} r_vector A BN vector (length = m)
     * @returns {ProductProof}
     */
    generateProductProof(
        ec,
        pk,
        ck,
        c_A_vector,
        b,
        A_matrix,
        r_vector
    ) {
        let n = A_matrix.length;
        let m = c_A_vector.length;
        assert.ok(r_vector.length === m, "'r_vector.length' should be equal to m.");
        for (let i = 0; i < n; i++) {
            assert.ok(A_matrix[i].length === m, `'A_matrix[${i}].length' should be equal to m.`);
        }

        let red = BN.red(ec.curve.n);
        let s = ec.randomBN();
        let tmp_vector = [];
        for (let i = 0; i < n; i++) {
            let tmp = new BN(1).tryToRed(red);
            for (let j = 0; j < m; j++) {
                tmp = tmp.redMul(A_matrix[i][j].tryToRed(red));
            }
            tmp_vector[i] = tmp;
        }
        let c_b = PedersenPublicKey_exec.commit(ec, ck, tmp_vector, s)[0];

        let HadamardProductProof = HadamardProductArgument.generateHadamardProductProof(
            ec,
            pk,
            ck,
            c_A_vector,
            c_b,
            A_matrix,
            r_vector,
            tmp_vector,
            s
        );

        let SingleValueProductProof = SingleValueProductArgument.generateSingleValueProductProof(
            ec,
            pk,
            ck,
            c_b,
            b,
            tmp_vector,
            s
        );

        let proof = new ProductProof(c_b, HadamardProductProof, SingleValueProductProof);
        return proof;
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m) 
     * @param {BN} b A BN
     * @param {ProductProof} proof 
     * @returns {Boolean}
     */
    verifyProductProof(
        ec,
        pk,
        ck,
        c_A_vector,
        b,
        proof
    ) {
        let {c_b, HadamardProductProof, SingleValueProductProof} = proof;

        let invalidList = [];// debug
        let valid = true;
        let cur;

        cur = HadamardProductArgument.verifyHadamardProductProof(
            ec,
            pk,
            ck,
            c_A_vector,
            c_b,
            HadamardProductProof
        );
        valid &= cur;
        if (!cur) invalidList.push(1);

        cur = SingleValueProductArgument.verifySingleValueProductProof(
            ec,
            pk,
            ck,
            c_b,
            b,
            SingleValueProductProof
        )
        valid &= cur;
        if (!cur) invalidList.push(2);

        if (valid) return true;
        else return false;
    }
}

class ProductProof {
    constructor(c_b, HadamardProductProof, SingleValueProductProof) {
        this.c_b = c_b;
        this.HadamardProductProof = HadamardProductProof;
        this.SingleValueProductProof = SingleValueProductProof;
    }
}

module.exports = {
    ProductArgument: new ProductArgument(),
    ProductProof
};