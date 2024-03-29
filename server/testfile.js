const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
};

var date = new Date();
const dateString = date.toLocaleString(date, options);

console.log(dateString);


