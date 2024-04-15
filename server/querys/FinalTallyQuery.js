const axios = require("axios");

const BN = require('bn.js');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = require("../../crypt/primitiv/ec/ec");
const crypto = require('crypto');
var SHA256 = require('crypto-js/sha256');
const { DKG } = require('../../crypt/protocol/DKG/dkg');
const { DistributeDecryptor, PET, GenerateOrTruthTable, EncryptionTable, mixTable, ciphertextDiff,
} = require('../../crypt/protocol/MIX_AND_MATCH/mix_and_match');
const { LiftedElgamalEnc } = require('../../crypt/primitiv/encryption/ElgamalEncryption');
const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');

const { getAllTrusteeAddress } = require("./methods");
const GetPrivateKeysQuery = require("./GetPrivateKeysQuery");
const TryUntilSuccess = require("../util/TryUntilSuccess");

const VoteModel = require("../models/VoteModel");


/**
 * 对最终计票进行初始化
 * @param {*} voteID 
 * @returns 
 * 成功返回0;
 * 获取trustee服务地址列表失败返回-1;
 * 初始化失败返回-2;
 * 数据库错误返回-100;
 */
const doFinalTallyInitQuery = async (voteID) => {
    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        return -100;
    }
    if (!Array.isArray(addressList)) return -1;

    //获取投票的generatorH
    let generatorH = null;
    try {
        let voteInfo = await VoteModel.findOne({ _id: voteID });
        generatorH = voteInfo.BB.generatorH;
    } catch (err) {
        return -100;
    }

    //第一步--发送请求
    let queryPromises1 = [];
    for (let i in addressList) {
        queryPromises1[i] =
            axios.post(addressList[i] + "/ea-vote/final-tally/init", {
                voteID,
                generatorH
            });
    }
    //第一步--处理结果
    let response1 = null;
    try {
        response1 = await Promise.all(queryPromises1);
    } catch (err) {
        return -2;
    }
    response1.forEach((res, index) => {
        if (res.data.ActionType !== "ok") return -2;
    });

    return 0;
};

/**
 * 对table（赞成或反对票的弃票列表）进行mix_and_match
 * @param {*} table 
 * @param {*} voteID 
 * @returns 
 * 成功返回0;
 * 获取trustee服务地址列表失败返回-1;
 * 第一步失败返回-2;
 * 第二步失败返回-3;
 * 第二步零知识证明验证失败返回-4;
 * 第三步失败返回-5;
 * 第四步失败返回-6;
 * 第四步零知识证明验证失败返回-7;
 * 第五步失败返回-8;
 * 数据库错误返回-100;
 */
