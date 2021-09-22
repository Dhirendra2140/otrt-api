// Custom include
const Passport = require(`passport`);
const fs = require(`fs`);
const {Strategy: LocalStrategy} = require(`passport-local`);
const {setSuccessResponse, setErrorResponse} = require(`../services/api-handler`);
const {getLoginToken} = require(`../helpers/jwt`);
const Promise = require(`bluebird`);
const {generateFilename, toTitleCase, getAgeFromDOB} = require(`../helpers/util`);
const {REGISTRATION_SUBJECT, FORGOT_PASSWORD_SUBJECT} = require(`../helpers/mail-subjects`);
const {sendVerificationCode} = require(`../mailer/mailer`);
const {generateEJSTemplate} = require(`../mailer/ejs-renderer`);
const randomString = require(`randomstring`);
const {changeString} = require(`change-case`);
const stringConstant = require(`../helpers/success-constants`);
const {pageSize: defaultPageSize, pageNumber: defaultPageNumber, bingMapsKey, uploads: {appLogoImageURL}} = require(`../config/config`);
const request = require(`request`);
const model = require(`../models/index`);
const {isEmptyOrNull, isPositiveInteger, isNotEmail, isNotMongoId} = require(`../helpers/validation`);
const ERROR = require(`../helpers/error-keys`);


/**
 * API to sign up of user to app.
 * @param req
 * @param res
 */
 exports.signUp = (req, res) => {
  let {
    body: {
      firstName,
      lastName,
      email,
      deviceToken,
      udId,
      deviceOs,
      roleName,
      birthDate,
      password
    }
  } = req;

  if (isEmptyOrNull(firstName)
    || isEmptyOrNull(lastName)) {
    setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res);
  } else if (isNotEmail(email)) {
    setErrorResponse(null, ERROR.INVALID_EMAIL_ADDRESS, res);
  } else {
    model.role.getRole(roleName, (err, userRoleData) => {
      if (err) {
        setErrorResponse(err, ERROR.GETTING_DATA, res);
      } else if (!userRoleData) {
        setErrorResponse(null, ERROR.NO_USER_ROLE_FOUND_IN_DATABASE, res);
      } else {
        let roles = [{role: userRoleData._id, name: userRoleData.name}];
        const createUser = {
          basic: {
            firstName, lastName, email, birthDate, password, roles
          },
          isActive: true
        };

        model.hospitals.createUser(createUser, (err, user) => {
          
          if (err) {
            if (err.code === 11000) {
              console.log(' error is==>>>>>>>>',err)
              setErrorResponse(err, ERROR.EMAIL_ALREADY_EXIST, res);
            } else {
              console.log(' error is==>>>>>>>>',err)
              setErrorResponse(null, ERROR.GETTING_DATA, res);
            }
          } else {
            
            const token = getLoginToken({id: user._id, date: Date.now()});
            const newDevice = {
              userId: user._id,
              email,
              deviceToken,
              udId,
              deviceOs
            };
            /**
             * Create device.
             */
            model.deviceDetail.createDevice(newDevice, err => {
              if (err) {
                user.remove();
                setErrorResponse(err, ERROR.GETTING_DATA, res);
              } else {
                console.log('I am here')
                /**
                 * Send sign up mail to the user.
                 */
                generateEJSTemplate({
                  data: {
                    username: toTitleCase(firstName)
                  },
                  filename: `sign-up`,
                  to: email,
                  subject: REGISTRATION_SUBJECT
                })
                .then(success => {
                  // Send success response
                  setSuccessResponse({user: success, token}, res, req);
                })
                .catch(err => {
                  console.log('==>>>>>>>>',err);
                  // Send error response
                  user.remove();
                  setErrorResponse(err, ERROR.ERROR_IN_USER_ADDITION, res);
                });
              }
            });
          }
        });
      }
    });
  }
};

/**
 * Local authentication
 * Define the parameter in req.body that passport can use as username and password
 */
 Passport.use(new LocalStrategy({
  usernameField: `email`,
  passwordField: `password`
}, (email, password, done) => {
  model.hospitals.getUserByEmail(email, (err, user) => {
    console.log('---')
    if (err || !user) {
      return done(err, false, ERROR.INVALID_USER);
    } else {
      if (user.isActive) {
        /**
         * Check if given password is correct.
         */
        model.hospitals.comparePassword(password, user.basic.password, (err, isMatch) => {
          if (err) {
            return done(err, false, ERROR.GETTING_DATA);
          } else if (isMatch) {

            return done(null, user);
          }
          return done(null, false, ERROR.PASSWORD_DOES_NOT_MATCH);
        });
      } else {
        return done(null, false, ERROR.NOT_ACTIVE_USER);
      }
    }
  });
}));

