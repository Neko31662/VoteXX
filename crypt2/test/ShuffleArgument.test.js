const BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
const { generatePermutation, shuffle, transformToMatrix, ShuffleArgument, VerifiableShuffle } = require('../protocol/shuffle_argument/ShuffleArgument');
const { ElgamalCiphertext_exec, ElgamalEnc } = require('../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment_exec } = require('../primitiv/commitment/pedersen_commitment');
const { transpose } = require('../protocol/shuffle_argument/BasicFunction');
const { serialize, deserialize } = require('../util/Serializer');

let chai = require('chai');
let assert = chai.assert;
let n = 2, m = 2, l = 5;

describe(`Test of 'ShuffleArgument.js', n=${n}, m=${m}.`, function () {

    describe('m divides N, input_ctxts[i] consists of a single Elgamal ciphertext.', function () {
        this.timeout(Math.max(4000, n * m * m * 10));
        let global = {};
        let keyPair = ec.genKeyPair();
        let pk = keyPair.getPublic();
        let sk = keyPair.getPrivate();
        let ck = new PedersenPublicKey(ec, n);

        let N = n * m;
        let msg = [];
        global.input_ctxts = [];
        for (let i = 0; i < N; i++) {
            msg[i] = ec.randomPoint();
            global.input_ctxts[i] = ElgamalEnc.encrypt(ec, pk, msg[i]);
        }

        it("Test of 'generatePermutation'", () => {
            let permutation = generatePermutation(N);
            assert.isTrue(permutation.length === N);
            let tmp = [];
            for (let i = 0; i < N; i++) {
                tmp[permutation[i]] = 1;
            }
            for (let i = 1; i <= N; i++) {
                assert.isTrue(tmp[i] === 1);
            }
            global.permutation = permutation;
        });

        it("Test of 'shuffle'", () => {
            let { output_ctxts, rho_vector } = shuffle(ec, pk, global.input_ctxts, global.permutation);
            assert.isTrue(output_ctxts.length === N, "'output_ctxts.length' should be N.");
            assert.isTrue(rho_vector.length === N, "'rho_vector.length' should be N.");
            for (let i = 0; i < N; i++) {
                let res = ElgamalEnc.decrypt(ec, sk, output_ctxts[i]);
                let original_msg = msg[global.permutation[i] - 1];
                assert.isTrue(res.eq(original_msg), "'res' should be equal to the original message.");
            }
            global.output_ctxts = output_ctxts;
            global.rho_vector = rho_vector;
        });

        it("Test of 'transformToMatrix'", () => {
            let { input_ctxt_matrix, output_ctxt_matrix, pi_matrix, rho_matrix } = transformToMatrix(
                ec,
                global.input_ctxts,
                global.output_ctxts,
                global.permutation,
                global.rho_vector,
                m
            );
            assert.isTrue(input_ctxt_matrix.length === n);
            assert.isTrue(output_ctxt_matrix.length === n);
            assert.isTrue(pi_matrix.length === n);
            assert.isTrue(rho_matrix.length === n);
            for (let i = 0; i < n; i++) {
                assert.isTrue(input_ctxt_matrix[i].length === m);
                assert.isTrue(output_ctxt_matrix[i].length === m);
                assert.isTrue(pi_matrix[i].length === m);
                assert.isTrue(rho_matrix[i].length === m);
            }
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    assert.isTrue(input_ctxt_matrix[i][j] == global.input_ctxts[k]);
                    assert.isTrue(output_ctxt_matrix[i][j] == global.output_ctxts[k]);
                    assert.isTrue(pi_matrix[i][j] == global.permutation[k]);
                    assert.isTrue(rho_matrix[i][j] == global.rho_vector[k]);
                    k++;
                }
            }
            global.input_ctxt_matrix = input_ctxt_matrix;
            global.output_ctxt_matrix = output_ctxt_matrix;
            global.pi_matrix = pi_matrix;
            global.rho_matrix = rho_matrix;
        });

        it("Test of 'ShuffleArgument.generateShuffleProof'", () => {
            global.proof = ShuffleArgument.generateShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.pi_matrix,
                global.rho_matrix
            );
        });

        it("Test of 'ShuffleArgument.verifyShuffleProof'", () => {
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.proof
            ));
        });

        it("Test of 'VerifiableShuffle.shuffleWithProof'", () => {
            let tmp = VerifiableShuffle.shuffleWithProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                m
            );
            global.output_ctxts2 = tmp.output_ctxts;
            global.proof2 = tmp.proof;
        });

        it("Test of 'VerifiableShuffle.verifyProof'", () => {
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                global.output_ctxts2,
                global.proof2,
                m
            ));
        });

        it("Test of serialization", () => {
            let input_ctxt_matrix = deserialize(serialize(global.input_ctxt_matrix), ec);
            let output_ctxt_matrix = deserialize(serialize(global.output_ctxt_matrix), ec);
            let proof = deserialize(serialize(global.proof), ec);
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                input_ctxt_matrix,
                output_ctxt_matrix,
                proof
            ));

            let input_ctxts = deserialize(serialize(global.input_ctxts), ec);
            let output_ctxts2 = deserialize(serialize(global.output_ctxts2), ec);
            let proof2 = deserialize(serialize(global.proof2), ec);
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                input_ctxts,
                output_ctxts2,
                proof2,
                m
            ));
        });
    });

    describe('N = (n - 1) * m + 1, input_ctxts[i] consists of a single Elgamal ciphertext.', function () {
        this.timeout(Math.max(4000, n * m * m * 10));
        let global = {};
        let keyPair = ec.genKeyPair();
        let pk = keyPair.getPublic();
        let sk = keyPair.getPrivate();
        let ck = new PedersenPublicKey(ec, n);

        let N = (n - 1) * m + 1;
        let msg = [];
        global.input_ctxts = [];
        for (let i = 0; i < N; i++) {
            msg[i] = ec.randomPoint();
            global.input_ctxts[i] = ElgamalEnc.encrypt(ec, pk, msg[i]);
        }

        it("Test of 'generatePermutation'", () => {
            let permutation = generatePermutation(N);
            assert.isTrue(permutation.length === N);
            let tmp = [];
            for (let i = 0; i < N; i++) {
                tmp[permutation[i]] = 1;
            }
            for (let i = 1; i <= N; i++) {
                assert.isTrue(tmp[i] === 1);
            }
            global.permutation = permutation;
        });

        it("Test of 'shuffle'", () => {
            let { output_ctxts, rho_vector } = shuffle(ec, pk, global.input_ctxts, global.permutation);
            assert.isTrue(output_ctxts.length === N, "'output_ctxts.length' should be N.");
            assert.isTrue(rho_vector.length === N, "'rho_vector.length' should be N.");
            for (let i = 0; i < N; i++) {
                let res = ElgamalEnc.decrypt(ec, sk, output_ctxts[i]);
                let original_msg = msg[global.permutation[i] - 1];
                assert.isTrue(res.eq(original_msg), "'res' should be equal to the original message.");
            }
            global.output_ctxts = output_ctxts;
            global.rho_vector = rho_vector;
        });

        it("Test of 'transformToMatrix'", () => {
            let { input_ctxt_matrix, output_ctxt_matrix, pi_matrix, rho_matrix } = transformToMatrix(
                ec,
                global.input_ctxts,
                global.output_ctxts,
                global.permutation,
                global.rho_vector,
                m
            );

            global.input_ctxt_matrix = input_ctxt_matrix;
            global.output_ctxt_matrix = output_ctxt_matrix;
            global.pi_matrix = pi_matrix;
            global.rho_matrix = rho_matrix;

            assert.isTrue(input_ctxt_matrix.length === n);
            assert.isTrue(output_ctxt_matrix.length === n);
            assert.isTrue(pi_matrix.length === n);
            assert.isTrue(rho_matrix.length === n);
            for (let i = 0; i < n; i++) {
                assert.isTrue(input_ctxt_matrix[i].length === m);
                assert.isTrue(output_ctxt_matrix[i].length === m);
                assert.isTrue(pi_matrix[i].length === m);
                assert.isTrue(rho_matrix[i].length === m);
            }
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (k < N) {
                        assert.isTrue(input_ctxt_matrix[i][j] == global.input_ctxts[k]);
                        assert.isTrue(output_ctxt_matrix[i][j] == global.output_ctxts[k]);
                        assert.isTrue(pi_matrix[i][j] == global.permutation[k]);
                        assert.isTrue(rho_matrix[i][j] == global.rho_vector[k]);
                    } else {
                        assert.isTrue(input_ctxt_matrix[i][j].c1.eq(ec.infinitePoint()));
                        assert.isTrue(input_ctxt_matrix[i][j].c2.eq(ec.infinitePoint()));
                        assert.isTrue(output_ctxt_matrix[i][j].c1.eq(ec.infinitePoint()));
                        assert.isTrue(output_ctxt_matrix[i][j].c2.eq(ec.infinitePoint()));
                        assert.isTrue(pi_matrix[i][j] === k + 1);
                        assert.isTrue(rho_matrix[i][j].eq(new BN(0)));
                    }
                    k++;
                }
            }
        });

        it("Test of 'ShuffleArgument.generateShuffleProof'", () => {
            global.proof = ShuffleArgument.generateShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.pi_matrix,
                global.rho_matrix
            );
        });

        it("Test of 'ShuffleArgument.verifyShuffleProof'", () => {
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.proof
            ));
        });

        it("Test of 'VerifiableShuffle.shuffleWithProof'", () => {
            let tmp = VerifiableShuffle.shuffleWithProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                m
            );
            global.output_ctxts2 = tmp.output_ctxts;
            global.proof2 = tmp.proof;
        });

        it("Test of 'VerifiableShuffle.verifyProof'", () => {
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                global.output_ctxts2,
                global.proof2,
                m
            ));
        });

        it("Test of serialization", () => {
            let input_ctxt_matrix = deserialize(serialize(global.input_ctxt_matrix), ec);
            let output_ctxt_matrix = deserialize(serialize(global.output_ctxt_matrix), ec);
            let proof = deserialize(serialize(global.proof), ec);
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                input_ctxt_matrix,
                output_ctxt_matrix,
                proof
            ));

            let input_ctxts = deserialize(serialize(global.input_ctxts), ec);
            let output_ctxts2 = deserialize(serialize(global.output_ctxts2), ec);
            let proof2 = deserialize(serialize(global.proof2), ec);
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                input_ctxts,
                output_ctxts2,
                proof2,
                m
            ));
        });
    });

    describe(`m divides N, input_ctxts[i] consists of a Elgamal ciphertext vector of length ${l}.`, function () {
        this.timeout(Math.max(4000, n * m * m * l * 10));
        let global = {};
        let keyPair = ec.genKeyPair();
        let pk = keyPair.getPublic();
        let sk = keyPair.getPrivate();
        let ck = new PedersenPublicKey(ec, n);

        let N = n * m;
        let msg = [];
        global.input_ctxts = [];
        for (let i = 0; i < N; i++) {
            msg[i] = [];
            global.input_ctxts[i] = [];
            for (let k = 0; k < l; k++) {
                msg[i][k] = ec.randomPoint();
                global.input_ctxts[i][k] = ElgamalEnc.encrypt(ec, pk, msg[i][k]);
            }
        }

        it("Test of 'generatePermutation'", () => {
            let permutation = generatePermutation(N);
            assert.isTrue(permutation.length === N);
            let tmp = [];
            for (let i = 0; i < N; i++) {
                tmp[permutation[i]] = 1;
            }
            for (let i = 1; i <= N; i++) {
                assert.isTrue(tmp[i] === 1);
            }
            global.permutation = permutation;
        });

        it("Test of 'shuffle'", () => {
            let { output_ctxts, rho_vector } = shuffle(ec, pk, global.input_ctxts, global.permutation);
            assert.isTrue(output_ctxts.length === N, "'output_ctxts.length' should be N.");
            assert.isTrue(rho_vector.length === N, "'rho_vector.length' should be N.");
            for (let i = 0; i < N; i++) {
                for (let k = 0; k < l; k++) {
                    let res = ElgamalEnc.decrypt(ec, sk, output_ctxts[i][k]);
                    let original_msg = msg[global.permutation[i] - 1][k];
                    assert.isTrue(res.eq(original_msg), "'res' should be equal to the original message.");
                }
            }
            global.output_ctxts = output_ctxts;
            global.rho_vector = rho_vector;
        });

        it("Test of 'transformToMatrix'", () => {
            let { input_ctxt_matrix, output_ctxt_matrix, pi_matrix, rho_matrix } = transformToMatrix(
                ec,
                global.input_ctxts,
                global.output_ctxts,
                global.permutation,
                global.rho_vector,
                m
            );
            assert.isTrue(input_ctxt_matrix.length === n);
            assert.isTrue(output_ctxt_matrix.length === n);
            assert.isTrue(pi_matrix.length === n);
            assert.isTrue(rho_matrix.length === n);
            for (let i = 0; i < n; i++) {
                assert.isTrue(input_ctxt_matrix[i].length === m);
                assert.isTrue(output_ctxt_matrix[i].length === m);
                assert.isTrue(pi_matrix[i].length === m);
                assert.isTrue(rho_matrix[i].length === m);
            }
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    assert.isTrue(input_ctxt_matrix[i][j] == global.input_ctxts[k]);
                    assert.isTrue(output_ctxt_matrix[i][j] == global.output_ctxts[k]);
                    assert.isTrue(pi_matrix[i][j] == global.permutation[k]);
                    assert.isTrue(rho_matrix[i][j] == global.rho_vector[k]);
                    k++;
                }
            }
            global.input_ctxt_matrix = input_ctxt_matrix;
            global.output_ctxt_matrix = output_ctxt_matrix;
            global.pi_matrix = pi_matrix;
            global.rho_matrix = rho_matrix;
        });

        it("Test of 'ShuffleArgument.generateShuffleProof'", () => {
            global.proof = ShuffleArgument.generateShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.pi_matrix,
                global.rho_matrix
            );
        });

        it("Test of 'ShuffleArgument.verifyShuffleProof'", () => {
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.proof
            ));
        });

        it("Test of 'VerifiableShuffle.shuffleWithProof'", () => {
            let tmp = VerifiableShuffle.shuffleWithProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                m
            );
            global.output_ctxts2 = tmp.output_ctxts;
            global.proof2 = tmp.proof;
        });

        it("Test of 'VerifiableShuffle.verifyProof'", () => {
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                global.output_ctxts2,
                global.proof2,
                m
            ));
        });

        it("Test of serialization", () => {
            let input_ctxt_matrix = deserialize(serialize(global.input_ctxt_matrix), ec);
            let output_ctxt_matrix = deserialize(serialize(global.output_ctxt_matrix), ec);
            let proof = deserialize(serialize(global.proof), ec);
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                input_ctxt_matrix,
                output_ctxt_matrix,
                proof
            ));

            let input_ctxts = deserialize(serialize(global.input_ctxts), ec);
            let output_ctxts2 = deserialize(serialize(global.output_ctxts2), ec);
            let proof2 = deserialize(serialize(global.proof2), ec);
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                input_ctxts,
                output_ctxts2,
                proof2,
                m
            ));
        });
    });

    describe(`N = (n - 1) * m + 1, input_ctxts[i] consists of a Elgamal ciphertext vector of length ${l}.`, function () {
        this.timeout(Math.max(4000, n * m * m * l * 10));
        let global = {};
        let keyPair = ec.genKeyPair();
        let pk = keyPair.getPublic();
        let sk = keyPair.getPrivate();
        let ck = new PedersenPublicKey(ec, n);

        let N = (n - 1) * m + 1;
        let msg = [];
        global.input_ctxts = [];
        for (let i = 0; i < N; i++) {
            msg[i] = [];
            global.input_ctxts[i] = [];
            for (let k = 0; k < l; k++) {
                msg[i][k] = ec.randomPoint();
                global.input_ctxts[i][k] = ElgamalEnc.encrypt(ec, pk, msg[i][k]);
            }
        }

        it("Test of 'generatePermutation'", () => {
            let permutation = generatePermutation(N);
            assert.isTrue(permutation.length === N);
            let tmp = [];
            for (let i = 0; i < N; i++) {
                tmp[permutation[i]] = 1;
            }
            for (let i = 1; i <= N; i++) {
                assert.isTrue(tmp[i] === 1);
            }
            global.permutation = permutation;
        });

        it("Test of 'shuffle'", () => {
            let { output_ctxts, rho_vector } = shuffle(ec, pk, global.input_ctxts, global.permutation);
            assert.isTrue(output_ctxts.length === N, "'output_ctxts.length' should be N.");
            assert.isTrue(rho_vector.length === N, "'rho_vector.length' should be N.");
            for (let i = 0; i < N; i++) {
                for (let k = 0; k < l; k++) {
                    let res = ElgamalEnc.decrypt(ec, sk, output_ctxts[i][k]);
                    let original_msg = msg[global.permutation[i] - 1][k];
                    assert.isTrue(res.eq(original_msg), "'res' should be equal to the original message.");
                }
            }
            global.output_ctxts = output_ctxts;
            global.rho_vector = rho_vector;
        });

        it("Test of 'transformToMatrix'", () => {
            let { input_ctxt_matrix, output_ctxt_matrix, pi_matrix, rho_matrix } = transformToMatrix(
                ec,
                global.input_ctxts,
                global.output_ctxts,
                global.permutation,
                global.rho_vector,
                m
            );

            global.input_ctxt_matrix = input_ctxt_matrix;
            global.output_ctxt_matrix = output_ctxt_matrix;
            global.pi_matrix = pi_matrix;
            global.rho_matrix = rho_matrix;

            assert.isTrue(input_ctxt_matrix.length === n);
            assert.isTrue(output_ctxt_matrix.length === n);
            assert.isTrue(pi_matrix.length === n);
            assert.isTrue(rho_matrix.length === n);
            for (let i = 0; i < n; i++) {
                assert.isTrue(input_ctxt_matrix[i].length === m);
                assert.isTrue(output_ctxt_matrix[i].length === m);
                assert.isTrue(pi_matrix[i].length === m);
                assert.isTrue(rho_matrix[i].length === m);
            }
            let k = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (k < N) {
                        assert.isTrue(input_ctxt_matrix[i][j] == global.input_ctxts[k]);
                        assert.isTrue(output_ctxt_matrix[i][j] == global.output_ctxts[k]);
                        assert.isTrue(pi_matrix[i][j] == global.permutation[k]);
                        assert.isTrue(rho_matrix[i][j] == global.rho_vector[k]);
                    } else {
                        for (let v = 0; v < l; v++) {
                            assert.isTrue(input_ctxt_matrix[i][j][v].c1.eq(ec.infinitePoint()));
                            assert.isTrue(input_ctxt_matrix[i][j][v].c2.eq(ec.infinitePoint()));
                            assert.isTrue(output_ctxt_matrix[i][j][v].c1.eq(ec.infinitePoint()));
                            assert.isTrue(output_ctxt_matrix[i][j][v].c2.eq(ec.infinitePoint()));
                            assert.isTrue(rho_matrix[i][j][v].eq(new BN(0)));
                        }
                        assert.isTrue(pi_matrix[i][j] === k + 1);
                    }
                    k++;
                }
            }
        });

        it("Test of 'ShuffleArgument.generateShuffleProof'", () => {
            global.proof = ShuffleArgument.generateShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.pi_matrix,
                global.rho_matrix
            );
        });

        it("Test of 'ShuffleArgument.verifyShuffleProof'", () => {
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                global.input_ctxt_matrix,
                global.output_ctxt_matrix,
                global.proof
            ));
        });

        it("Test of 'VerifiableShuffle.shuffleWithProof'", () => {
            let tmp = VerifiableShuffle.shuffleWithProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                m
            );
            global.output_ctxts2 = tmp.output_ctxts;
            global.proof2 = tmp.proof;
        });

        it("Test of 'VerifiableShuffle.verifyProof'", () => {
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                global.input_ctxts,
                global.output_ctxts2,
                global.proof2,
                m
            ));
        });

        it("Test of serialization", () => {
            let input_ctxt_matrix = deserialize(serialize(global.input_ctxt_matrix), ec);
            let output_ctxt_matrix = deserialize(serialize(global.output_ctxt_matrix), ec);
            let proof = deserialize(serialize(global.proof), ec);
            assert.isTrue(ShuffleArgument.verifyShuffleProof(
                ec,
                pk,
                ck,
                input_ctxt_matrix,
                output_ctxt_matrix,
                proof
            ));

            let input_ctxts = deserialize(serialize(global.input_ctxts), ec);
            let output_ctxts2 = deserialize(serialize(global.output_ctxts2), ec);
            let proof2 = deserialize(serialize(global.proof2), ec);
            assert.isTrue(VerifiableShuffle.verifyProof(
                ec,
                pk,
                ck,
                input_ctxts,
                output_ctxts2,
                proof2,
                m
            ));
        });
    });
});