const doMixAndMatchQuery = async (table, voteID) => {
    //获取trustee服务地址列表
    let addressList = null;
    try {
        addressList = await getAllTrusteeAddress(voteID);
    } catch (err) {
        return -100;
    }
    if (!Array.isArray(addressList)) return -1;
    let EACount = addressList.length;

    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        return -100;
    }
    let election_pk = deserialize(voteInfo.BB.election_pk, ec);

    const m = table.length;
    const n = table[0].length;
    let encTable = table;
    let BB = {
        petCommitmentList: [],
        petStatementList: [],
        petRaisedCiphertextList: [],
        petProofList: [],
        decProofList: [],
        decStatementList: [],
        decC1XiList: []
    };
    let globalValid = true;

    //  generate OR table
    const ORTableColumns = 3;
    const ORTableRows = 4;

    //  result output of the OR tables
    //  total n columns
    const resultTable = [];

    //遍历每一列
    for (let j = 0; j < n; j++) {
        //  2 input for each gate, the first input is also the output of the last gate
        let input = [];
        input[0] = encTable[0][j];

        //  each column has m-1 OR gates
        //每列有m个值，进行m-1次或运算
        for (let i = 1; i < m; i++) {

            //  generate mixed OR gate——这部分不需要与trustee交互
            let tmpORgate = GenerateOrTruthTable(ec); // plaintext table
            let encORgate = EncryptionTable(tmpORgate, ORTableRows, ORTableColumns, election_pk, ec);  // encrypted table
            let mixORgate = mixTable(encORgate, ORTableRows, ORTableColumns, ec, election_pk);  //  permuted table

            //  other input
            input[1] = encTable[i][j];

            //  store the matched row
            var matchedRow = 0;

            //  PET for each row
            for (let k = 0; k < ORTableRows; k++) {

                //  PET for input0/1
                let rowMatched = true;

                //  PET for each column
                for (let col = 0; col < ORTableColumns - 1; col++) {
                    let originCipherDiff = ciphertextDiff(input[col], mixORgate[k][col]);
                    let colMatched = true;

                    //  each party generate commitment, ciphertext, proof, statement & broadcast
                    //第一步——发送请求
                    let queryPromises1 = [];
                    for (let i in addressList) {
                        queryPromises1[i] =
                            axios.post(addressList[i] + "/ea-vote/final-tally/mix-and-match/step1", {
                                voteID,
                                originCipherDiff: serialize(originCipherDiff)
                            });
                    }
                    //第一步——处理结果
                    let response1 = null;
                    try {
                        response1 = await Promise.all(queryPromises1);
                    } catch (err) {
                        return -2;
                    }
                    response1.forEach((res, index) => {
                        if (res.data.ActionType !== "ok") return -2;
                        let { tmpCommitment, raisedCiphertext, tmpstruct } = res.data.data;
                        tmpstruct = deserialize(tmpstruct, ec);
                        let tmpStatement = tmpstruct.statement;
                        let tmpProof = tmpstruct.proof;
                        BB.petCommitmentList[index] = deserialize(tmpCommitment, ec);
                        BB.petRaisedCiphertextList[index] = deserialize(raisedCiphertext, ec);
                        BB.petProofList[index] = tmpProof;
                        BB.petStatementList[index] = tmpStatement;
                    });

                    //第二步——发送请求
                    let petStatementList_serialized = BB.petStatementList.map((item) => serialize(item));
                    let petProofList_serialized = BB.petProofList.map((item) => serialize(item));
                    let queryPromises2 = [];
                    for (let i in addressList) {
                        queryPromises2[i] =
                            axios.post(addressList[i] + "/ea-vote/final-tally/mix-and-match/step2", {
                                voteID,
                                petStatementList: petStatementList_serialized,
                                petProofList: petProofList_serialized
                            });
                    }
                    //第二步——处理结果
                    let response2 = null;
                    try {
                        response2 = await Promise.all(queryPromises2);
                    } catch (err) {
                        return -3;
                    }
                    response2.forEach((res, index) => {
                        if (res.data.ActionType !== "ok") return -3;
                        if (res.data.data !== true) globalValid = false;
                    });
                    if (!globalValid) return -4;

                    //第三步——发送请求
                    let queryPromises3 = [];
                    let petRaisedCiphertextList_serialized = BB.petRaisedCiphertextList.map((item) => serialize(item));
                    for (let i in addressList) {
                        queryPromises3[i] =
                            axios.post(addressList[i] + "/ea-vote/final-tally/mix-and-match/step3", {
                                voteID,
                                petRaisedCiphertextList: petRaisedCiphertextList_serialized
                            });
                    }
                    //第三步——处理结果
                    let response3 = null;
                    try {
                        response3 = await Promise.all(queryPromises3);
                    } catch (err) {
                        return -5;
                    }
                    response3.forEach((res, index) => {
                        if (res.data.ActionType !== "ok") return -5;
                        let { tmpstruct, c1Xi } = res.data.data;
                        tmpstruct = deserialize(tmpstruct, ec);
                        let tmpStatement = tmpstruct.statement;
                        let tmpProof = tmpstruct.proof;

                        BB.decC1XiList[index] = deserialize(c1Xi, ec);
                        BB.decProofList[index] = tmpProof;
                        BB.decStatementList[index] = tmpStatement;
                    });

                    //第四步——发送请求
                    let decStatementList_serialized = BB.decStatementList.map((item) => serialize(item));
                    let decProofList_serialized = BB.decProofList.map((item) => serialize(item));
                    let queryPromises4 = [];
                    for (let i in addressList) {
                        queryPromises4[i] =
                            axios.post(addressList[i] + "/ea-vote/final-tally/mix-and-match/step4", {
                                voteID,
                                decStatementList: decStatementList_serialized,
                                decProofList: decProofList_serialized
                            });
                    }
                    //第四步——处理结果
                    let response4 = null;
                    try {
                        response4 = await Promise.all(queryPromises4);
                    } catch (err) {
                        return -6;
                    }
                    response4.forEach((res, index) => {
                        if (res.data.ActionType !== "ok") return -6;
                        if (res.data.data !== true) globalValid = false;
                    });
                    if (!globalValid) return -7;

                    //第五步——发送请求
                    let queryPromises5 = [];
                    let decC1XiList_serialized = BB.decC1XiList.map((item) => serialize(item));
                    for (let i in addressList) {
                        queryPromises5[i] =
                            axios.post(addressList[i] + "/ea-vote/final-tally/mix-and-match/step5", {
                                voteID,
                                petRaisedCiphertextList: petRaisedCiphertextList_serialized,
                                decC1XiList: decC1XiList_serialized
                            });
                    }
                    //第五步——处理结果
                    let response5 = null;
                    try {
                        response5 = await Promise.all(queryPromises5);
                    } catch (err) {
                        return -8;
                    }
                    response5.forEach((res, index) => {
                        if (res.data.ActionType !== "ok") return -8;
                        if (res.data.data !== true) colMatched = false;
                    });

                    //  check if the column is matched
                    //  if any one of the element in this row doesn't match, then break
                    rowMatched = rowMatched && colMatched;
                    if (rowMatched === false) {
                        break;
                    }
                }

                //  check if the row is matched
                //  as long as one row is matched, then break
                if (rowMatched === true) {
                    matchedRow = k;
                    break;
                }
            }

            //  output for this OR gate (the input for the next OR gate)
            input[0] = mixORgate[matchedRow][ORTableColumns - 1];
        }
        //  output of the last OR gate -> result
        resultTable.push(input[0]);
    }
    return [resultTable, BB];
};

