const Mongoose = require(`mongoose`);
const Bcrypt = require(`bcryptjs`);
const ObjectId = Mongoose.Types.ObjectId;
const stringConstant = require(`../helpers/success-constants`);
const Promise = require(`bluebird`);
const {userSort} = require(`../helpers/sort-mappings`);
const {host} = require(`../config/config`);
const escapeStringRegexp = require(`escape-string-regexp`);

// Apply promise
Promise.promisifyAll(Mongoose);

// User schema
const HospitalSchema = Mongoose.Schema({
  basic: {
    firstName: {
      type: String,
      lowercase: true,
      trim: true
    },
    lastName: {
      type: String,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      email: true
    },
    password: {
      type: String
    },
    birthDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: false
    },
    profileImageURL: {
      type: String,
      default: stringConstant.PROFILE_IMAGE_URL
    },
    roles: [
      {
        role: {
          type: Mongoose.Schema.ObjectId,
          ref: `Role`
        },
        name: {
          type: String
        }
      }
    ],
    mobileNumber: {
      type: String,
      default: ''
    },
    zipCode: {
      type: String
    },
    state: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  userStatus: {
    type: String,
    default: 'Not Verified'
  },
  positionImages: [
    {
      imagePath: {
        type: String
      },
      month: {
        type: Number
      },
      monthName: {
        type: String,
        default: ''
      },
      year: {
        type: Number
      },
      positionKey: {
        type: String
      },
      isFirstMonth: {
        type: Boolean,
        default: false
      },
      isFirstYear: {
        type: Boolean,
        default: false
      }
    }
  ],
  sessionStatus: {
    type: String,
    default: ''
  },
  programName: {
    type: String,
    default: ''
  }
}, {timestamps: true});

