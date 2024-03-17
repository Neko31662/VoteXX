const Chance = require("chance");
const chance  = Chance();
const md5 = require("md5");

const salt = chance.string({ length: 16 });
console.log(salt);
console.log(md5("12345678"+salt));