/**
 * 发起最终计票请求
 * @param {*} voteID 
 * @returns
 * 成功返回0;
 * doFinalTallyInitQuery失败返回-1;
 * GetPrivateKeysQuery失败返回-2;
 * mix_and_match失败返回-3;
 * 数据库错误返回-100;
 */
const doFinalTallyQuery = async (voteID) => {
    let voteInfo = null;
    try {
        voteInfo = await VoteModel.findOne({ _id: voteID });
    } catch (err) {
        return -100;
    }

    try {
        let result = await doFinalTallyInitQuery(voteID);
        if (result !== 0) return -1;
    } catch (err) {
        return -1;
    }

    //获取所有trustee的私钥
    let privKey = null;
    try {
        privKey = await TryUntilSuccess(GetPrivateKeysQuery, 10000, "GetPrivateKeysQueryErr", voteID);
    } catch (err) {
        return -2;
    }

    //进行mix_and_match
    let mix_output_yes = null;
    let mix_output_no = null;
    let mix_aux_yes = null;
    let mix_aux_no = null;

    let nullifyYesTable = voteInfo.BB.nullifyYes.map((item) => {
        return item.table.map((item2) => {
            return deserialize(item2, ec);
        });
    });
    if (nullifyYesTable.length !== 0) {
        try {
            let tmp = await doMixAndMatchQuery(nullifyYesTable, voteID);
            if (typeof tmp === "number") return -3;
            let [resultTable, aux] = tmp;
            mix_output_yes = resultTable;
            mix_aux_yes = aux;
        } catch (err) {
            return -3;
        }
    }

    let nullifyNoTable = voteInfo.BB.nullifyNo.map((item) => {
        return item.table.map((item2) => {
            return deserialize(item2, ec);
        });
    });
    if (nullifyNoTable.length !== 0) {
        try {
            let tmp = await doMixAndMatchQuery(nullifyNoTable, voteID);
            if (typeof tmp === "number") return -3;
            let [resultTable, aux] = tmp;
            mix_output_no = resultTable;
            mix_aux_no = aux;
        } catch (err) {
            return -3;
        }
    }

    //统计
    let nullified_yes = 0;
    let nullified_no = 0;

    if (mix_output_yes) {
        let nullified_yes_enc = mix_output_yes.reduce((a, b) => a.add(b));
        nullified_yes = LiftedElgamalEnc.decrypt(privKey, nullified_yes_enc, ec.curve);
    }
    if (mix_output_no) {
        let nullified_no_enc = mix_output_no.reduce((a, b) => a.add(b));
        nullified_no = LiftedElgamalEnc.decrypt(privKey, nullified_no_enc, ec.curve);
    }

    try {
        await VoteModel.updateOne({ _id: voteID }, {
            "BB.results.nullified_yes": nullified_yes,
            "BB.results.nullified_no": nullified_no,
        });
    } catch (err) {
        return -100;
    }

    return 0;
};

const FinalTallyQuery = async (voteID) => {
    let result = await doFinalTallyQuery(voteID);
    if (result === 0) return 0;
    else if (result <= -1 && result !== -100) throw "FinalTallyQueryErr";
    else throw "OtherErr";
};

module.exports = FinalTallyQuery;