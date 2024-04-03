const tryToSuccess = require("./util/TryToSuccess");


const myfunc = () => {
    let v1 = Math.random();
    let v2 = Math.random();
    let n = 10;
    console.log(n * v2, v1, (n + 1) * v2);
    if (v1 > n * v2 && v1 < (n + 1) * v2) {
        return;
    }
    throw ("err!");
};


tryToSuccess(myfunc, 20, "err!");

