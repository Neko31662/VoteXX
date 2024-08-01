const BN = require('../../primitiv/bn/bn');
const { transpose, vector_pow_vector, vector_pow_matrix } = require('./BasicFunction');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const assert = require('assert');
const { encodePoint } = require('../../util/Serializer');
const { MultiExponentiationArgument } = require('./MultiExponentiationArgument');
const { ProductArgument } = require('./ProductArgument');

class ShuffleArgument {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key 
     * @param {ElgamalCiphertext[][] | ElgamalCiphertext[][][]} input_ctxt_matrix the Elgamal ciphertext matrix before shuffle (n * m or n * m * l)
     * @param {ElgamalCiphertext[][] | ElgamalCiphertext[][][]} output_ctxt_matrix the Elgamal ciphertext matrix after shuffle (n * m or n * m * l)
     * @param {number[][]} pi_matrix A permutation from 1 to N (n*m)
     * @param {BN[][] | BN[][][]} rho_matrix A BN matrix of randomnesses using in re-encryption (n * m or n * m * l)
     */
    generateShuffleProof(
        ec,
        pk,
        ck,
        input_ctxt_matrix,
        output_ctxt_matrix,
        pi_matrix,
        rho_matrix,
    ) {
        let n = input_ctxt_matrix.length;
        let m = input_ctxt_matrix[0].length;
        let N = n * m;
        assert.ok(n > 0, "'n' should be greater than 0.");
        assert.ok(m > 0, "'m' should be greater than 0.");
        assert.ok(output_ctxt_matrix.length === n, "'output_ctxt_matrix.length' should be equal to n.");
        assert.ok(pi_matrix.length === n, "'pi_matrix.length' should be equal to n.");
        assert.ok(rho_matrix.length === n, "'rho_matrix.length' should be equal to n.");
        for (let i = 0; i < n; i++) {
            assert.ok(input_ctxt_matrix[i].length === m, `'input_ctxt_matrix[${i}].length' should be equal to m.`);
            assert.ok(output_ctxt_matrix[i].length === m, `'output_ctxt_matrix[${i}].length' should be equal to m.`);
            assert.ok(pi_matrix[i].length === m, `'pi_matrix[${i}].length' should be equal to m.`);
            assert.ok(rho_matrix[i].length === m, `'rho_matrix[${i}].length' should be equal to m.`);
        }
        let tmp = [];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                assert.ok((pi_matrix[i][j] > 0 && pi_matrix[i][j] <= N), "'pi_matrix' should be a permutation.");
                tmp[pi_matrix[i][j]] = 1;
            }
        }
        for (let i = 1; i <= N; i++) {
            assert.ok(tmp[i] === 1, "'pi_matrix' should be a permutation.");
        }

        let vector_flag = false;
        let l = 1;
        if (Array.isArray(input_ctxt_matrix[0][0])) {
            vector_flag = true;
            l = input_ctxt_matrix[0][0].length;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    assert.ok(input_ctxt_matrix[i][j].length === l, `'input_ctxt_matrix[${i}][${j}].length' should be equal to l (l=${l}).`);
                    assert.ok(output_ctxt_matrix[i][j].length === l, `'output_ctxt_matrix[${i}][${j}].length' should be equal to l (l=${l}).`);
                    assert.ok(rho_matrix[i][j].length === l, `'rho_matrix[${i}][${j}].length' should be equal to l (l=${l}).`);
                }
            }
        }

        let a_matrix = pi_matrix.map((value) => {
            return value.map((value) => {
                return new BN(value);
            });
        });

        let input_ctxt_matrix_T = transpose(input_ctxt_matrix);
        let output_ctxt_matrix_T = transpose(output_ctxt_matrix);
        let a_matrix_T = transpose(a_matrix);
        let rho_matrix_T = transpose(rho_matrix);

        let red = BN.red(ec.curve.n);

        let r_vector = [];
        for (let i = 0; i < m; i++) {
            r_vector[i] = ec.randomBN();
        }

        let c_A_vector = r_vector.map((value, index) => {
            return PedersenPublicKey_exec.commit(ec, ck, a_matrix_T[index], value)[0];
        });

        /*----- compute challenge x -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        if (!vector_flag) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    msg.push(encodePoint(input_ctxt_matrix[i][j].c1));
                    msg.push(encodePoint(input_ctxt_matrix[i][j].c2));
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    msg.push(encodePoint(output_ctxt_matrix[i][j].c1));
                    msg.push(encodePoint(output_ctxt_matrix[i][j].c2));
                }
            }
        } else {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        msg.push(encodePoint(input_ctxt_matrix[i][j][k].c1));
                        msg.push(encodePoint(input_ctxt_matrix[i][j][k].c2));
                    }
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        msg.push(encodePoint(output_ctxt_matrix[i][j][k].c1));
                        msg.push(encodePoint(output_ctxt_matrix[i][j][k].c2));
                    }
                }
            }
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        let redx = x.tryToRed(red);
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= N; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let b_matrix = pi_matrix.map((value) => {
            return value.map((value) => {
                return redx_pow_k[value];
            });
        });
        let b_matrix_T = transpose(b_matrix);

        let s_vector = [];
        for (let i = 0; i < m; i++) {
            s_vector[i] = ec.randomBN();
        }

        let c_B_vector = s_vector.map((value, index) => {
            return PedersenPublicKey_exec.commit(ec, ck, b_matrix_T[index], value)[0];
        });

        /*----- compute challenge y and z -----*/
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        let y = computeChallenge(msg, ec.curve.n);
        msg.push(y.toString(16));
        let z = computeChallenge(msg, ec.curve.n);
        /*-------------------------------------*/

        let redy = y.tryToRed(red);
        let redz = z.tryToRed(red);

        let negz = new BN(0).tryToRed(red).redSub(redz);
        let negz_vector = [];
        for (let i = 0; i < n; i++) {
            negz_vector[i] = negz;
        }
        let c_negz = PedersenPublicKey_exec.commit(ec, ck, negz_vector, new BN(0))[0];
        let c_negz_vector = [];
        for (let i = 0; i < m; i++) {
            c_negz_vector[i] = c_negz;
        }

        let PPst_c_A_vector = c_A_vector.map((value, index) => {
            let tmp = Commitment_exec.pow(value, y);
            tmp = Commitment_exec.mul(tmp, c_B_vector[index]);
            return Commitment_exec.mul(tmp, c_negz);
        });//PPst = ProductProof statement

        let PPst_b = new BN(1).tryToRed(red);
        tmp = negz;
        for (let i = 1; i <= N; i++) {
            tmp = tmp.redAdd(redy);
            PPst_b = PPst_b.redMul(redx_pow_k[i].redAdd(tmp));
        }

        let PPwt_A_matrix = a_matrix.map((value, i) => {
            return value.map((value, j) => {
                let tmp = value.tryToRed(red);
                tmp = tmp.redMul(redy);
                tmp = tmp.redAdd(b_matrix[i][j]);
                return tmp.redAdd(negz);
            });
        });//PPwt = ProductProof witness

        let PPwt_r_vector = r_vector.map((value, index) => {
            let tmp = value.tryToRed(red);
            tmp = tmp.redMul(redy);
            return tmp.redAdd(s_vector[index].tryToRed(red));
        });

        let ProductProof = ProductArgument.generateProductProof(
            ec,
            pk,
            ck,
            PPst_c_A_vector,
            PPst_b,
            PPwt_A_matrix,
            PPwt_r_vector
        );

        if (!vector_flag) {
            let MEPst_ctxt_matrix = transpose(output_ctxt_matrix);//MEPst = MultiExponentiationProof statement

            let MEPst_C = ElgamalCiphertext_exec.identity(ec);
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    k++;
                    let tmp = ElgamalCiphertext_exec.mul(input_ctxt_matrix[i][j], redx_pow_k[k]);
                    MEPst_C = ElgamalCiphertext_exec.add(MEPst_C, tmp);
                }
            }

            let MEPst_c_A_vector = c_B_vector;

            let MEPwt_A_matrix = b_matrix;//MEPwt = MultiExponentiationProof witness

            let MEPwt_r_vector = s_vector;

            let MEPwt_rho = new BN(0).tryToRed(red);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    let tmp = b_matrix[i][j].redMul(rho_matrix[i][j].tryToRed(red));
                    MEPwt_rho = MEPwt_rho.redSub(tmp);
                }
            }

            let MultiExponentiationProof = MultiExponentiationArgument.generateMultiExponentiationProof(
                ec,
                pk,
                ck,
                MEPst_ctxt_matrix,
                MEPst_C,
                MEPst_c_A_vector,
                MEPwt_A_matrix,
                MEPwt_r_vector,
                MEPwt_rho
            );

            return new ShuffleProof(c_A_vector, c_B_vector, ProductProof, MultiExponentiationProof);
        } else {
            let MEPst_c_A_vector = c_B_vector;

            let MEPwt_A_matrix = b_matrix;

            let MEPwt_r_vector = s_vector;

            let MultiExponentiationProof = [];

            for (let index = 0; index < l; index++) {
                let MEPst_ctxt_matrix = transpose(output_ctxt_matrix.map((value) => {
                    return value.map((value) => {
                        return value[index];
                    });
                }));

                let MEPst_C = ElgamalCiphertext_exec.identity(ec);
                let k = 0;
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < m; j++) {
                        k++;
                        let tmp = ElgamalCiphertext_exec.mul(input_ctxt_matrix[i][j][index], redx_pow_k[k]);
                        MEPst_C = ElgamalCiphertext_exec.add(MEPst_C, tmp);
                    }
                }

                let MEPwt_rho = new BN(0).tryToRed(red);
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < m; j++) {
                        let tmp = b_matrix[i][j].redMul(rho_matrix[i][j][index].tryToRed(red));
                        MEPwt_rho = MEPwt_rho.redSub(tmp);
                    }
                }

                MultiExponentiationProof[index] = MultiExponentiationArgument.generateMultiExponentiationProof(
                    ec,
                    pk,
                    ck,
                    MEPst_ctxt_matrix,
                    MEPst_C,
                    MEPst_c_A_vector,
                    MEPwt_A_matrix,
                    MEPwt_r_vector,
                    MEPwt_rho
                );
            }

            return new ShuffleProof(c_A_vector, c_B_vector, ProductProof, MultiExponentiationProof);
        }
    }

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk Elgamal public key
     * @param {PedersenPublicKey} ck Pedersen public key 
     * @param {ElgamalCiphertext[][] | ElgamalCiphertext[][][]} input_ctxt_matrix the Elgamal ciphertext matrix before shuffle (n * m or n * m * l)
     * @param {ElgamalCiphertext[][] | ElgamalCiphertext[][][]} output_ctxt_matrix the Elgamal ciphertext matrix after shuffle (n * m or n * m * l) 
     * @param {ShuffleProof} proof 
     */
    verifyShuffleProof(
        ec,
        pk,
        ck,
        input_ctxt_matrix,
        output_ctxt_matrix,
        proof
    ) {
        let { c_A_vector, c_B_vector, ProductProof, MultiExponentiationProof } = proof;

        let n = input_ctxt_matrix.length;
        let m = input_ctxt_matrix[0].length;
        let N = n * m;
        assert.ok(n > 0, "'n' should be greater than 0.");
        assert.ok(m > 0, "'m' should be greater than 0.");
        assert.ok(output_ctxt_matrix.length === n, "'output_ctxt_matrix.length' should be equal to n.");
        for (let i = 0; i < n; i++) {
            assert.ok(input_ctxt_matrix[i].length === m, `'input_ctxt_matrix[${i}].length' should be equal to m.`);
            assert.ok(output_ctxt_matrix[i].length === m, `'output_ctxt_matrix[${i}].length' should be equal to m.`);
        }
        assert.ok(c_A_vector.length === m, "'c_A_vector.length' should be equal to m.");
        assert.ok(c_B_vector.length === m, "'c_B_vector.length' should be equal to m.");

        let vector_flag = false;
        let l = 1;
        if (Array.isArray(input_ctxt_matrix[0][0])) {
            vector_flag = true;
            l = input_ctxt_matrix[0][0].length;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    assert.ok(input_ctxt_matrix[i][j].length === l, `'input_ctxt_matrix[${i}][${j}].length' should be equal to l (l=${l}).`);
                    assert.ok(output_ctxt_matrix[i][j].length === l, `'output_ctxt_matrix[${i}][${j}].length' should be equal to l (l=${l}).`);
                }
            }
        }

        let red = BN.red(ec.curve.n);

        /*----- compute challenge x -----*/
        let msg = [];
        msg.push(encodePoint(pk));
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        if (!vector_flag) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    msg.push(encodePoint(input_ctxt_matrix[i][j].c1));
                    msg.push(encodePoint(input_ctxt_matrix[i][j].c2));
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    msg.push(encodePoint(output_ctxt_matrix[i][j].c1));
                    msg.push(encodePoint(output_ctxt_matrix[i][j].c2));
                }
            }
        } else {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        msg.push(encodePoint(input_ctxt_matrix[i][j][k].c1));
                        msg.push(encodePoint(input_ctxt_matrix[i][j][k].c2));
                    }
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        msg.push(encodePoint(output_ctxt_matrix[i][j][k].c1));
                        msg.push(encodePoint(output_ctxt_matrix[i][j][k].c2));
                    }
                }
            }
        }
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_A_vector[i].commitment));
        }
        let x = computeChallenge(msg, ec.curve.n);
        /*-------------------------------*/

        /*----- compute challenge y and z -----*/
        for (let i = 0; i < m; i++) {
            msg.push(encodePoint(c_B_vector[i].commitment));
        }
        let y = computeChallenge(msg, ec.curve.n);
        msg.push(y.toString(16));
        let z = computeChallenge(msg, ec.curve.n);
        /*-------------------------------------*/

        let redx = x.tryToRed(red);
        let redy = y.tryToRed(red);
        let redz = z.tryToRed(red);
        
        let redx_pow_k = [];
        redx_pow_k[0] = new BN(1).tryToRed(red);
        for (let k = 1; k <= N; k++) {
            redx_pow_k[k] = redx_pow_k[k - 1].redMul(redx);
        }

        let negz = new BN(0).tryToRed(red).redSub(redz);
        let negz_vector = [];
        for (let i = 0; i < n; i++) {
            negz_vector[i] = negz;
        }
        let c_negz = PedersenPublicKey_exec.commit(ec, ck, negz_vector, new BN(0))[0];
        let c_negz_vector = [];
        for (let i = 0; i < m; i++) {
            c_negz_vector[i] = c_negz;
        }

        let PPst_c_A_vector = c_A_vector.map((value, index) => {
            let tmp = Commitment_exec.pow(value, y);
            tmp = Commitment_exec.mul(tmp, c_B_vector[index]);
            return Commitment_exec.mul(tmp, c_negz);
        });//PPst = ProductProof statement

        let PPst_b = new BN(1).tryToRed(red);
        let tmp = negz;
        for (let i = 1; i <= N; i++) {
            tmp = tmp.redAdd(redy);
            PPst_b = PPst_b.redMul(redx_pow_k[i].redAdd(tmp));
        }

        let invalidList = [];// debug
        let valid = true;
        let cur;

        cur = ProductArgument.verifyProductProof(
            ec,
            pk,
            ck,
            PPst_c_A_vector,
            PPst_b,
            ProductProof
        );
        valid &= cur;
        if (!cur) invalidList.push(1);

        if (!vector_flag) {
            let MEPst_ctxt_matrix = transpose(output_ctxt_matrix);//MEPst = MultiExponentiationProof statement

            let MEPst_C = ElgamalCiphertext_exec.identity(ec);
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    k++;
                    let tmp = ElgamalCiphertext_exec.mul(input_ctxt_matrix[i][j], redx_pow_k[k]);
                    MEPst_C = ElgamalCiphertext_exec.add(MEPst_C, tmp);
                }
            }

            let MEPst_c_A_vector = c_B_vector;

            cur = MultiExponentiationArgument.verifyMultiExponentiationProof(
                ec,
                pk,
                ck,
                MEPst_ctxt_matrix,
                MEPst_C,
                MEPst_c_A_vector,
                MultiExponentiationProof
            );

            valid &= cur;
            if (!cur) invalidList.push(2);
        } else {
            let MEPst_c_A_vector = c_B_vector;

            for (let index = 0; index < l; index++) {
                let MEPst_ctxt_matrix = transpose(output_ctxt_matrix.map((value) => {
                    return value.map((value) => {
                        return value[index];
                    });
                }));

                let MEPst_C = ElgamalCiphertext_exec.identity(ec);
                let k = 0;
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < m; j++) {
                        k++;
                        let tmp = ElgamalCiphertext_exec.mul(input_ctxt_matrix[i][j][index], redx_pow_k[k]);
                        MEPst_C = ElgamalCiphertext_exec.add(MEPst_C, tmp);
                    }
                }
                cur = MultiExponentiationArgument.verifyMultiExponentiationProof(
                    ec,
                    pk,
                    ck,
                    MEPst_ctxt_matrix,
                    MEPst_C,
                    MEPst_c_A_vector,
                    MultiExponentiationProof[index]
                );

                valid &= cur;
                if (!cur) invalidList.push(`2.${index}`);
            }
        }
        if (valid) return true;
        else return false;
    }
}

