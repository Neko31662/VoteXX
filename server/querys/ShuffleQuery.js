const axios = require("axios");

const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = require("../../crypt/primitiv/ec/ec");
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');
const { ShuffleArgument, shuffleArray } = require('../../crypt/protocol/NIZKs/verifiable_shuffle/shuffle_argument.js');
const cmt_PublicKey = require('../../crypt/primitiv/Commitment/pedersen_commitment').PublicKey;
const { ElgamalEnc } = require('../../crypt/primitiv/encryption/ElgamalEncryption');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');

const { getAllTrusteeAddress } = require("./methods");
const GetPrivateKeysQuery = require("./GetPrivateKeysQuery");
const TryUntilSuccess = require("../util/TryUntilSuccess");

const VoteModel = require("../models/VoteModel");

const shuffle = (ctxts, com_pk, pk, permutation) => {
    let m = 2;
    let [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(ctxts, m, pk);
    let mn = preparedCtxts.length;
    let randomizers = [];
    for (let i = 0; i < mn; i++) {
        randomizers.push(ec.genKeyPair().getPrivate());
    }
    let shuffledCtxts = [];
    permutation.forEach((permuted_index, index) => {
        shuffledCtxts.push(pk.reencrypt(preparedCtxts[permuted_index], randomizers[index]));
    });

    let ctxtsReshaped = ShuffleArgument.reshape_m_n(preparedCtxts, m);
    let shuffledCtxtsReshaped = ShuffleArgument.reshape_m_n(shuffledCtxts, m);
    let permutationReshaped = ShuffleArgument.reshape_m_n(permutation, m);
    let randomizersReshaped = ShuffleArgument.reshape_m_n(randomizers, m);

    let proof = new ShuffleArgument(com_pk, pk, ctxtsReshaped, shuffledCtxtsReshaped, permutationReshaped, randomizersReshaped);

    return [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped];
};

const doShuffleQuery = async (voteID) => {
    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        return -100;
    }
    if (!Array.isArray(addressList)) return -1;
    let EACount = addressList.length;

    //获取BB的信息——election_pk和pks
    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        return -100;
    }
    let election_pk = deserialize(voteInfo.BB.election_pk, ec);
    let pk_length = voteInfo.BB.pks.length;
    let pk_yes = [];
    let pk_no = [];
    for (let i = 0; i < pk_length; i++) {
        pk_yes[i] = deserialize(voteInfo.BB.pks[i].enc_pk_yes, ec);
        pk_no[i] = deserialize(voteInfo.BB.pks[i].enc_pk_no, ec);
    }

    //获取所有trustee的私钥
    let privKey = await TryUntilSuccess(GetPrivateKeysQuery, 10000, "GetPrivateKeysQueryErr", voteID);

    let shuffledPkYes = {};
    let shuffledPkNo = {};
    if (pk_yes.length >= 2) {
        let m = 2;
        let [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_yes, m, election_pk);
        let com_pk = new cmt_PublicKey(ec, n);
        let mn = preparedCtxts.length;
        let permutation = shuffleArray(Array.from({ length: mn }, (_, i) => i));
        let [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
        shuffledPkYes = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };

        [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_no, m, election_pk);
        [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
        shuffledPkNo = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };
    } else {
        shuffledPkYes = { shuffledCtxts: pk_yes };
        shuffledPkNo = { shuffledCtxts: pk_no };
    }


    const shuffled_pks_yes = shuffledPkYes.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));
    const shuffled_pks_no = shuffledPkNo.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));

    const shuffled_plain_pks = [];
    for (let i = 0; i < shuffled_pks_yes.length; i++) {
        shuffled_plain_pks[i] = {
            pk_yes: serialize(shuffled_pks_yes[i]),
            pk_no: serialize(shuffled_pks_no[i])
        };
    }

    await VoteModel.updateOne({ _id: voteID }, {
        $set: {
            "BB.shuffled_plain_pks": shuffled_plain_pks
        }
    });


    // let election_pk = new enc_PublicKey(ec, DKG.getPublic(global.elections[uuid].BB.yiList));

    // // shuffle pks
    // const pks = global.elections[uuid].BB.pks;
    // const pk_yes = pks.map(pk => pk.enc_pk1);
    // const pk_no = pks.map(pk => pk.enc_pk2);

    // let m = 2;
    // let [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_yes, m, election_pk);
    // let com_pk = new cmt_PublicKey(ec, n);
    // let mn = preparedCtxts.length;
    // let permutation = shuffleArray(Array.from({ length: mn }, (_, i) => i));
    // let [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
    // global.elections[uuid].BB.shuffledPkYes = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };

    // [preparedCtxts, n] = ShuffleArgument.prepare_ctxts(pk_no, m, election_pk);
    // [proof, ctxtsReshaped, shuffledCtxts, shuffledCtxtsReshaped] = shuffle(preparedCtxts, com_pk, election_pk, permutation);
    // global.elections[uuid].BB.shuffledPkNo = { shuffledCtxts, proof, ctxtsReshaped, shuffledCtxtsReshaped };


    // decrypt pks
    /**
     * 需要trustee
     */
    // let privKey = new BN(0);
    // for (let i = 0; i < N; i++) {
    //     privKey = privKey.add(new BN(global.elections[uuid].trustees[i].dkg.xi));
    // }

    // const shuffled_pks_yes = global.elections[uuid].BB.shuffledPkYes.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));
    // const shuffled_pks_no = global.elections[uuid].BB.shuffledPkNo.shuffledCtxts.map(ctxt => ElgamalEnc.decrypt(privKey, ctxt, ec));
    // global.elections[uuid].BB.shuffled_plain_pks_yes = shuffled_pks_yes;
    // global.elections[uuid].BB.shuffled_plain_pks_no = shuffled_pks_no;

};

const shuffleQuery = async (voteID) => {
    doShuffleQuery(voteID);
};

module.exports = shuffleQuery;