/**
 * 执行某个函数，若执行失败，则等待一段时间再次执行，直到成功
 * @param {*} func 要执行的函数
 * @param {*} delay 执行失败时等待的时间（单位：ms）
 * @param {*} err 定义函数执行失败时抛出的错误，仅当func抛出的错误与该参数严格匹配时才会重新执行，避免因未预料到的bug导致无限循环
 * @param  {...any} params func接收的参数
 */
const tryToSuccess = async (func, delay, err, ...params) => {
    try {
        await func(...params);
    } catch (throwErr) {
        if (throwErr === err)
            setTimeout(() => { tryToSuccess(func, delay, err, ...params); }, delay);
    }
};

module.exports = tryToSuccess;