class ShuffleProof {
    constructor(
        c_A_vector,
        c_B_vector,
        ProductProof,
        MultiExponentiationProof
    ) {
        this.c_A_vector = c_A_vector;
        this.c_B_vector = c_B_vector;
        this.ProductProof = ProductProof;
        this.MultiExponentiationProof = MultiExponentiationProof;
    }
}

/**
 * Generate a random permutation from 1 to n
 * @param {number} n 
 * @returns {number[]}
 */
function generatePermutation(n) {
    let res = [];
    for (let i = 1; i <= n; i++) {
        res.push(i);
    }
    for (let i = n - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        let t = res[i];
        res[i] = res[j];
        res[j] = t;
    }
    return res;
}

/**
 * Re-encrypt and shuffle Elgamal ciphertexts
 * @param {EC} ec 
 * @param {Point} pk 
 * @param {ElgamalCiphertext[] | ElgamalCiphertext[][]} input_ctxts 
 * @param {number[]} permutation 
 * @returns {{ output_ctxts:ElgamalCiphertext[], rho_vector:BN[] } | { output_ctxts:ElgamalCiphertext[][], rho_vector:BN[][] }}
 */
function shuffle(ec, pk, input_ctxts, permutation) {
    let N = input_ctxts.length;
    assert.ok(permutation.length === N, "'permutation.length' should be equal to N.");
    let output_ctxts = [];
    let rho_vector = [];

    let vector_flag = false;
    if (Array.isArray(input_ctxts[0])) {
        vector_flag = true;
        l = input_ctxts[0].length;
        for (let i = 0; i < N; i++) {
            assert.ok(input_ctxts[i].length === l, `'input_ctxts[${i}].length' should be equal to l (l=${l}).`);
        }
    }

    let inf = ec.infinitePoint();
    if (!vector_flag) {
        for (let i = 0; i < N; i++) {
            rho_vector[i] = ec.randomBN();
            let tmp = ElgamalEnc.encrypt(ec, pk, inf, rho_vector[i]);
            output_ctxts[i] = ElgamalCiphertext_exec.add(input_ctxts[permutation[i] - 1], tmp);
        }
    } else {
        for (let i = 0; i < N; i++) {
            rho_vector[i] = [];
            output_ctxts[i] = [];
            for (let k = 0; k < l; k++) {
                rho_vector[i][k] = ec.randomBN();
                let tmp = ElgamalEnc.encrypt(ec, pk, inf, rho_vector[i][k]);
                output_ctxts[i][k] = ElgamalCiphertext_exec.add(input_ctxts[permutation[i] - 1][k], tmp);
            }
        }
    }

    return { output_ctxts, rho_vector };
}

