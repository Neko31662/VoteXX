const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');

class HadamardProductArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key
     * @param {Commitment[]} c_A_vector A Pedersen commitment vector (length = m)
     * @param {Commitment} c_b A Pedersen commitment
     * @param {BN[][]} A_matrix A BN matrix (n*m)
     * @param {BN[]} r_vector A BN vector (length = m)
     * @param {BN[]} b_vector A BN vector (length = n)
     * @param {BN} s A BN
     */
    generateHadamardProductProof(
        ec,
        pk,
        ck,
        c_A_vector,
        c_b,
        A_matrix,
        r_vector,
        b_vector,
        s
    ) {
        let n = A_matrix.length;
        let m = r_vector.length;
        for (let i = 0; i < n; i++) {
            assert.ok(A_matrix[i].length === m, `'A_matrix[${i}].length' should be equal to m.`);
        }
        assert.ok(b_vector.length === n, "'b_vector.length' should be equal to n.");
        assert.ok(c_A_vector.length === m, "'c_A_vector.length' should be equal to m.");

        let A_matrix_T = transpose(A_matrix);

        let red = BN.red(ec.curve.n);
        let B_matrix = [];
        B_matrix[0] = A_matrix_T[0].map((value) => value.tryToRed(red));;
        for (let i = 1; i < m; i++) {
            B_matrix[i] = [];
            for (let j = 0; j < n; j++) {
                B_matrix[i][j] = B_matrix[i - 1][j].redMul(A_matrix_T[i][j].tryToRed(red));
            }
        }

        let { s_vector } = this.generateInitialMessage(ec, m, r_vector, s);
        let c_B_vector = [];
        c_B_vector[0] = c_A_vector[0];
        for (let i = 1; i < m - 1; i++) {
            c_B_vector[i] = PedersenPublicKey_exec.commit(ec, ck, B_matrix[i], s_vector[i])[0];
        }
        c_B_vector[m - 1] = c_b;

        /*----- compute challenge -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        for (let i = 0; i < c_A_vector.length; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        msg.push(encodePoint(c_b.commitment));
        for (let i = 1; i < m - 1; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        msg.push(x.toString(16));
        let y = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/
    }

    /**
     * 
     * @param {EC} ec 
     * @param {number} m 
     * @param {BN[]} r_vector 
     * @param {BN} s 
     * @returns {BN[]}
     */
    generateInitialMessage(ec, m, r_vector, s) {
        let s_vector = [];
        s_vector[0] = r_vector[0].clone();
        for (let i = 1; i < m - 1; i++) {
            s_vector[i] = ec.randomBN();
        }
        s_vector[m - 1] = s.clone();
        return { s_vector };
    }
}

class HadamardProductProof {

}