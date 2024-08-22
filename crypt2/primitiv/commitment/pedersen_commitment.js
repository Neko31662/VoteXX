const BN = require('../bn/bn');


/**
 * A public key for a Pedersen commitment scheme.
 * 
 * 用于进行Pedersen承诺的公钥
 */
class PedersenPublicKey {
    /**
     * Create a public key for a Pedersen commitment scheme for at most n elements.
     * @param {EC} ec 
     * @param {number} n 
     */
    constructor(ec, n) {
        /**
          Example:
            G = new EC('secp256k1');
            pk = new PedersenPublicKey(G, 2);
        **/
        this.n = n;
        this.generators = [];

        for (let i = 0; i <= this.n; i++) {
            /**
             * G's index: 0 -> this.n-1
             * H's index: this.n
            **/
            if (i === 0) {
                this.generators.push(ec.curve.g);
            } else {
                this.generators.push(ec.randomPoint());
            }
        }
    }
}

class PedersenPublicKey_exec {
    /**
     * Commit to a list of values
     * 
     * 对一组值进行承诺
     * @param {EC} ec
     * @param {PedersenPublicKey} item
     * @param {BN[] | BN} values 
     * @param {BN | undefined} randomness 
     * @returns {[Commitment,BN]} [commitment, randomness]
     */
    commit(ec, item, values, randomness) {
        if (!Array.isArray(values)) {
            values = [values];
        }
        if (values.length > item.n) {
            throw new Error(`The length of 'values' is ${values.length}, shouldn't bigger than 'item.n' ${item.n}`);
        }
        if (!randomness) {
            randomness = ec.randomBN();
        }

        /*----- caculate the commitment -----*/
        let product = ec.infinitePoint();
        for (let i = 0; i < values.length; i++) {
            product = product.add(item.generators[i].mul(values[i]));
        }
        product = product.add(item.generators[item.n].mul(randomness));
        let commitment = new Commitment(product);
        /*-----------------------------------*/

        return [commitment, randomness];
    }

    /**
     * Check the validity of a Pedersen commitment
     * 
     * 检查一个Pederson承诺的有效性
     * @param {EC} ec 
     * @param {PedersenPublicKey} item 
     * @param {BN[] | BN} values 
     * @param {BN} randomness 
     * @param {Commitment} commitment 
     * @returns {Boolean}
     */
    verify(ec, item, values, randomness, commitment) {
        let commitment2 = this.commit(ec, item, values, randomness)[0];
        return new Commitment_exec().isEqual(commitment, commitment2);
    }
}

/**
 * A Pedersen commitment
 * @param {Point} commitment
 */
class Commitment {
    /**
     * 
     * @param {Point} commitment 
     */
    constructor(commitment) {
        this.commitment = commitment;
    }
}

class Commitment_exec {
    /**
     * Multiply two Pedersen commitments
     * 
     * The commitment scheme is additively homomorphic. Multiplying two 
     * commitments gives a commitment to the pointwise sum of the original
     * values.
     * 
     * com(a1;r1)·com(a1;r2) = com(a1+a2;r1+r2)
     * @param {Commitment} item 
     * @param {Commitment} other 
     * @returns {Commitment}
     */
    mul(item, other) {
        return new Commitment(item.commitment.add(other.commitment));
    }

    /**
     * Raise Pedersen commitment to the power of a constant
     * 
     * The commitment scheme is additively homomorphic. Raising a commitment
     * to a constant power multiplies the committed vector by that constant.
     * 
     * com(a;r)^x = com(ax;rx)
     * @param {Commitment} item 
     * @param {BN} exponent 
     * @returns {Commitment}
     */
    pow(item, exponent) {
        return new Commitment(item.commitment.mul(exponent));
    }

    /**
     * 
     * @param {Commitment} item 
     * @param {Commitment} other 
     * @returns {Boolean}
     */
    isEqual(item, other) {
        return item.commitment.eq(other.commitment);
    }
}

module.exports = {
    PedersenPublicKey,
    Commitment,
    PedersenPublicKey_exec: new PedersenPublicKey_exec(),
    Commitment_exec: new Commitment_exec()
};