/**
 * Convert vectors of length N into n * m matrices, 
 * where m is designated and n is the smallest integer that makes n * m >= N.
 * 
 * When N < n * m, set all redundant Elgamal ciphertexts to (1, 1), 
 * set all redundant rhos to 0, 
 * and set the kth place of pi_matrix to k (k > n * m).
 * @param {ElgamalCiphertext[] | ElgamalCiphertext[][]} input_ctxts 
 * @param {ElgamalCiphertext[] | ElgamalCiphertext[][]} output_ctxts 
 * @param {number[]} permutation 
 * @param {BN[] | BN[][]} rho_vector 
 * @param {number} m 
 * @returns {{ input_ctxt_matrix:ElgamalCiphertext[][], output_ctxt_matrix:ElgamalCiphertext[][], pi_matrix:number[][], rho_matrix:BN[][] } |
 * { input_ctxt_matrix:ElgamalCiphertext[][][], output_ctxt_matrix:ElgamalCiphertext[][][], pi_matrix:number[][], rho_matrix:BN[][][] }} 
 */
function matrixization(input_ctxts, output_ctxts, permutation, rho_vector, m) {
    assert.ok(m >= 2, "'m' should be at least 2.");
    let N = input_ctxts.length;
    assert.ok(output_ctxts.length === N, "'output_ctxts.length' should be equal to N.");
    assert.ok(permutation.length === N, "'permutation.length' should be equal to N.");
    assert.ok(rho_vector.length === N, "'rho_vector.length' should be equal to N.");

    let l = 1;
    if (Array.isArray(input_ctxts[0])) {
        l = input_ctxts[0].length;
    }

    let n = Math.ceil(N / m);
    let k = 0;
    let input_ctxt_matrix = [], output_ctxt_matrix = [], pi_matrix = [], rho_matrix = [];
    for (let i = 0; i < n; i++) {
        input_ctxt_matrix[i] = [];
        output_ctxt_matrix[i] = [];
        pi_matrix[i] = [];
        rho_matrix[i] = [];
        for (let j = 0; j < m; j++) {
            if (k < N) {
                input_ctxt_matrix[i][j] = input_ctxts[k];
                output_ctxt_matrix[i][j] = output_ctxts[k];
                pi_matrix[i][j] = permutation[k];
                rho_matrix[i][j] = rho_vector[k];
            } else {
                if (l == 1) {
                    input_ctxt_matrix[i][j] = ElgamalCiphertext_exec.identity();
                    output_ctxt_matrix[i][j] = ElgamalCiphertext_exec.identity();
                    rho_matrix[i][j] = new BN(0);
                } else {
                    input_ctxt_matrix[i][j] = [];
                    output_ctxt_matrix[i][j] = [];
                    rho_matrix[i][j] = [];
                    for (let l0 = 0; l0 < l; l0++) {
                        input_ctxt_matrix[i][j][l0] = ElgamalCiphertext_exec.identity();
                        output_ctxt_matrix[i][j][l0] = ElgamalCiphertext_exec.identity();
                        rho_matrix[i][j][l0] = new BN(0);
                    }
                }
                pi_matrix[i][j] = k + 1;
            }
            k++;
        }
    }
    return { input_ctxt_matrix, output_ctxt_matrix, pi_matrix, rho_matrix };
}

module.exports = {
    ShuffleArgument: new ShuffleArgument(),
    ShuffleProof,
    generatePermutation,
    shuffle,
    matrixization
};