module.exports = {
    timeout: 4000,
    spec: [
        'test/mocha.test.js',
        'test/ec.test.js',
        'test/QuadraticResidue.test.js',
        'test/ElGamal.test.js',
        'test/Serializer.test.js',
        'test/DKG.test.js',
        'test/pedersen_commitment.test.js',
        'test/MultiExponentiationArgument.test.js',
        'test/ZeroArgument.test.js',
        'test/HadamardProductArgument.test.js',
        'test/SingleValueProductArgument.test.js',
    ]
};