# VoteXX

VoteXX 毕设项目

## client

前端代码

运行：

```
cd client
npm install (初次)
npm run serve
```

## server

后端代码

运行：

```
cd server
npm install (初次)
npm start
```

## trustee

trustee服务进程

运行：

```
cd trustee
npm install (初次)
npm start <端口号> <账号> <密码> <数据库名>
```

## crypt

密码学算法

其他3个服务都调用了该模块，复制 `client,server,trustee` 时请将该模块放置于同级文件夹下



详细的介绍阅读各个子文件下的readme：

```
./client/src/README.md
./server/README.md
./trustee/README.md
```



