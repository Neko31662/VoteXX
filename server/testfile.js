class Curve {
    constructor(name, points) {
        this.name = name;
        this.points = points;
    }
}

function customSerialize(obj) {
    const visited = new Set();
    const serializedObj = {};

    function serializeHelper(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj; // 非对象直接返回
        }

        if (visited.has(obj)) {
            return '[Circular Reference]'; // 处理循环引用
        }
        visited.add(obj);

        if (obj instanceof Curve) {
            serializedObj.name = obj.name;
            serializedObj.points = '[Not Serialized: Points]';
            return serializedObj;
        }

        const result = Array.isArray(obj) ? [] : {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = serializeHelper(obj[key]);
            }
        }

        visited.delete(obj); // 移除当前对象，避免影响其他对象的序列化
        return result;
    }

    return serializeHelper(obj);
}

// 示例对象
const curve1 = new Curve('curve1', [1, 2, 3]);
const curve2 = new Curve('curve2', [4, 5, 6]);
const obj = {
    name: 'Alice',
    age: 30,
    curve1: curve1,
    curve2: curve2,
};

// 自定义序列化对象
const serializedObj = customSerialize(obj);
console.log(serializedObj);
