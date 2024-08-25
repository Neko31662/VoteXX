const BN = require('../../primitiv/bn/bn');
const { ElgamalCiphertext, ElgamalCiphertext_exec, ElgamalEnc } = require('../../primitiv/encryption/ElGamal');
const { PedersenPublicKey, PedersenPublicKey_exec, Commitment, Commitment_exec } = require('../../primitiv/commitment/pedersen_commitment');
const computeChallenge = require('../../primitiv/hash/hash');
const { encodePoint } = require('../../util/Serializer');
const assert = require('assert');

/**
 * @typedef {import('../../primitiv/commitment/pedersen_commitment').Commitment} Commitment
 * @typedef {import('../../primitiv/commitment/pedersen_commitment').PedersenPublicKey} PedersenPublicKey
 * @typedef {import('../../primitiv/encryption/ElGamal').ElgamalCiphertext} ElgamalCiphertext
 */

class PETArgument {
    /**
     * statement:{ c_z, old_ctxt, new_ctxt }
     * 
     * witness:{ z, r } 
     * such that 
     * (1) c_z = com(z; r), 
     * (2) new_ctxt = old_ctxt ^ z
     * 
     * @param {EC} ec 
     * @param {PedersenPublicKey} ck 
     * @param {PETStatement} statement 
     * @param {PETWitness} witness 
     */
    generateProof(ec, ck, statement, witness) {
        let { c_z, old_ctxt, new_ctxt } = statement;
        let { z, r } = witness;

        let z_prime = ec.randomBN();
        let [c_z_prime, r_prime] = PedersenPublicKey_exec.commit(ec, ck, z_prime); // c_z' <- com(z'; r')
        let old_ctxt_mul_z_prime = ElgamalCiphertext_exec.mul(old_ctxt, z_prime); // old_ctxt_mul_z' <- old_ctxt ^ z'

        /*----- compute challenge -----*/
        let msg = [];
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        msg.push(encodePoint(c_z.commitment));
        msg.push(encodePoint(old_ctxt.c1));
        msg.push(encodePoint(old_ctxt.c2));
        msg.push(encodePoint(new_ctxt.c1));
        msg.push(encodePoint(new_ctxt.c2));
        msg.push(encodePoint(c_z_prime.commitment));
        msg.push(encodePoint(old_ctxt_mul_z_prime.c1));
        msg.push(encodePoint(old_ctxt_mul_z_prime.c2));
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let n = ec.curve.n;
        let z0 = (x.mul(z).mod(n)).add(z_prime).mod(n); // z0 <- z' + x * z
        let r0 = (x.mul(r).mod(n)).add(r_prime).mod(n); // r0 <- r' + x * r

        return new PETProof(c_z_prime, old_ctxt_mul_z_prime, z0, r0);
    }

    /**
     *  
     * @param {EC} ec 
     * @param {PedersenPublicKey} ck
     * @param {PETStatement} statement 
     * @param {PETProof} proof 
     * @returns {Boolean}
     */
    verifyProof(ec, ck, statement, proof) {
        let { c_z, old_ctxt, new_ctxt } = statement;
        let { c_z_prime, old_ctxt_mul_z_prime, z0, r0 } = proof;

        /*----- compute challenge -----*/
        let msg = [];
        for (let i = 0; i <= ck.n; i++) {
            msg.push(encodePoint(ck.generators[i]));
        }
        msg.push(encodePoint(c_z.commitment));
        msg.push(encodePoint(old_ctxt.c1));
        msg.push(encodePoint(old_ctxt.c2));
        msg.push(encodePoint(new_ctxt.c1));
        msg.push(encodePoint(new_ctxt.c2));
        msg.push(encodePoint(c_z_prime.commitment));
        msg.push(encodePoint(old_ctxt_mul_z_prime.c1));
        msg.push(encodePoint(old_ctxt_mul_z_prime.c2));
        let x = computeChallenge(msg, ec.curve.n);
        /*-----------------------------*/

        let invalidList = [];// debug
        let valid = true;
        let cur;

        let leftSide1 = PedersenPublicKey_exec.commit(ec, ck, z0, r0)[0]; // leftSide1 <- com(z0; r0)
        let rightSide1 = Commitment_exec.mul(Commitment_exec.pow(c_z, x), c_z_prime); // rightSide1 <- c_z' * c_z^x
        cur = Commitment_exec.isEqual(leftSide1, rightSide1);
        valid &= cur;
        if (!cur) invalidList.push(1);

        let leftSide2 = ElgamalCiphertext_exec.mul(old_ctxt, z0); // leftSide2 <- old_ctxt ^ z0
        let rightSide2 = ElgamalCiphertext_exec.add(old_ctxt_mul_z_prime, ElgamalCiphertext_exec.mul(new_ctxt, x)); // rightSide2 <- (old_ctxt ^ z') * (new_ctxt ^ x)
        cur = ElgamalCiphertext_exec.eq(leftSide2, rightSide2);
        valid &= cur;
        if (!cur) invalidList.push(2);

        if (valid) return true;
        else return false;
    }
}