HospitalSchema.pre(`save`, function (next) {
  const self = this;
  if (this.basic.password && this.isModified(`basic.password`)) {
    Bcrypt.genSalt(10, function (err, salt) {
      Bcrypt.hash(self.basic.password, salt, function (err, hash) {
        self.basic.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

HospitalSchema.set(`toJSON`, {getters: true});
HospitalSchema.set(`toObject`, {getters: true});

// User Model
const Hospital = Mongoose.model(`Hospital`, HospitalSchema);

/**
 * Method to create new user.
 * @param newUser
 * @param callback
 */
 Hospital.createUser = (newHospital, callback) => {
  Hospital.create(newHospital, callback);
};

/**
 * Method to get user by id.
 * @param id
 * @param callback
 */
 Hospital.getHospitalById = (id, callback) => {
  Hospital.findById(id)
  .populate({
    path: `basic.roles.role`,
    model: `role`
  })
  .populate(
    {
      path: 'agentId',
      select: 'basic'
    })
  .populate(
    {
      path: 'planId',
      select: 'name'
    })
  .exec(callback);
};

/**
 * Method to get user by email.
 * @param email
 * @param callback
 */
 Hospital.getHospitalByEmail = (email, callback) => {
  const condition = {'basic.email': email};
  Hospital.findOne(condition)
  .populate({
    path: `basic.roles.role`,
    model: `role`
  })
  .exec(callback);
};

//Get user by email and status
Hospital.getEmail = (email, callback) => {
  Hospital.findOne({'basic.email': email}, callback);
};

/**
 * Method to get user details by id.
 * @param userId
 * @param callback
 */
 Hospital.getUserDetails = (userId, callback) => {
  Hospital.findOne({_id: userId}, callback);
};


/**
 * Method to fetch user to check if email is in already use or not
 * @param userId
 * @param email
 * @param callback
 */
 Hospital.checkForEmailExist = (hospitalId, email, callback) => {
  // Find single user to check if email id is taken by other user or not
  Hospital.findOne({
      $and: [
        {_id: {$ne: ObjectId(hospitalId)}},
        {'basic.email': email}
      ]
    }, callback
  );
};

/**
 * Method to fetch all users.
 * @param pageNumber
 * @param limit
 * @param key
 * @param order
 * @param pattern
 * @param callback
 */
 Hospital.getAllUsers = ({pageNumber, limit, key = 0, order = -1, pattern, sortCondition, skip, role, userId}, callback) => {
  let condition = {};
  let sortBy = {
    [userSort[key]]: order
  };
  if (pattern) {
    pattern = escapeStringRegexp(pattern);
    Object.assign(condition, {
      $or: [
        {fullName: new RegExp(pattern, `i`)},
        {'basic.email': new RegExp(pattern, `i`)}
      ]
    })
  }
  const query = [
    {
      $project: {
        basic: `$basic`,
        fullName: {$concat: [`$basic.firstName`, ` `, `$basic.lastName`]},
        location: `$location`
      }
    },
    {
      $match: condition
    }
  ];


  Promise.props({
    users: Hospital.aggregate(query)
    .sort(sortBy)
    .collation({locale: `en_US`, caseLevel: true, numericOrdering: true})
    .skip((pageNumber - 1) * limit)
    .limit(limit)
    .execAsync(),
    total: Hospital.aggregate(query.concat({$count: `total`}))
    .sort(sortBy)
    .collation({locale: `en_US`, caseLevel: true, numericOrdering: true})
    .execAsync()
  }).then(results => {
    callback(null, results);
  }).catch(err => {
    callback(err, null);
  });
};

/**
 * Method to fetch all agents for brokerID.
 * @param brokerId
 * @param callback
 */
 Hospital.getAgents = (brokerId, callback) => {
  Hospital.find({
    $and: [
      {"basic.roles.name": "agent"},
      {brokerId}
    ]
  }, callback)
};

/**
 * Method to fetch all client for given agentID and brokerID.
 * @param callback
 */
 Hospital.getUsers = ({ pageNumber, limit, key = 0, order = -1, pattern, sortCondition, skip, role, userId }, callback) => {

  let condition = {};
  let hospitalrIdQuery = { _id: {$ne: ObjectId(userId)} };

  if (pattern) {
    pattern = escapeStringRegexp(pattern);

    let hospitalQueryArray = [];
    hospitalQueryArray = [
      { 'basic.roles.name': role },
      {
        $or: [
          { fullName: new RegExp(pattern, `i`) },
          { 'basic.email': new RegExp(pattern, `i`) }
        ]
      }
    ];

    if (role === 'admin') {
      hospitalQueryArray.push(userIdQuery);
      condition = {
        $and: hospitalQueryArray
      };
    } else {
      condition = {
        $and: hospitalQueryArray
      };
    }
  } else {
    let hospitalQueryBaseOnRole = [];

    hospitalQueryBaseOnRole = [
      { 'basic.roles.name': role}
    ];

    if (role === 'admin') {
      hospitalQueryBaseOnRole.push({_id: {$ne: ObjectId(hospitalId)}});
      condition = {
        $and: hospitalQueryBaseOnRole
      }
    } else {
      condition = {
        $and: hospitalQueryBaseOnRole
      }
    }
  }
  Hospital.aggregate([
    {
      $project: {
        _id: `$_id`,
        basic: `$basic`,
        fullName: {$concat: [`$basic.firstName`, ` `, `$basic.lastName`]},
        email: `$basic.email`,
        firstName: `$basic.firstName`,
        lastName: `$basic.lastName`,
        createdAt: `$createdAt`,
        updatedAt: `$updatedAt`,
        isActive: `$basic.isActive`,
        userStatus: `$userStatus`,
        sessionStatus: `$sessionStatus`,
        positionImages: `$positionImages`,
        programName: `$programName`
      }
    },
    {
      $match: condition
    },
    {
      "$sort": sortCondition
    },
    {
      "$skip": skip
    },
    {
      "$limit": limit
    }
  ], callback);
};

/**
 * Method to fetch rolewise count for all the user.
 * @param callback
 */
 Hospital.dashboardStats = (agentId, brokerId, callback) => {
  const query = agentId ? {agentId} : {brokerId};
  Hospital.aggregate(
    [
      // Stage 1
      {
        $match: query
      },
      {
        $unwind: {
          path: "$basic.roles",
        }
      },
      // Stage 2
      {
        $project: {
          "roleName": "$basic.roles.name"
        }
      },
      // Stage 3
      {
        $group: {
          "_id": "$roleName",
          "count": {$sum: 1}
        }
      }

    ], callback);

};

/**
 * Method to fetch all users for planId.
 * @param planId
 * @param callback
 */
 Hospital.getUnPaidUsers = (expiryDate, callback) => {
  Hospital.aggregate([
    {
      $match: {
        $and: [
          {isActive: true},
          {isPaidMember: false},
          {planExpiry: {$lte: expiryDate}}
        ]
      }
    }, {
      $unwind: "$basic.roles"
    }, {
      $project: {
        "name": {$concat: [`$basic.firstName`, ` `, `$basic.lastName`]},
        "email": "$basic.email",
        "roleName": "$basic.roles.name",
        "planId": "$planId",
        "planExpiry": "$planExpiry",
      }
    }
  ], callback)
};


/**
 * Method to set users asa inactive.
 * @param userIdArray
 * @param callback
 */
 Hospital.setInctive = (expiryDate, callback) => {
  Hospital.update({
    $and: [
      {isActive: true},
      {isPaidMember: false},
      {planExpiry: {$lte: expiryDate}}
    ]
  }, {$set: {isActive: false}}, {multi: true}, callback)
};

/**
 * Method to search.
 * @param query
 * @param callback
 */
 Hospital.search = (query, callback) => {
  Hospital.find(query, callback);
};

// Export User Model
module.exports = Hospital;
