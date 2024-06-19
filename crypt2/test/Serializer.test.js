let BN = require('../primitiv/bn/bn');
let ec = require('../primitiv/ec/ec');
let { serialize, deserialize } = require('../util/Serializer');
let { class_of } = require('../util/BasicFunction');

let chai = require('chai');
let assert = chai.assert;

function isEC(obj) {
    assert.strictEqual(class_of(obj), class_of(ec));
    obj.randomBN();
    obj.randomPoint();
}

function isEqualPoint(p1, p2) {
    assert.strictEqual(class_of(p1), "Point");
    assert.strictEqual(class_of(p2), "Point");
    assert.isTrue(p2.eq(p1));
}

function isEqualBN(n1, n2) {
    assert.strictEqual(class_of(n1), "BN");
    assert.strictEqual(class_of(n2), "BN");
    assert.isTrue(n2.eq(n1));
}

describe("Test of 'Serializer.js'", () => {
    it("Basic element: EC", () => {
        let ec2 = deserialize(serialize(ec), ec);
        isEC(ec2);
    });

    it("Basic element: Point", () => {
        let p = ec.randomPoint();
        let p2 = deserialize(serialize(p), ec);
        isEqualPoint(p, p2);
    });

    it("Basic element: Infinite point", () => {
        let p = ec.curve.g.mul(new BN(0));
        let p2 = deserialize(serialize(p), ec);
        assert.isTrue(p.isInfinity());
        assert.isTrue(p2.isInfinity());
        isEqualPoint(p, p2);
    });

    it("Basic element: BN", () => {
        let n = ec.randomBN();
        let n2 = deserialize(serialize(n), ec);
        isEqualBN(n, n2);
    });

    it("Object", () => {
        let obj = {
            a: ec,
            b: ec.randomPoint(),
            c: ec.curve.g.mul(new BN(0)),
            d: ec.randomBN(),
            e: {
                a: ec,
                b: ec.randomPoint(),
                c: ec.curve.g.mul(new BN(0)),
                d: ec.randomBN(),
            }
        };

        let obj2 = deserialize(serialize(obj), ec);

        isEC(obj2.a);
        isEqualPoint(obj.b, obj2.b);
        isEqualPoint(obj.c, obj2.c);
        isEqualBN(obj.d, obj2.d);

        isEC(obj2.e.a);
        isEqualPoint(obj.e.b, obj2.e.b);
        isEqualPoint(obj.e.c, obj2.e.c);
        isEqualBN(obj.e.d, obj2.e.d);
    });
});