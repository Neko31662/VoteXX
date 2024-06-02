let chai = require('chai');
let assert = chai.assert;
let check3_max_time = 3000;

describe("Test start", function () {
    console.log(this);

    it("Self-check1", () => {
        assert.equal(1, 1);
    });

    it(`Self-check2 (Next check will run at least ${check3_max_time - 30}ms, please wait.)`, () => {
        class ES6class {
            val = 1;
        }
        assert.equal(new ES6class().val, 1);
    });

    let old_time = this._timeout;
    this.timeout(check3_max_time);
    // when using 'this', use 'function(){}' instead of '()=>{}' in function 'describe'
    it("Self-check3", (done) => {
        setTimeout(() => {
            assert.equal(1, 1);
            done();
        }, check3_max_time - 30);
    });
    this.timeout(old_time);

});