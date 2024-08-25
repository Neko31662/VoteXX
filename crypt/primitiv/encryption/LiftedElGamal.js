const { assert } = require('chai');
var BN = require('../bn/bn');
const { ElgamalEnc, ElgamalCiphertext } = require('./ElGamal');

/**
 * @typedef {import('./ElGamal').ElgamalCiphertext} ElgamalCiphertext
 */

class LiftedElgamalEnc {
    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk 
     * @param {BN | number} msg 
     * @param {BN | undefined} randomness 
     * @returns {ElgamalCiphertext}
     */
    encrypt(ec, pk, msg, randomness) {
        if (!randomness) {
            randomness = ec.randomBN();
        }
        let new_msg = ec.curve.g.mul(new BN(msg).add(ec.curve.n));
        let g_r = ec.curve.g.mul(randomness);// g^r
        let pk_r = pk.mul(randomness);// pk^r
        return new ElgamalCiphertext(g_r, pk_r.add(new_msg));// c1 = g^r, c2 = (g^m)·(pk^r)
    };

    /**
     * 
     * @param {EC} ec 
     * @param {BN} sk 
     * @param {ElgamalCiphertext} ciphertext 
     * @param {number} min_val 
     * @param {number} max_val 
     * @returns {number | false} Return the plaintext if the plaintext is between 'min_val' and 'max_val', return false otherwise.
     */
    decrypt(ec, sk, ciphertext, min_val = 0, max_val = 8192) {
        assert.ok(max_val >= min_val, "'max_val' should be equal or greater than 'min_val'.");

        let c1_sk = ciphertext.c1.mul(sk);// c1^sk
        let g_m = ciphertext.c2.add(c1_sk.neg());// g^m = c2 / (c1^sk)

        let length = max_val - min_val + 1;
        let tmp = new BN(min_val).add(ec.curve.n);
        let cur = ec.curve.g.mul(tmp);
        for (let i = 0; i < length; i++) {
            if (cur.eq(g_m)) return min_val + i;
            cur = cur.add(ec.curve.g);
        }
        return false;
    };
}

module.exports = {
    LiftedElgamalEnc: new LiftedElgamalEnc()
};