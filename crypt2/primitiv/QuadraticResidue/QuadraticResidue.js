const BN = require('../bn/bn');

class QuadraticResidue {
    /**
     * check if a is quadratic residue mod p
     * 
     * 检查a是否是p的二次剩余
     * @param {BN} a 
     * @param {BN} p  
     * @returns {Boolean}
     */
    check = (a, p) => {
        let s = p.ushrn(1);
        let red = BN.red(p);
        let redA = a.tryToRed(red);
        redA = redA.redPow(s);
        a = redA.fromRed();
        if (a.eq(new BN(1))) return true;
        else if (a.eq(p.sub(new BN(1))) || a.eq(new BN(0))) return false;
        else throw new Error("Error in checking quadratic residue.");
    };

    /**
     * find x that x^2 = a (mod p), while a is quadratic residue mod p, and (p-1)/2 is odd
     * 
     * 寻找 x 使得 x^2 = a (mod p)，其中 a 是 p 的二次剩余，且 (p-1)/2 是奇数
     * @param {BN} a 
     * @param {BN} p 
     * @returns {BN}
     */
    find = (a, p) => {
        let s = p.ushrn(1);
        let red = BN.red(p);
        let redA = a.tryToRed(red);;
        let redX = redA.redPow(s.add(new BN(1)).shrn(1));
        let x = redX.fromRed();
        return x;
    };
}

module.exports = {
    QuadraticResidue: new QuadraticResidue()
};