/**
 * API to login in the app.
 * @param req
 * @param res
 * @param next
 */
exports.login = (req, res, next) => {
  const {
    body: {
      deviceToken,
      deviceOs,
      udId,
      email,
      password
    }
  } = req;
  if (isEmptyOrNull(password) || isEmptyOrNull(email)) {
    setErrorResponse(null, ERROR.EMPTY_STRING, res);
  } else if (isNotEmail(email)) {
    setErrorResponse(null, ERROR.INVALID_EMAIL_ADDRESS, res);
  } else {
    Passport.authenticate(`local`, (err, user, info) => {
      if (!err && !user && info) {
        setErrorResponse(null, info, res);
      } else if (!user) {
        setErrorResponse(null, ERROR.LOGIN_FAILED, res);
      } else {
        const {
          _id: userId,
          basic: {
            roles: [{name: roleName}]
          },
        } = user;
        /*
         * To generate Login token for User
         * */
        const token = getLoginToken({id: userId, date: Date.now()});
        model.deviceDetail.searchDeviceDetails(userId, deviceToken, (err, deviceData) => {
          if (err) {
            setErrorResponse(err, ERROR.GETTING_DATA, res);
          } else if (deviceData.length !== 0) {
            setSuccessResponse({token, user}, res, req);
          } else {
            const newDevice = {
              userId,
              udId,
              email: lowerCase(email),
              deviceToken,
              deviceOs
            };
            model.deviceDetail.createDevice(newDevice, err => {
              if (err) {
                setErrorResponse(err, ERROR.STORING_DATA, res);
              } else {
                setSuccessResponse({token, user}, res, req);
              }
            });
          }
        });
      }
    })(req, res, next);
  }
};

/**
 * API to Verification token code in the app.
 * @param req
 * @param res
 * @param next
 */
exports.verifyToken = (req, res, next) => {
  const {
    body: {
      email,
      password,
      verificationToken
    }
  } = req;
  if (isEmptyOrNull(password) || isEmptyOrNull(email)) {
    setErrorResponse(null, ERROR.EMPTY_STRING, res);
  } else if (isNotEmail(email)) {
    setErrorResponse(null, ERROR.INVALID_EMAIL_ADDRESS, res);
  } else if (isEmptyOrNull(verificationToken)) {
    setErrorResponse(null, ERROR.VERIFICATION_CODE_ERROR, res);
  } else {
    model.hospitals.getEmail(email, (err, userDetails) => {
      if (err) {
        setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req);
      } else if (!err && !userDetails) {
        setErrorResponse(null, ERROR.INVALID_USER, res, req);
      } else if (userDetails.userStatus != 'Not Verified') {
        setErrorResponse(null, ERROR.EMAIL_ALREADY_VERIFIED, res, req);
      } else {
        model.verificationCode.getUserByVerificationToken(verificationToken, userDetails._id, (err, userData) => {
          if (err) {
            setErrorResponse(err, ERROR.GETTING_DATA, res);
          } else if (!userData) {
            setErrorResponse(null, ERROR.CODE_EXPIRED, res);
          } else {
            userDetails.basic['password'] = password;
            userDetails.basic['isActive'] = true;
            userDetails['userStatus'] = 'Current';
            userDetails.save()
            .then((updatedUserData) => {
              /*
               * To set verificationCode  when user is verified
               * */
              userData.verificationCode = null;
              userData.save();
              const token = getLoginToken({id: userDetails._id, date: Date.now()});
              // To send success response
              setSuccessResponse({token, user: updatedUserData}, res, req);
            })
            .catch((err) => {
              setErrorResponse(null, ERROR.UNABLE_UPDATE_PROFILE, res, req);
            });
          }
        });
      }
    });
  }
};

/**
 * API to fetch all clients for Staff.
 * @param req
 * @param res
 */
