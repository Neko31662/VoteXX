// const BN = require('bn.js');
// const elliptic = require('elliptic');
// const EC = elliptic.ec;
// const ec = require("../../crypt/primitiv/ec/ec");
// const crypto = require('crypto');
// var SHA256 = require('crypto-js/sha256');
// const { DKG } = require('../../crypt/protocol/DKG/dkg');
// const { DistributeDecryptor, PET } = require('../../crypt/protocol/MIX_AND_MATCH/mix_and_match');
// const { serialize, deserialize } = require('../../crypt/util/CryptoSerializer');


const EAVoteModel = require("../models/EAVoteModel");

const FinalTallyService = {
    /**
     * 生成投票的FinalTally初始信息
     * @param {{ voteID, generatorH }} params 
     * 成功返回0;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    init: async (params) => {
        let { voteID, generatorH } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        let dkg = deserialize(voteInfo.DKG_instance_serialized, ec);
        generatorH = deserialize(generatorH, ec);
        let distributeDecryptor = new DistributeDecryptor(ec, dkg.xi, dkg.yi);
        let pet = new PET(ec, generatorH, dkg.xi);

        try {
            await EAVoteModel.updateOne({ voteID }, {
                generatorH: serialize(generatorH),
                distributeDecryptor: serialize(distributeDecryptor),
                pet: serialize(pet)
            });
        } catch (err) {
            return -100;
        }

        return 0;
    },

    /**
     * 处理mix_and_match请求——第一步
     * @param {{ voteID, originCipherDiff }} params 
     * 成功返回结果;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    mixAndMatch_step1: async (params) => {
        let { voteID, originCipherDiff } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        originCipherDiff = deserialize(originCipherDiff, ec);
        let pet = deserialize(voteInfo.pet, ec);

        let tmpCommitment = pet.generateCommitment();
        let raisedCiphertext = pet.raiseToExponent(originCipherDiff);
        let tmpstruct = pet.generateProof(tmpCommitment, originCipherDiff, raisedCiphertext);

        let result = {
            tmpCommitment: serialize(tmpCommitment),
            raisedCiphertext: serialize(raisedCiphertext),
            tmpstruct: serialize(tmpstruct)
        };
        return result;
    },

    /**
     * 处理mix_and_match请求——第二步
     * @param {{ voteID, petStatementList, petProofList }} params 
     * 成功返回验证结果布尔值;
     * 获取投票信息失败，返回-1;
     * 信息长度与EA人数不符，返回-2;
     * 数据库错误，返回-100;
     */
    mixAndMatch_step2: async (params) => {
        let { voteID, petStatementList, petProofList } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        if (petStatementList.length !== voteInfo.EACount || petProofList.length !== voteInfo.EACount) return -2;

        petStatementList = petStatementList.map((item) => deserialize(item, ec));
        petProofList = petProofList.map((item) => deserialize(item, ec));
        let pet = deserialize(voteInfo.pet, ec);

        let valid = true;
        for (let i = 0; i < voteInfo.EACount; i++) {
            if (i === voteInfo.seq) continue;//不验证自身的证明
            if (!pet.verifyProof(petStatementList[i], petProofList[i])) {
                valid = false;
                break;
            }
        }

        return valid;
    },

    /**
     * 处理mix_and_match请求——第三步
     * @param {{ voteID, petRaisedCiphertextList }} params 
     * 成功返回结果;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    mixAndMatch_step3: async (params) => {
        let { voteID, petRaisedCiphertextList } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        petRaisedCiphertextList = petRaisedCiphertextList.map((item) => deserialize(item, ec));
        let pet = deserialize(voteInfo.pet, ec);
        let distributeDecryptor = deserialize(voteInfo.distributeDecryptor, ec);

        let newCiphertext = pet.formNewCiphertext(petRaisedCiphertextList);
        let tmpstruct = distributeDecryptor.generateProof(newCiphertext);
        let c1Xi = distributeDecryptor.generateC1Xi(newCiphertext);

        let result = {
            tmpstruct: serialize(tmpstruct),
            c1Xi: serialize(c1Xi)
        };
        return result;
    },

    /**
     * 处理mix_and_match请求——第四步
     * @param {{ voteID, decStatementList, decProofList }} params 
     * 成功返回验证结果布尔值;
     * 获取投票信息失败，返回-1;
     * 信息长度与EA人数不符，返回-2;
     * 数据库错误，返回-100;
     */
    mixAndMatch_step4: async (params) => {
        let { voteID, decStatementList, decProofList } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        if (decStatementList.length !== voteInfo.EACount || decProofList.length !== voteInfo.EACount) return -2;

        decStatementList = decStatementList.map((item) => deserialize(item, ec));
        decProofList = decProofList.map((item) => deserialize(item, ec));
        let distributeDecryptor = deserialize(voteInfo.distributeDecryptor, ec);

        let valid = true;
        for (let i = 0; i < voteInfo.EACount; i++) {
            if (i === voteInfo.seq) continue;//不验证自身的证明
            if (!distributeDecryptor.verifyProof(decStatementList[i], decProofList[i])) {
                valid = false;
                break;
            }
        }

        return valid;
    },

    /**
     * 处理mix_and_match请求——第五步
     * @param {{ voteID, petRaisedCiphertextList, decC1XiList }} params 
     * 成功返回结果;
     * 获取投票信息失败，返回-1;
     * 数据库错误，返回-100;
     */
    mixAndMatch_step5: async (params) => {
        let { voteID, petRaisedCiphertextList, decC1XiList } = params;
        let voteInfo = null;
        try {
            voteInfo = await EAVoteModel.findOne({ voteID });
        } catch (err) {
            return -100;
        }
        if (!voteInfo) return -1;

        petRaisedCiphertextList = petRaisedCiphertextList.map((item) => deserialize(item, ec));
        decC1XiList = decC1XiList.map((item) => deserialize(item, ec));
        let pet = deserialize(voteInfo.pet, ec);
        let distributeDecryptor = deserialize(voteInfo.distributeDecryptor, ec);

        let newCiphertext = pet.formNewCiphertext(petRaisedCiphertextList);
        let tmpPlaintext = distributeDecryptor.decrypt(newCiphertext, decC1XiList);
        let result = pet.detect(tmpPlaintext);

        return result;
    },
};

module.exports = FinalTallyService;