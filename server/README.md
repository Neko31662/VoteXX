## bin

express 后端程序的入口

## config

配置文件

## models

存储数据库模型

## public

静态资源存储位置

## routes

处理前端的路由请求，将请求分发到控制层（controllers）处理

## controllers

拿到前端数据，对数据进行拆解加工，对拆解后的数据调用数据层（services）处理，最后返回数据

## services

对拿到的数据进行运算、调用数据库模型（models）进行数据库操作、调用请求层（querys）向 trustee 端发送请求

## querys

向 trustee 端发送请求

**如果 querys 层需要调用 services 层的方法，请将 require 语句写在函数内部，以避免循环引用**

## util

各种组件
