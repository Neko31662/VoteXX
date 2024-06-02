let BN = require('bn.js');
let ec = require('../primitiv/ec/ec');
let { serialize, deserialize } = require('../util/Serializer');
let { class_of } = require('../util/BasicFunction');

let chai = require('chai');
let assert = chai.assert;

describe("Test of 'Serializer.js'", () => {
    it("Basic element: EC", () => {
        let ec2 = deserialize(serialize(ec), ec);
        assert.strictEqual(class_of(ec2), class_of(ec));
        ec2.randomBN();
        ec2.randomPoint();
    });

    it("Basic element: Point", () => {
        let p = ec.randomPoint();
        let p2 = deserialize(serialize(p), ec);
        assert.strictEqual(class_of(p2), class_of(p));
        assert.isTrue(p2.eq(p));
    });

    it("Basic element: Infinite point", () => {
        let p = ec.curve.g.mul(new BN(0));
        let p2 = deserialize(serialize(p), ec);
        assert.strictEqual(class_of(p2), class_of(p));
        assert.isTrue(p2.eq(p));
        assert.isTrue(p.isInfinity());
        assert.isTrue(p2.isInfinity());
    });

    it("Basic element: BN", () => {
        let n = ec.randomBN();
        let n2 = deserialize(serialize(n), ec);
        assert.strictEqual(class_of(n2), class_of(n));
        assert.isTrue(n2.eq(n));
    });
});