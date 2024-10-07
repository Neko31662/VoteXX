# VoteXX Election System

VoteXX is the first election system that has “extreme coercion resistance”.

## crypt

```
cd crypt
npm install
```

Cryptographic protocols are invoked by `client, server, trustee`. Please put `crypt/, client/, server/, trustee/` in the same directory.

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

You can use the following default commands to run the trustee processes. At least 2 and at most 5 trustees are supported.

```
npm start 3801 trustee1 neko31662 EADB1
npm start 3802 trustee2 neko31662 EADB2
...
npm start 3805 trustee5 neko31662 EADB5
```

## client

How to run：

```
cd client
npm install
npm run serve
```

## README files of submodules

The README files of the submodules are at the following positions:

```
./server/README.md
./trustee/README.md
./client/src/README.md
```