exports.getAllHospitals = (req, res) => {
  let {
    query: {
      limit = defaultPageSize,
      pageNumber = defaultPageNumber,
      key = 0,
      order = -1,
      pattern,
      sortOrder,
      sortParameter,
      skip,
      role
    }
  } = req;
  limit = parseInt(limit);
  skip = parseInt(skip);
  let userId = req.user.id;
  pageNumber = parseInt(pageNumber);
  let sortKey = sortOrder ? parseInt(sortOrder) : -1;
  if (skip == 0) {
    skip = 0;
  }
  let sortParamKey = sortParameter ? sortParameter : 'updatedAt';

  if (sortParamKey === 'firstName') {
    sortParamKey = 'basic.firstName';
  }
  if (sortParamKey === 'userStatus') {
    sortParamKey = 'userStatus';
  }
  const sortCondition = {[sortParamKey]: sortKey};
  model.hospitals.getAllUsers({pageNumber, limit, key, order, pattern, sortCondition, skip, role, userId}, (err, clientList) => {
    if (err || !clientList) {
      setErrorResponse(err, ERROR.GETTING_DATA, res);
    } else {
      setSuccessResponse({users: clientList}, res, req);
    }
  });
};

/**
 * API to logout from the app.
 * @param req
 * @param res
 */
exports.logout = (req, res) => {
  const {
    user: {_id: userId},
    body: {device_token: deviceToken}
  } = req;
  model.deviceDetail.deleteDeviceToken(userId, deviceToken, (err, deviceData) => {
  });
  req.logout();
  setSuccessResponse({message: stringConstant.LOGOUT_SUCCESS}, res, req);
};

/**
 * API to change user password.
 * @param req
 * @param res
 */
exports.changePassword = (req, res) => {
  const {
    body: {
      oldPassword,
      newPassword
    },
    user: authUser
  } = req;

  if (isEmptyOrNull(oldPassword) || isEmptyOrNull(newPassword)) {
    setErrorResponse(null, ERROR.EMPTY_STRING, res);
  } else {
    model.hospitals.comparePassword(oldPassword, authUser.basic.password, (err, isMatch) => {
      /**
       * Check if given password is correct.
       */
      if (err) {
        setErrorResponse(err, ERROR.GETTING_DATA, res);
      } else if (!isMatch) {
        /**
         * Check if given password is not correct.
         */
        setErrorResponse(null, ERROR.PASSWORD_MISMATCH_ERROR, res);
      } else {
        authUser.basic.password = newPassword;
        authUser.save();
        setSuccessResponse({
          message: stringConstant.PASSWORD_UPDATED
        }, res, req);
      }
    });
  }
};

/**
 * API to edit user profile.
 * @param req
 * @param res
 */
exports.editUserProfile = (req, res) => {
  const {
    user: authUser,
    body: {
      firstName,
      lastName
    }
  } = req;
  if (isEmptyOrNull(firstName) || isEmptyOrNull(lastName)) {
    setErrorResponse(null, ERROR.EMPTY_STRING, res);
  } else {
    authUser.basic.firstName = firstName;
    authUser.basic.lastName = lastName;
    // Save user details
    authUser.save((err, userData) => {
      if (err) {
        // Something went wrong
        setErrorResponse(err, ERROR.STORING_DATA, res);
      } else {
        authUser.basic.password = null;
        setSuccessResponse({user: authUser.basic}, res, req);
      }
    });
  }
};

/**
 * API to fetch user profile details.
 * @param req
 * @param res
 */
exports.getProfile = (req, res) => {
  const {userId} = req.params;
  model.hospitals.getUserById(userId || req.user._id, (err, user) => {
    if (err) {
      setErrorResponse(err, ERROR.GETTING_DATA, res);
    } else {
      user.basic.password = null;
      setSuccessResponse(user, res, req);
    }
  });
};

/**
 * API to fetch agents list for broker.
 * @param req
 * @param res
 */
exports.getAgents = (req, res) => {
  model.hospitals.getAgents(req.params.brokerId, (err, agentList) => {
    if (err || !agentList) {
      setErrorResponse(err, ERROR.FETCHING_AGENTS_ERROR, res);
    } else {
      setSuccessResponse(agentList, res, req);
    }
  });
};

/**
 * API to upload logo for  client.
 * @param req
 * @param res
 */
exports.uploadLogo = (req, res) => {
  const {
    user,
    body: {
      logoImage, themeColor
    }
  } = req;

  const saveUser = (user) => {
    user.save(err => {
      if (err) {
        setErrorResponse(err, ERROR.STORING_DATA, res);
      } else {
        setSuccessResponse(user, res, req);
      }
    });
  };

  if (logoImage && !logoImage.includes(appLogoImageURL)) {
    const {url, base64} = generateFilename(logoImage, false, false);
    fs.writeFile(`.${url}`, base64, `base64`, err => {
      if (err) {
        setErrorResponse(err, ERROR.IMAGE_FILE_ERROR, res);
      } else {
        user.themeColor = themeColor;
        user.appLogo = url;
        saveUser(user);
      }
    });
  } else {
    user.themeColor = themeColor;
    saveUser(user);
  }
};

