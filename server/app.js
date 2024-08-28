var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const UserRouter = require('./routes/UserRouter');
const VoteRouter = require('./routes/VoteRouter');
const TrusteeRouter = require('./routes/TrusteeRouter');
const VotePrivateRouter = require('./routes/VotePrivateRouter');
const JWT = require('./util/JWT');

var app = express();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 使用 body-parser 中间件解析 application/x-www-form-urlencoded 格式的请求体
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

//设置静态资源目录
app.use("/serverapi/public", express.static(path.join(__dirname, 'public')));

//不需要验证token的api（或api前缀）
const urlNoNeedToken = [
    "/serverapi/user/login",
    "/serverapi/user/check-username-valid",
    "/serverapi/user/signup",
    "/trusteeapi/trustee/register",
    "/serverapi/vote-private"
];
//检测前端传来的token的有效性
app.use((req, res, next) => {
    //如果是不需要token的api则跳过
    for (let prefix of urlNoNeedToken) {
        if (req.path.startsWith(prefix)) {
            next();
            return;
        }
    }

    let token = null;
    try {
        token = req.headers.authorization.split(" ")[1];
    } catch (err) {
        res.status(401).send({ error: "token过期" });
        return;
    }
    var payload = false;
    if (token) {
        payload = JWT.verify(token, "user");
    }
    if (payload) {
        //token有效，放行
        //生成新的token
        const newToken = JWT.generate({
            _id: payload._id,
            username: payload.username
        }, "user");
        res.header("Authorization", newToken);
        //将token信息挂载到req
        req.payload = payload;
        next();
    } else {
        //token无效，返回401
        res.status(401).send({ error: "token过期" });
        return;
    }
});

//注册路由中间件
app.use(UserRouter);
app.use(VoteRouter);
app.use(TrusteeRouter);
app.use(VotePrivateRouter);

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
