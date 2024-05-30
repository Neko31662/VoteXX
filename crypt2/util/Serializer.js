const elliptic = require('elliptic');
const EC = elliptic.ec;
const BN = require('bn.js');
const { class_of } = require("./BasicFunction");


/**
 * 判断一个object是否是一个curve元素
 * @param {*} obj 
 * @returns 
 */
function isCurve(obj) {
    try {
        return class_of(obj) === "EC";
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
        return class_of(obj) === "Point";
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
        return class_of(obj) === "BN";
    } catch (err) {
        return false;
    }
}


/**
 * 序列化一个复杂的密码学对象-内层递归函数
 * @param {*} obj 
 * @returns 
 */
function _serialize(obj) {
    if (typeof obj === 'string') {
        return `"${obj}"`;  // 字符串需要加双引号
    } else if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
        return `${obj}`;  // 数字、布尔值和null直接转换为字符串
    } else if (Array.isArray(obj)) {
        // 处理数组
        const elements = obj.map(element => _serialize(element)).join(',');
        return `[${elements}]`;
    } else if (typeof obj === 'object') {
        if (isCurve(obj)) {
            return `"${"<<curve>>"}"`;
        }
        //对于point，按照下面的方式自定义序列化方式
        else if (isPoint(obj)) {
            return `"${"<<point>> " + obj.isInfinity() ? "inf" : obj.encode('hex', true)}"`;
        }
        //对于BN，按照下面的方式自定义序列化方式
        else if (isBN(obj)) {
            return `"${"<<BN>> " + obj.toString()}"`;
        }
        //处理对象
        //依次合并对象的key
        const pairs = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === "function") continue;//跳过函数
                const value = _serialize(obj[key]);
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
 * 序列化一个复杂的密码学对象
 * @param {*} obj 
 * @returns 
 */
function serialize(obj) {
    if (typeof obj !== "object" || isBN(obj) || isCurve(obj) || isPoint(obj)) {
        return _serialize(obj);
    } else {
        return class_of(obj) + " " + _serialize(obj);
    }
}

module.exports={
    serialize
}