/**
 * API to upload profile photo for user.
 * @param req
 * @param res
 */
exports.uploadProfilePic = (req, res) => {
  const {
    user,
    body: {profileImage}
  } = req;
  const {url, base64} = generateFilename(profileImage, true, false);
  fs.writeFile(`.${url}`, base64, `base64`, err => {
    if (err) {
      setErrorResponse(err, ERROR.IMAGE_FILE_ERROR, res);
    } else {
      user.basic.profileImageURL = url;
      user.save(err => {
        if (err) {
          setErrorResponse(err, ERROR.STORING_DATA, res);
        } else {
          setSuccessResponse(user, res, req);
        }
      });
    }
  });
};

/**
 * API to generate verification code for update password.
 * @param req
 * @param res
 */
exports.generateCodeForForgotPassword = function (req, res) {
  let email = req.body.email,
    verifyCode,
    newCode;
  if (isNotEmail(email)) {
    setErrorResponse(null, ERROR.INVALID_EMAIL_ADDRESS, res);
  } else {
    model.hospitals.getEmail(email, (err, user) => {
      if (err) {
        setErrorResponse(null, ERROR.GETTING_DATA, res);
      } else if (!err && !user) {
        setErrorResponse(null, ERROR.INVALID_USER, res);
      } else {
        verifyCode = randomString.generate(6);
        model.verificationCode.getCodeDetailsByUserId(user._id, (codeData) => {
          if (!codeData || codeData == null) {
            newCode = new model.verificationCode({
              user: user,
              verificationCode: verifyCode
            });
            model.verificationCode.createCode(newCode, (success) => {
            });
          } else {
            codeData.verificationCode = verifyCode;
            codeData.save();
          }
          /**
           * Send sign up mail to the user.
           */
          generateEJSTemplate({
            data: {
              email,
              verifyCode,
              userName: toTitleCase(user.basic.firstName)
            },
            filename: `forgot-password`,
            to: email,
            subject: REGISTRATION_SUBJECT
          })
          .then(function (success) {
            setSuccessResponse({message: 'Code generated successfully. Now please submit this code with the new password to reset your password.'}, res, req);
          })
          .catch(function (err) {
            setErrorResponse(err, ERROR.ERROR_WHILE_MAIL_SENDING, res);
          });
        });
      }
    });
  }
};

/**
 * API to update password after receiving verification code to the user.
 * @param req
 * @param res
 */
exports.forgotPassword = function (req, res) {
  let verifyCode = req.body.verification_code,
    password = req.body.password;
  model.verificationCode.getUserByVerificationToken(verifyCode, (userData) => {
    if (!userData) {
      setErrorResponse('TOKEN_EXPIRED', res, req);
    } else {
      model.hospitals.getUserById(userData.user, (userDetails) => {
        if (!userDetails) {
          setErrorResponse('INVALID_USER', res, req);
        } else {
          userDetails.basic.password = password;
          userDetails.save();

          userData.verificationCode = null;
          userData.save();
          setSuccessResponse({message: 'Successfully updated password, now please login with the new password.'}, res, req);
        }
      });
    }
  });
};


/**
 * API to update user status
 * @param req
 * @param res
 */
exports.updateUserStatus = (req, res) => {
  const {
    body: {
      sessionStatus,
      userStatus,
      userId,
      isSessionFlag,
      programName
    }
  } = req;

  let positionImageArray = [];
  if (isNotMongoId(userId)) {
    setErrorResponse(null, ERROR.PLEASE_PROVIDE_USER_ID, res);
  } else {
    model.hospitals.getUserDetails(userId, (err, userDetails) => {
      if (err || !userDetails) {
        setErrorResponse(null, ERROR.INVALID_USER, res);
      } else {
        userDetails.programName = programName;
        if (isSessionFlag) {
          userDetails.sessionStatus = sessionStatus;
        }
        if (!isSessionFlag) {
          userDetails.basic.isActive = userStatus;
          if (userStatus) {
            userDetails.userStatus = 'Current';
          } else {
            userDetails.userStatus = 'Past'
          }
        }
        userDetails.save()
        .then((updatedSuccess) => {
          // To send the success response of Position Images
          setSuccessResponse(updatedSuccess, res, req);
        })
        .catch((err) => {
          setErrorResponse(null, ERROR.UNABLE_TO_UPDATE_USER, res);
        });
      }
    });
  }
};