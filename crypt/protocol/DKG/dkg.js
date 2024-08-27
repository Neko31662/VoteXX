var BN = require('../../primitiv/bn/bn');
let computeChallenge = require('../../primitiv/hash/hash');

class DKG {
    /**
     * 
     * @param {number} n the number of parties
     * @param {number} seq the sequence of the party
     */
    constructor(n, seq) {
        this.n = n;
        this.seq = seq;
    }
}

class DKG_exec {

    /**
     * Generate key pair for a DKG instance
     * 
     * 为一个DKG实例生成密钥对
     * @param {EC} ec 
     * @param {DKG} item 
     */
    generateKey(ec, item) {
        let keyPair = ec.genKeyPair();
        item.xi = keyPair.getPrivate();
        item.yi = keyPair.getPublic();
    }

    /**
     * Generate ZKP for the key pair in a DKG instance
     * 
     * Statement: yi (item.yi)
     * 
     * Witness: xi (item.xi)
     * 
     * 为DKG实例中的密钥对生成一个零知识证明
     * @param {EC} ec 
     * @param {DKG} item 
     */
    generateDKGProof(ec, item) {
        if (!item.xi || !item.yi) {
            throw new Error("Can't find 'item.xi' or 'item.yi'.");
        }
        let r = ec.randomBN();
        let a = ec.curve.g.mul(r);// a = g^r
        let e = computeChallenge([item.yi.encode('hex', true), a.encode('hex', true)], ec.curve.n);// e = Hash(yi||a)
        let z = e.mul(item.xi).add(r).mod(ec.curve.n);// z = e·xi + r

        item.DKGProof = { a, z };
    }

    /**
     * Verify ZKP for the key pair in a DKG instance
     * 
     * 验证DKG实例中关于的密钥对的零知识证明
     * @param {EC} ec 
     * @param {Point} statement yi
     * @param {{a: Point, z: BN}} proof 
     * @returns {Boolean}
     */
    verifyDKGProof(ec, statement, proof) {
        let { a, z } = proof;
        let yi = statement;
        let e = computeChallenge([yi.encode('hex', true), a.encode('hex', true)], ec.curve.n);
        let left = ec.curve.g.mul(z);// left = g^z
        let right = yi.mul(e).add(a);// right = a·(yi^e) 
        return left.eq(right);
    }

    /**
     * Calculate the public key
     * 
     * 计算公钥
     * @param {EC} ec
     * @param {Point[]} yiList 
     * @param {DKG | undefined} item 
     * @returns {Point}
     */
    calculatePublic(ec, yiList, item) {
        let res = ec.infinitePoint();
        for (let yi of yiList) {
            res = res.add(yi);
        }
        if (item) {
            item.yiList = yiList;
            item.y = res;
        }
        return res;
    }

    /**
     * Caculate ki = c1^xi and generate a proof
     * 
     * 计算 ki = c1^xi 并为其生成零知识证明
     * 
     * @param {EC} ec 
     * @param {DKG} item 
     * @param {ElgamalCiphertext} ciphertext 
     * @returns {[Point, {seq, a1, a2, z }]} [ki = c1^xi, proof]
     */
    decryptOnePartWithProof(ec, item, ciphertext) {
        let { c1 } = ciphertext;
        let { xi, yi, seq } = item;
        if (!c1) {
            throw new Error("Can't find 'ciphertext.c1'.");
        }
        if (!xi || !yi || typeof seq !== 'number') {
            throw new Error("Can't find 'item.xi' or 'item.yi' or 'item.seq'.");
        }

        /*----- calculate ki -----*/
        let ki = c1.mul(xi);// ki = c1^xi;
        /*------------------------*/

        /*----- generate proof -----*/
        let r = ec.randomBN();
        let a1 = ec.curve.g.mul(r);// a1 = g^r
        let a2 = c1.mul(r);// a2 = c1^r
        let e = computeChallenge([c1, ki, yi, a1, a2].map(val => val.encode("hex", true)), ec.curve.n);
        let z = e.mul(xi).add(r).mod(ec.curve.n);// z = e·xi + r
        /*--------------------------*/

        return [ki, { seq, a1, a2, z }];
    }

    /**
     * Verify ZKP of ki
     * 
     * 验证对ki的零知识证明
     * @param {EC} ec 
     * @param {DKG} item 
     * @param {Object} proof 
     * @param {ElgamalCiphertext} ciphertext 
     * @param {Point} ki 
     * @returns {Boolean}
     */
    verifyDecryptProof(ec, item, proof, ciphertext, ki) {
        let { yiList } = item;
        let { seq, a1, a2, z } = proof;
        let { c1 } = ciphertext;
        if (!yiList) {
            throw new Error("Can't find 'item.yiList'.");
        }
        if (!a1 || !a2 || !z || typeof seq !== 'number') {
            throw new Error("Can't find 'a1' or 'a2' or 'z' or 'seq' in 'proof'.");
        }
        if (!c1) {
            throw new Error("Can't find 'ciphertext.c1'.");
        }

        let yi = yiList[seq];
        let e = computeChallenge([c1, ki, yi, a1, a2].map(val => val.encode("hex", true)), ec.curve.n);

        /*----- verify proof -----*/
        let isValid = true;
        let left = ec.curve.g.mul(z);// left = g^z
        let right = yi.mul(e).add(a1);// right = a1·(yi^e)
        isValid &= left.eq(right);
        left = c1.mul(z);// left = c1^z
        right = ki.mul(e).add(a2);// right = a2·(ki^e)
        isValid &= left.eq(right);
        /*------------------------*/

        return Boolean(isValid);
    }

    /**
     * Calculate the Plaintext by kiList
     * 
     * 由kiList解密得到明文
     * @param {EC} ec 
     * @param {ElgamalCiphertext} ciphertext 
     * @param {Point[]} kiList 
     * @returns {Point}
     */
    decrypt(ec, ciphertext, kiList) {
        let { c2 } = ciphertext;
        if (!c2) {
            throw new Error("Can't find 'ciphertext.c2'.");
        }

        let tmp = ec.infinitePoint();
        for (let ki of kiList) {
            tmp = tmp.add(ki);// tmp = k1 * k2 * ... * kn
        }
        let res = c2.add(tmp.neg());// res = c2/tmp
        return res;
    }
}

module.exports = {
    DKG,
    /**
     * Distributed Key Generation:
     * 
     * Step1: Initialize a new DKG class 'item'.
     * 
     * Step2: Invoke in 'generateKey' to generate it's 
     * private key piece 'xi' and public key piece 'yi'.
     * 
     * Step3: Invoke in 'generateDKGProof' to generate 
     * a NIZK 'DKGProof' of the knowledge of 'xi', broadcast it.
     * 
     * Step4: For each other player, invoke in 'verifyDKGProof'
     * to check the validity of it's NIZK.
     * 
     * Step5: Combine the 'item.yi' of each player into an array,
     * then invoke in 'calculatePublic' to calculate the public key.
     * 
     * Decryption:
     * 
     * Step1: Invoke in 'decryptOnePartWithProof' to caculate 'ki'
     * and it's NIZK 'proof', broadcast them.
     * 
     * Step2: For each other player, invoke in 'verifyDecryptProof'
     * to check the validity of it's NIZK.
     * 
     * Step3: Combine the 'ki' of each player into an array,
     * then invoke in 'decrypt' to calculate the plaintext.
     */
    DKG_exec: new DKG_exec()
}

