const elliptic = require('elliptic');
const EC = elliptic.ec;
const BN = require('bn.js');


/**
 * 获得obj的类名
 * @param {Object} obj 
 */
function findClassName(obj) {
    return obj.constructor.name;
}


/**
 * 判断一个object是否是一个curve元素
 * @param {*} obj 
 * @returns 
 */
function isCurve(obj) {
    try {
        return obj.constructor.name === "EC";
    } catch (err) {
        return false;
    }
}

/**
 * 判断一个obj是否是一个point元素
 * @param {*} obj 
 * @returns 
 */
function isPoint(obj) {
    try {
        return obj.constructor.name === "Point";
    } catch (err) {
        return false;
    }
}

/**
 * 判断一个obj是否是一个BN元素
 * @param {*} obj 
 * @returns 
 */
function isBN(obj) {
    try {
        return obj.constructor.name === "BN";
    } catch (err) {
        return false;
    }
}

/**
 * 序列化一个复杂的密码学对象
 * @param {*} obj 
 * @returns 
 */
function serialize(obj) {
    if (typeof obj === 'string') {
        return `"${obj}"`;  // 字符串需要加双引号
    } else if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
        return `${obj}`;  // 数字、布尔值和null直接转换为字符串
    } else if (Array.isArray(obj)) {
        // 处理数组
        const elements = obj.map(element => serialize(element)).join(',');
        return `[${elements}]`;
    } else if (typeof obj === 'object') {
        if (isCurve(obj)) {
            return `"${"<<curve>>"}"`;
        }
        //对于point，按照下面的方式自定义序列化方式
        else if (isPoint(obj)) {
            return `"${"<<point>> " + (obj.x ? obj.x.toString() : "null") + " " + (obj.y ? obj.y.toString() : "null")}"`;
        }
        //对于BN，按照下面的方式自定义序列化方式
        else if (isBN(obj)) {
            return `"${"<<BN>> " + obj.toString()}"`;
        }
        //处理对象
        //记录对象类名
        const className = findClassName(obj);
        obj.serialize_class_name = className;
        //依次合并对象的key
        const pairs = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === "function") continue;//跳过函数
                const value = serialize(obj[key]);
                pairs.push(`"${key}":${value}`);
            }
        }
        return `{${pairs.join(',')}}`;
    } else {
        // 其他情况返回空字符串
        return '';
    }
}

/**
 * 根据obj以及其嵌套对象的serialize_class_name属性，还原该obj以及其嵌套对象的所有方法
 * @param {*} obj 
 */
function reloadObject(obj) {
    //如果序列化的obj或其子对象包含了某个特定类，需要在此处require
    //不在最顶层require的原因是避免循环引用
    const { BallotBundle, ValuesVector, VoteVector, PointVector } = require("../primitiv/Ballots/ballot_structure");
    const { PublicKey, Commitment } = require("../primitiv/Commitment/pedersen_commitment");
    require("../primitiv/ec/ec");
    const { LiftedElgamalEnc, ElgamalEnc, ElgamalCiphertext, KeyPair, ElgamalPublicKey, Ciphertext, } = require("../primitiv/encryption/ElgamalEncryption");
    const Polynomial = require("../primitiv/polynomial/poly");
    const { DKG, DKGSchnorrNIZKProof, DKGProof } = require("../protocol/DKG/dkg");
    const { DecStatement, DecProof, DecSchnorrNIZKProof, DistributeDecryptor, PETStatement, PETWitness, PETProof, PETSchnorrNIZKProof, PET } = require("../protocol/MIX_AND_MATCH/mix_and_match");
    const { MultiExponantiation } = require("../protocol/NIZKs/verifiable_shuffle/multi_exponantiation_argument");
    const { ProductArgument, SingleValueProdArg, ZeroArgument, HadamardProductArgument, } = require("../protocol/NIZKs/verifiable_shuffle/product_argument");
    const { ShuffleArgument } = require("../protocol/NIZKs/verifiable_shuffle/shuffle_argument");
    const { CommitmentParams, nullificationCommitment, ChallengeFull, Challenge, Response, FirstMoveData, Proof, Statement, Witness, NullificationNIZK } = require("../protocol/NIZKs/nullification");

    const Party = Object;

    // 检查obj是否为对象，不是对象直接返回
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    //如果obj是curve或point或BN，直接返回
    if (obj instanceof EC || obj instanceof elliptic.curve.base.BasePoint || obj instanceof BN) {
        return obj;
    }
    //如果obj是数组，依次合并
    if (Array.isArray(obj)) {
        const mergedObj = [];
        for (let val of obj) {
            mergedObj.push(reloadObject(val));
        }
        return mergedObj;
    }

    // 根据serialize_class_name创建一个新对象来存储合并结果
    const className = obj.serialize_class_name;
    delete obj.serialize_class_name;
    //!!!此处执行了eval，该行为有一定危险性。可进行的改进：对传入的参数进行审查
    const mergedObj = eval(`new ${className}()`);

    //合并obj的属性
    for (let key in obj) {
        // 如果属性值是对象，则递归合并
        if (typeof obj[key] === 'object') {
            mergedObj[key] = reloadObject(obj[key]);
        }
        // 否则直接覆盖属性值
        else {
            mergedObj[key] = obj[key];
        }
    }
    return mergedObj;
}

/**
 * 反序列化一个密码学对象
 * @param {*} serializedObj 序列化后的对象
 * @returns 
 */
function deserialize(serializedObj) {

    const revive = (key, value) => {
        //对于curve，直接重新生成
        if (typeof value === "string" && value === "<<curve>>") {
            return new EC('secp256k1');
        }
        //对于point，按照下面的方式自定义反序列化方式
        else if (typeof value === "string" && value.startsWith("<<point>>")) {
            let [sign, BN1, BN2] = value.split(" ");
            if (BN1 === "null" && BN2 === "null") {
                return new EC('secp256k1').curve.g.mul(0);
            }
            BN1 = new BN(BN1);
            BN2 = new BN(BN2);
            return new EC('secp256k1').curve.point(BN1, BN2);
        }
        //对于BN，按照下面的方式自定义反序列化方式
        else if (typeof value === "string" && value.startsWith("<<BN>>")) {
            let [sign, val] = value.split(" ");
            return new BN(val);
        }
        //其他值按照默认方式
        return value;
    };

    let parsedObj = JSON.parse(serializedObj, revive);
    //最后合并模板对象与反序列化后的对象
    return reloadObject(parsedObj);
}

module.exports = {
    serialize,
    deserialize,
};