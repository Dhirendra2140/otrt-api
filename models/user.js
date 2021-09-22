// Custom include
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
const UserSchema = Mongoose.Schema({
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

UserSchema.pre(`save`, function (next) {
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

UserSchema.set(`toJSON`, {getters: true});
UserSchema.set(`toObject`, {getters: true});

// User Model
const User = Mongoose.model(`User`, UserSchema);

/**
 * Method to create new user.
 * @param newUser
 * @param callback
 */
User.createUser = (newUser, callback) => {
  User.create(newUser, callback);
};

/**
 * Method to get user by id.
 * @param id
 * @param callback
 */
User.getUserById = (id, callback) => {
  User.findById(id)
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
User.getUserByEmail = (email, callback) => {
  const condition = {'basic.email': email};
  User.findOne(condition)
  .populate({
    path: `basic.roles.role`,
    model: `role`
  })
  .exec(callback);
};

//Get user by email and status
User.getEmail = (email, callback) => {
  User.findOne({'basic.email': email}, callback);
};

/**
 * Method to get user details by id.
 * @param userId
 * @param callback
 */
User.getUserDetails = (userId, callback) => {
  User.findOne({_id: userId}, callback);
};

/**
 * Method to compare password.
 * @param candidatePassword
 * @param hash
 * @param callback
 */
User.comparePassword = (candidatePassword, hash, callback) => {
  Bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if (err) {
      throw err;
    }
    callback(null, isMatch);
  });
};

/**
 * Method to fetch user to check if email is in already use or not
 * @param userId
 * @param email
 * @param callback
 */
User.checkForEmailExist = (userId, email, callback) => {
  // Find single user to check if email id is taken by other user or not
  User.findOne({
      $and: [
        {_id: {$ne: ObjectId(userId)}},
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
User.getAllUsers = ({pageNumber, limit, key = 0, order = -1, pattern, sortCondition, skip, role, userId}, callback) => {
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
    users: User.aggregate(query)
    .sort(sortBy)
    .collation({locale: `en_US`, caseLevel: true, numericOrdering: true})
    .skip((pageNumber - 1) * limit)
    .limit(limit)
    .execAsync(),
    total: User.aggregate(query.concat({$count: `total`}))
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
User.getAgents = (brokerId, callback) => {
  User.find({
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
User.getUsers = ({ pageNumber, limit, key = 0, order = -1, pattern, sortCondition, skip, role, userId }, callback) => {

  let condition = {};
  let userIdQuery = { _id: {$ne: ObjectId(userId)} };

  if (pattern) {
    pattern = escapeStringRegexp(pattern);

    let userQueryArray = [];
    userQueryArray = [
      { 'basic.roles.name': role },
      {
        $or: [
          { fullName: new RegExp(pattern, `i`) },
          { 'basic.email': new RegExp(pattern, `i`) }
        ]
      }
    ];

    if (role === 'admin') {
      userQueryArray.push(userIdQuery);
      condition = {
        $and: userQueryArray
      };
    } else {
      condition = {
        $and: userQueryArray
      };
    }
  } else {
    let userQueryBaseOnRole = [];

    userQueryBaseOnRole = [
      { 'basic.roles.name': role}
    ];

    if (role === 'admin') {
      userQueryBaseOnRole.push({_id: {$ne: ObjectId(userId)}});
      condition = {
        $and: userQueryBaseOnRole
      }
    } else {
      condition = {
        $and: userQueryBaseOnRole
      }
    }
  }
  User.aggregate([
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
User.dashboardStats = (agentId, brokerId, callback) => {
  const query = agentId ? {agentId} : {brokerId};
  User.aggregate(
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
User.getUnPaidUsers = (expiryDate, callback) => {
  User.aggregate([
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
User.setInctive = (expiryDate, callback) => {
  User.update({
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
User.search = (query, callback) => {
  User.find(query, callback);
};

// Export User Model
module.exports = User;
