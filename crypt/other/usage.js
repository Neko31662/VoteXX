const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const { class_of } = require('../util/BasicFunction');

/* ----------------------------------------------- */
// 椭圆曲线
var ec = new EC('secp256k1');
var ec_className = class_of(ec);// EC

// 椭圆曲线的阶
var n = ec.curve.n;// 椭圆曲线上的群的阶
var n_className = class_of(n);// BN

// 椭圆曲线的生成元
var g = ec.curve.g;// 椭圆曲线的生成元
var g_className = class_of(g);// Point
var g_x = g.getX();// 点的横坐标
var g_y = g.getY();// 点的纵坐标

// 点的加法与乘法
var _2g = g.add(g);// 点的加法
var _10g = g.mul(10);// 点的乘法
var _2g_neg = _2g.neg();// 点的逆元（负值）

// 点的判断相等
var equation = _2g.eq(g.mul(2));// 点的判等
var equation_false = _2g == g.mul(2);// 错误的方式

// 椭圆曲线上的无穷远点
var inf = g.mul(0);// 无穷远点
var is_inf = inf.isInfinity();// 判断是否为无穷远点
//var inf_x = inf.getX();// 无穷远点不存在x，y坐标，报错

// 生成一个点
var point_1_2 = ec.curve.point(1, 2);

// 判断点是否在曲线上
var valid1 = ec.curve.validate(g);
var valid2 = ec.curve.validate(point_1_2);

// 点的序列化
var g_hex = g.encode('hex', true);// 点的序列化，只保留x坐标
var g_hex2 = g.encode('hex');// 点的序列化，保留全部坐标
var g_fromHex = ec.keyFromPublic(g_hex, 'hex').pub;// 点的反序列化，方式为先生成公钥，再从中取出pub元素
// var inf_hex = inf.encode('hex');// 无穷远点调用encode会报错

// 获取密钥对
var key = ec.genKeyPair();// 获取密钥对
var privKey = key.getPrivate();// 获取私钥 x，可用于获取随机数
var pubKey = key.getPublic();// 获取公钥 y=g^x，可用于获取随机点

// 大数的运算（BN.js）
var x1 = ec.genKeyPair().getPrivate();
var x2 = ec.genKeyPair().getPrivate();
var BN_sum = x1.add(x2);// 加法
var _x1 = BN_sum.sub(x2);// 减法
var is_zero = x1.isZero();// 是否为0
// 更多BN.js的使用方法，参考https://github.com/indutny/bn.js




/* ----------------------------------------------- */
const readline = require("readline");
async function main() {
    while (true) {
        let rlpromise = new Promise((resolve, reject) => {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("输入变量名获取其值:", (input) => {
                try {
                    console.log(eval(input));
                } catch {
                    console.log("变量解析错误");
                }
                rl.close();
                resolve(input);
            });
        });
        await rlpromise;
    }
}

main();


