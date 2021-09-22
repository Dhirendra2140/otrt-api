// Custom include
const Mongoose = require(`mongoose`);

// DeviceDetails schema
const DeviceDetailsSchema = Mongoose.Schema({
    userId: {
        type: Mongoose.Schema.ObjectId,
        ref: `User`
    },
    email: {
        type: String,
        email: true
    },
    deviceToken: {
        type: String
    },
    udId: {
        type: String
    },
    deviceOS: {
        type: String
    }
}, { timestamps: true });

// DeviceDetail Model
const DeviceDetail = Mongoose.model(`devicedetail`, DeviceDetailsSchema);

/**
 * Method to create new mobile device document.
 * @param newDevice
 * @param callback
 */
DeviceDetail.createDevice = (newDevice, callback) => {
    DeviceDetail.create(newDevice, callback);
};

/**
 * Method to get device details by user id.
 * @param userId
 * @param callback
 */
DeviceDetail.getDeviceDetails = (userId, callback) => {
    DeviceDetail.find({ userId: userId }).populate(`userId`).exec(callback);
};

/**
 * Method to delete device token by user id and device token.
 * @param userId
 * @param deviceToken
 * @param callback
 */
DeviceDetail.deleteDeviceToken = (userId, deviceToken, callback) => {
    DeviceDetail.remove({ userId: userId, deviceToken: deviceToken }, callback);
};

/**
 * Method to search device details by user id and device token.
 * @param userId
 * @param deviceToken
 * @param callback
 */
DeviceDetail.searchDeviceDetails = (userId, deviceToken, callback) => {
    DeviceDetail.find({ userId: userId, deviceToken: deviceToken }, callback);
};

/**
 * Method to get device details by email.
 * @param email
 * @param callback
 */
DeviceDetail.getDeviceDetailsByEmail = (email, callback) => {
    DeviceDetail.find({ email: email }).populate(`userId`).exec(callback);
};

/**
 * Method to update user email.
 * @param oldEmail
 * @param newEmail
 * @param callback
 */
DeviceDetail.updateUserEmail = (oldEmail, newEmail, callback) => {
    DeviceDetail.update({ email: oldEmail },
        { $set: { email: newEmail } },
        { multi: true },
        callback
    );
};

// Export DeviceDetail Model
module.exports = DeviceDetail;
