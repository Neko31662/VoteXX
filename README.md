# VoteXX Election System

VoteXX is the first election system that has “extreme coercion resistance”.

## client

How to run：

```
cd client
npm install
npm run serve
```

## server

How to run：

```
cd server
npm install
npm start
```

## trustee

How to run：

```
cd trustee
npm install
npm start <port> <username> <password> <database>
```

## crypt

Cryptographic protocols are invoked by `client, server, trustee`. Please put `crypt/, client/, server/, trustee/` in the same directory.

The README files of the submodules:

```
./client/src/README.md
./server/README.md
./trustee/README.md
```



