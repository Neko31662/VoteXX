const BN = require('../../primitiv/bn/bn');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');

/**
 * This function DO NOT deep copy elements.
 * 
 * Convert a two-dimensional array
 * 
 * [ [a11, a12, ..., a1m], ..., [an1, an2, ..., anm] ]
 * 
 * to
 * 
 * [ [a11, a21, ..., an1], ..., [a1m, a2m, ..., anm] ].
 * 
 * @param {Array[]} matrix 
 * @return {Array[]}
 */
function transpose(matrix) {
    let n = matrix.length;
    if (n == 0) {
        return [];
    }
    let m = matrix[0].length;
    for (let i = 1; i < n; i++) {
        if (matrix[i].length != m) {
            throw new Error("Not a matrix");
        }
    }

    let res = [];
    for (let i = 0; i < m; i++) {
        res[i] = [];
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            res[j][i] = matrix[i][j];
        }
    }
    return res;
}

/**
 * Input ctxt_vec = [C1, C2, ..., Cn]
 * and e_vec = [e1, e2, ..., en]
 * 
 * Output res = (C1^e1) · (C2^e2) · ... · (Cn^en)
 * @param {ElgamalCiphertext[]} ctxt_vec 
 * @param {BN[]} e_vec 
 * @returns {ElgamalCiphertext}
 */
function vector_pow_vector(ctxt_vec, e_vec) {
    if (ctxt_vec.length !== e_vec.length) {
        throw new Error("'ctxt_vec' and 'e_vec' should have the same length");
    }
    if (ctxt_vec.length === 0) {
        throw new Error("Empty array");
    }

    let n = ctxt_vec.length;
    let res = null;
    for (let i = 0; i < n; i++) {
        let cur = ElgamalCiphertext_exec.mul(ctxt_vec[i], e_vec[i]);
        if (i == 0) {
            res = cur;
        } else {
            res = ElgamalCiphertext_exec.add(res, cur);
        }
    }
    return res;
}

/**
 * Input ctxt_vec = [C1, C2, ..., Cn]
 * and e_mat = [ [e11, e12, ..., e1m], ..., [en1, en2, ..., enm] ]
 * 
 * Output res = [ctxt_vec^(e11, ..., en1), ..., ctxt_vec^(e1m, ..., enm)]
 * 
 * @param {ElgamalCiphertext[]} ctxt_vec 
 * @param {BN[][]} e_mat 
 * @returns {ElgamalCiphertext[]}
 */
function vector_pow_matrix(ctxt_vec, e_mat) {
    let e_mat_T = transpose(e_mat);
    let res = e_mat_T.map((value) => vector_pow_vector(ctxt_vec, value));
    return res;
}

module.exports = {
    transpose,
    vector_pow_vector,
    vector_pow_matrix,
};