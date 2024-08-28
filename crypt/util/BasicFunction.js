
function class_of(val) {
    try {
        return val.constructor.name;
    } catch {
        throw new Error("Error in function 'class_of'.");
    }
}

module.exports = {
    class_of
};