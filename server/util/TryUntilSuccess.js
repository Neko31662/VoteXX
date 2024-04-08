/**
 * 让进程中断一段时间
 * @param {Number} time 中断时间（单位：ms）
 * @returns 
 */
const sleep = async (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};

/**
 * 执行某个函数，若执行失败，则等待一段时间再次执行，直到成功
 * @param {*} func 要执行的函数
 * @param {*} delay 执行失败时等待的时间（单位：ms）
 * @param {*} err 定义函数执行失败时抛出的错误，仅当func抛出的错误与该参数严格匹配时才会重新执行，避免因未预料到的bug导致无限循环
 * @param  {...any} params func接收的参数
 */
const tryUntilSuccess = async (func, delay, err, ...params) => {
    let success = false;
    let result = null;
    while (!success) {
        try {
            result = await func(...params);
            success = true;
        } catch (throwErr) {
            if (throwErr === err)
                await sleep(delay);
            else {
                throw throwErr;
            }
        }
    }
    return result;
};

module.exports = tryUntilSuccess;