class PETStatement {
    /**
     * 
     * @param {Commitment} c_z 
     * @param {ElgamalCiphertext} old_ctxt 
     * @param {ElgamalCiphertext} new_ctxt 
     */
    constructor(c_z, old_ctxt, new_ctxt) {
        this.c_z = c_z;
        this.old_ctxt = old_ctxt;
        this.new_ctxt = new_ctxt;
    }
}

class PETWitness {
    /**
     * 
     * @param {BN} z 
     * @param {BN} r 
     */
    constructor(z, r) {
        this.z = z;
        this.r = r;
    }
}

class PETProof {
    /**
     * 
     * @param {Commitment} c_z_prime 
     * @param {ElgamalCiphertext} old_ctxt_mul_z_prime 
     * @param {BN} z0 
     * @param {BN} r0 
     */
    constructor(c_z_prime, old_ctxt_mul_z_prime, z0, r0) {
        this.c_z_prime = c_z_prime;
        this.old_ctxt_mul_z_prime = old_ctxt_mul_z_prime;
        this.z0 = z0;
        this.r0 = r0;
    }
}

class PET_data {
    /**
     * 
     * @param {ElgamalCiphertext} ctxt1 
     * @param {ElgamalCiphertext} ctxt2 
     */
    constructor(ctxt1, ctxt2) {
        this.ctxt1 = ctxt1;
        this.ctxt2 = ctxt2;
    }
}

class PET_exec {

    /**
     * Firstly, add a property 'ctxt_dif' to PETData,
     * which is the difference between ctxt1 and ctxt2, i.e., ctxt1 / ctxt2.
     * 
     * Then, randomly choose z and calculate ctxt_dif ^ z, then provide a NIZK of it.
     * 
     * Add properties 'statement', 'witness' and 'proof' to PETData,
     * where 'PETData.statement.new_ctxt' is ctxt_dif ^ z.
     * @param {EC} ec 
     * @param {PedersenPublicKey} ck 
     * @param {PET_data} PETData 
     */
    prepare(ec, ck, PETData) {
        let tmp = ElgamalCiphertext_exec.neg(PETData.ctxt2);
        PETData.ctxt_dif = ElgamalCiphertext_exec.add(PETData.ctxt1, tmp);

        let old_ctxt = PETData.ctxt_dif;
        let z = ec.randomBN();
        let new_ctxt = ElgamalCiphertext_exec.mul(old_ctxt, z);
        let [c_z, r] = PedersenPublicKey_exec.commit(ec, ck, z);

        let statement = new PETStatement(c_z, old_ctxt, new_ctxt);
        let witness = new PETWitness(z, r);

        PETData.statement = statement;
        PETData.witness = witness;
        PETData.proof = (new PETArgument()).generateProof(ec, ck, statement, witness);
    }

    /**
     *  
     * @param {EC} ec 
     * @param {PedersenPublicKey} ck
     * @param {PETStatement} statement 
     * @param {PETProof} proof 
     * @returns {Boolean}
     */
    verifyProof(ec, ck, statement, proof) {
        return (new PETArgument()).verifyProof(ec, ck, statement, proof);
    }

    /**
     * Add a property 'ctxt_sum' to PETData.
     * 
     * ctxt_sum is the cumulative multiplication of values in ctxt_list.
     * @param {EC} ec
     * @param {ElgamalCiphertext[]} ctxt_list 
     * @param {PET_data} PETData 
     */
    formNewCiphertext(ec, ctxt_list, PETData) {
        let ctxt_sum = ctxt_list.reduce(
            (prev, cur) => ElgamalCiphertext_exec.add(prev, cur),
            ElgamalCiphertext_exec.identity(ec)
        );
        PETData.ctxt_sum = ctxt_sum;
    }
}

module.exports = {
    PETArgument: new PETArgument(),
    PETStatement,
    PETWitness,
    PET_data,
    /**
     * Usage: 
     * 
     * Step1: Initialize a new PET_data class PETData with ctxt1 and ctxt2.
     * 
     * Step2: Invoke in function 'prepare' to calculate ctxt_dif ^ z and provide a NIZK of it,
     * broadcast 'PETData.statement.c_z' firstly.
     * 
     * Step3: After all commitments are verified, broadcast 'PETData.statement','PETData.proof'. 
     * 
     * Step4: For each other player, invoke in function 'verifyProof' to check the validity of it's NIZK.
     * 
     * Step5: Combine the 'statement.new_ctxt' of each player into an array,
     * then invoke in function 'formNewCiphertext' to calculate the cumulative multiplication of them.
     * 
     * Step6: Distributed decrypt the result in step5 and check if the plaintext is equal to 1
     * (See in 'rootpath/protocol/DKG/DKG.js').
     */
    PET_exec: new PET_exec()
};