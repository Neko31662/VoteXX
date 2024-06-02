var BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const { QuadraticResidue } = require('../QuadraticResidue/QuadraticResidue');

/**
 * Elgamal密文
 */
class ElgamalCiphertext {
    constructor(c1, c2) {
        this.c1 = c1;
        this.c2 = c2;
    }
}

/**
 * Elgamal密文的方法
 */
class ElgamalCiphertext_exec {

    /**
     * 
     * @param {ElgamalCiphertext} item 
     * @param {BN} x 
     * @returns {ElgamalCiphertext}
     */
    mul = (item, x) => {
        return new ElgamalCiphertext(item.c1.mul(x), item.c2.mul(x));
    };

    /**
     * 
     * @param {ElgamalCiphertext} item 
     * @param {ElgamalCiphertext} other 
     * @returns {ElgamalCiphertext}
     */
    add = (item, other) => {
        let c1_new = item.c1.add(other.c1);
        let c2_new = item.c2.add(other.c2);
        return new ElgamalCiphertext(c1_new, c2_new);
    };

    /**
     * 
     * @param {ElgamalCiphertext} item 
     * @returns {ElgamalCiphertext}
     */
    neg = (item) => {
        return new ElgamalCiphertext(item.c1.neg(), item.c2.neg());
    };

    /**
     * 
     * @param {ElgamalCiphertext} item 
     * @param {ElgamalCiphertext} other 
     * @returns {Boolean}
     */
    eq = (item, other) => {
        return item.c1.eq(other.c1) && item.c2.eq(other.c2);
    };

    /**
     * 
     * @param {EC} ec 
     * @returns {ElgamalCiphertext}
     */
    identity = (ec) => {
        return new ElgamalCiphertext(ec.curve.point(null, null), ec.curve.point(null, null));
    };

    /**
     * 
     * @param {EC} ec 
     * @returns {ElgamalCiphertext}
     */
    random = (ec) => {
        return new ElgamalCiphertext(ec.randomPoint(), ec.randomPoint());
    };
}

/**
 * Elgamal加解密方法
 */
class ElgamalEnc {
    /**
     * 用于将整数编码到椭圆曲线
     */
    encode_k = 50;

    /**
     * 
     * @param {EC} ec 
     * @param {Point} pk 
     * @param {Point} msg 
     * @param {BN | null} randomness 
     * @returns {ElgamalCiphertext}
     */
    encrypt = (ec, pk, msg, randomness) => {
        if (!randomness) {
            randomness = ec.randomBN();
        }
        let g_r = ec.curve.g.mul(randomness);// g^r
        let pk_r = pk.mul(randomness);// pk^r
        return new ElgamalCiphertext(g_r, pk_r.add(msg));// c1 = g^r, c2 = m·pk^r
    };

    /**
     * 
     * @param {EC} ec 
     * @param {BN} sk 
     * @param {ElgamalCiphertext} ciphertext 
     * @returns {Point}
     */
    decrypt = (ec, sk, ciphertext) => {
        let c1_sk = ciphertext.c1.mul(sk);// c1^sk
        return ciphertext.c2.add(c1_sk.neg());// m = c2 / (c1^sk)
    };

    /**
     * Encode a BN to a list of points on EC
     * 
     * 将一个BN型整数编码成椭圆曲线上的一组点
     * @param {EC} ec 
     * @param {BN} msg 
     * @returns {[Point]}
     */
    encode = (ec, msg) => {
        let msg_clone = msg.clone();
        let p = ec.curve.p;
        let length = p.byteLength() - 1;
        let mask = new BN(2).pow(new BN(length * 8)).sub(new BN(1));
        let res = [];

        while (msg_clone.byteLength() > length) {
            let cur = msg_clone.uand(mask);
            let res_one = this.encode_one(ec, cur);
            res.push(res_one);
            msg_clone.iushrn(length * 8);
        }
        let res_one = this.encode_one(ec, msg_clone);
        res.push(res_one);
        return res;
    };

    /**
     * Decode a list of points on EC to a BN
     * 
     * 将椭圆曲线上的一组点解码成一个BN型整数
     * @param {EC} ec 
     * @param {[Point]} points 
     * @returns {BN}
     */
    decode = (ec, points) => {
        let p = ec.curve.p;
        let length = p.byteLength() - 1;
        let k = this.encode_k;

        let res = new BN(0);
        for (let i = points.length - 1; i >= 0; i--) {
            let point = points[i];
            let tmp = point.getX().divn(k);
            res = res.shln(length * 8).add(tmp);
        }
        return res;
    };

    /**
     * 
     * @param {EC} ec 
     * @param {BN} msg 
     * @returns {Point}
     */
    encode_one = (ec, msg) => {
        let { p, a, b } = ec.curve;
        let k = this.encode_k;
        let msg_k = msg.mul(new BN(k));// msg·k

        for (let i = 0; i < k; i++) {
            let x = msg_k.add(new BN(i));// x = msg·k + i
            let tmp = x.pow(new BN(3)).add(a.mul(x)).add(b).mod(p);// tmp = x^3 + a·x + b (mod p)
            if (!QuadraticResidue.check(tmp, p)) {
                continue;
            } else {
                let y = QuadraticResidue.find(tmp, p);
                return ec.curve.point(x, y);
            }
        }
        throw new Error("Error in encoding massage to point.");
    };
}

module.exports = {
    ElgamalCiphertext,
    ElgamalCiphertext_exec: new ElgamalCiphertext_exec(),
    ElgamalEnc: new ElgamalEnc()
};