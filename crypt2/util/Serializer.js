const elliptic = require('elliptic');
const EC = elliptic.ec;
const BN = require('bn.js');
const { class_of } = require('./BasicFunction');
const ec_default = require('../primitiv/ec/ec');


/**
 * Determine whether an object is Curve
 * 
 * 判断一个object是否是一个curve元素
 * @param {*} obj 
 * @returns {Boolean}
 */
function isCurve(obj) {
    try {
        return class_of(obj) === "EC";
    } catch (err) {
        return false;
    }
}

/**
 * Determine whether an object is Point
 * 
 * 判断一个object是否是一个Point元素
 * @param {*} obj 
 * @returns {Boolean}
 */
function isPoint(obj) {
    try {
        return class_of(obj) === "Point";
    } catch (err) {
        return false;
    }
}

/**
 * Determine whether an object is BN
 * 
 * 判断一个object是否是一个BN元素
 * @param {*} obj 
 * @returns {Boolean}
 */
function isBN(obj) {
    try {
        return class_of(obj) === "BN";
    } catch (err) {
        return false;
    }
}

/**
 * Encode a point
 * 
 * 对一个点编码
 * @param {Point} p 
 * @returns {String}
 */
function encodePoint(p) {
    return p.isInfinity() ? "inf" : p.encode('hex', true);
}


/**
 * Serialize a complex cryptographic object
 * 
 * 序列化一个复杂的密码学对象
 * @param {*} obj 
 * @returns {String}
 */
function serialize(obj) {

    // string
    if (typeof obj === 'string') {
        return `"${obj}"`;  
    }

    // number, boolean, null
    else if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
        return `${obj}`;  
    }
    
    // array
    else if (Array.isArray(obj)) {
        const elements = obj.map(element => serialize(element)).join(',');
        return `[${elements}]`;
    } 
    
    // object
    else if (typeof obj === 'object') {
        //Curve
        if (isCurve(obj)) {
            return `"${"<<curve>>"}"`;
        }

        //Point
        else if (isPoint(obj)) {
            return `"${"<<point>> " + encodePoint(obj)}"`;
        }

        //BN
        else if (isBN(obj)) {
            return `"${"<<BN>> " + obj.toString(16)}"`;
        }

        //Other object
        const pairs = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === "function") continue;//skip functions
                const value = serialize(obj[key]);
                pairs.push(`"${key}":${value}`);
            }
        }
        return `{${pairs.join(',')}}`;
    } 
    
    else {
        return '';
    }
}

/**
 * Deserialize a complex cryptographic object
 * 
 * 反序列化一个复杂的密码学对象
 * @param {String} serializedObj 
 * @param {EC} ec 
 * @returns {Object}
 */
function deserialize(serializedObj, ec = ec_default){
    const revive = (key, value) => {

        //Curve
        if (typeof value === "string" && value === "<<curve>>") {
            return ec;
        }

        //Point
        else if (typeof value === "string" && value.startsWith("<<point>>")) {
            let [sign, val] = value.split(" ");
            if (val === "inf") {
                return ec.curve.g.mul(0);
            }
            return ec.keyFromPublic(val, 'hex').pub;
        }

        //BN
        else if (typeof value === "string" && value.startsWith("<<BN>>")) {
            let [sign, val] = value.split(" ");
            return new BN(val,"hex");
        }

        //Other
        return value;
    };

    return JSON.parse(serializedObj, revive);
}

module.exports = {
    serialize,
    deserialize,
    encodePoint
};
