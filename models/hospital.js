const Mongoose = require(`mongoose`);

// Hospital schema
const HospitalSchema =new Mongoose.Schema({
      
  Hospitalcode: {
        type: Number,
        required: true,
        unique: true
      },
      Name: {
        type: String,
        lowercase: true,
        trim: true
      },
      isActive: {
        type: Boolean,
        default: false
      },
      mobileNumber: {
        type: String,
        default: ''
      },
      zipCode: {
        type: String
      },
      state: {
        type: String
      },
    isActive: {
      type: Boolean,
      default: false
    },
    userStatus: {
      type: String,
      default: 'Not Verified'
    },
  }, {timestamps: true});


  var hospital = Mongoose.model('hospital', HospitalSchema);
 
// Export Hospital Model
module.exports = hospital;

