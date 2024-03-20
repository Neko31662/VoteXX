var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const UserRouter = require('./routes/UserRouter');
const PublicRouter = require('./routes/PublicRouter');
const JWT = require('./util/JWT');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/serverapi/public",express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


//检测前端传来的token的有效性
const urlNoNeedToken = [
    "/serverapi/user/login",
];

app.use((req, res, next) => {
    console.log("token:" + req.url);
    //如果是不需要token的api则跳过
    if (urlNoNeedToken.includes(req.url)) {
        next();
        return;
    }

    let token = null;
    try {
        token = req.headers.authorization.split(" ")[1];
    } catch (err) {
        res.status(401).send({ errCode: "-1", errInfo: "无token" });
        return;
    }
    var payload = false;
    if (token) {
        payload = JWT.verify(token);
    }
    if (payload) {
        //token有效，放行
        const newToken = JWT.generate({
            _id: payload._id,
            username: payload.username
        }, `${JWT.EXPIRES}`);
        res.header("Authorization", newToken);
        next();
    } else {
        res.status(401).send({ errCode: "-1", errInfo: "token过期" });
        //token无效，返回401
    }
});

//注册路由中间件
app.use(UserRouter);
app.use('/serverapi', PublicRouter);
// app.use("http://localhost:3000",PublicRouter);
// express.static(path.join(__dirname, 'public'))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
