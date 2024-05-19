
function class_of(val) {
    try {
        return val.constructor.name;
    } catch {
        console.log("调用class_of时出错");
        return undefined;
    }
}

module.exports={
    class_of
}