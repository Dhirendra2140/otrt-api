// Custom includes
const Mongoose = require(`mongoose`);
const ObjectId = Mongoose.Types.ObjectId;
const { host } = require(`../config/config`);

// Document schema
const DocumentSchema = Mongoose.Schema({
  userId: {
    type: Mongoose.Schema.ObjectId,
    ref: `User`
  },
  docs: [
    {
      description: {
        type: String
      },
      name: {
        type: String
      },
      url: {
        type: String
      },
    }
  ]
}, {timestamps: true});

// Document Model
const Document = Mongoose.model(`document`, DocumentSchema);

/**
 * Method to create new user document.
 * @param newDocument
 * @param callback
 */
Document.createDocument = (newDocument, callback) => {
  Document.create(newDocument, callback);
};

Document.addDocument = (userId, newDocument, callback) => {
  Document.findOneAndUpdate(
    {userId},
    {$push: {docs: newDocument}},
    {new: true},
    callback);
};

/**
 * Method to fetch all documents details by userId.
 * @param userId
 * @param callback
 */
Document.getUserDocuments = (userId, callback) => {
  Document.find({userId}, callback);
};

// Export Document model
module.exports = Document;
