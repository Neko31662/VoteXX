var BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;

const {class_of} = require("../../util/BasicFunction");

class ElgamalCiphertext {
    constructor(c1, c2) {
        if (!c1) this.info = null;
        else this.info = { c1, c2 };
    }

    mul = (x) => {
        return new ElgamalCiphertext(this.info.c1.mul(x), this.info.c2.mul(x));
    };

    add = (other) => {
        if(class_of(other)!=class_of(this)) return null;
        c1_new = this.info.c1 + other.info.c1;
        c2_new = this.info.c2 + other.info.c2;
        return new ElgamalCiphertext(c1_new, c2_new);
    };

    neg = ()=>{
        return new ElgamalCiphertext(this.info.c1.neg(), this.info.c2.neg());
    }

    eq = (other)=>{
        if(class_of(other)!=class_of(this)) return null;
        return this.info.c1.eq(other.info.c1) && this.info.c2.eq(other.info.c2);
    }
}