// Custom includes
const Mongoose = require(`mongoose`);
const ObjectId = Mongoose.Types.ObjectId;

// Verification code schema
const VerificationCodeSchema = Mongoose.Schema({
    userId: {
        type: Mongoose.Schema.ObjectId,
        ref: `User`
    },
    verificationCode: {
        type: String
    }
}, { timestamps: true });

const VerificationCode = Mongoose.model(`VerificationCode`, VerificationCodeSchema);

/**
 * Method to create verification code
 * @param newCode
 * @param callback
 */
VerificationCode.createCode = (newCode, callback) => {
    VerificationCode.create(newCode, callback);
};

/**
 * Method to get verification code details by user id.
 * @param userId
 * @param callback
 */
VerificationCode.getCodeDetailsByUserId = (userId, callback) => {
    VerificationCode.findOne({ userId: ObjectId(userId) }, callback);
};

/**
 * Method to get user by verification code.
 * @param verificationCode
 * @param callback
 */
VerificationCode.getUserByVerificationToken = (verificationCode, userId, callback) => {
    VerificationCode.findOne({
        $and:[
          { verificationCode: verificationCode },
          { userId: userId }
    ]}, callback);
};

// Export VerificationCode Model
module.exports = VerificationCode;