const Joi = require(`joi`);
const {setValidationErrorResponse} = require(`../services/api-handler`);

module.exports = {
  authToken: (req, res, next) => {
    const authToken = Joi.object().keys({
      email: Joi.string().required().error(new Error(`Email is required`)),
      password: Joi.string().required().error(new Error(`Password is required`))
    });
    Joi.validate(req.body, authToken, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  signUp: (req, res, next) => {
    const signUp = Joi.object().keys({
      firstName: Joi.string().required().error(new Error(`First name is required`)),
      lastName: Joi.any(),
      email: Joi.string().required().error(new Error(`Email is required`)),
      roleName: Joi.any(),
      password: Joi.string().required().error(new Error(`PAsword is required`)),
    });

    Joi.validate(req.body, signUp, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  logout: (req, res, next) => {
    const logout = Joi.object().keys({
      device_token: Joi.any()
    });
    Joi.validate(req.query, logout, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  generateCode: (req, res, next) => {
    const generateCode = Joi.object().keys({
      email: Joi.string().required().error(new Error(`Email is required`))
    });
    Joi.validate(req.body, generateCode, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  forgotPassword: (req, res, next) => {
    const forgotPassword = Joi.object().keys({
      verification_code: Joi.string().required().error(new Error(`Verification code is required`)),
      password: Joi.string().required().error(new Error(`Password is required`))
    });
    Joi.validate(req.body, forgotPassword, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  changePassword: (req, res, next) => {
    const changePassword = Joi.object().keys({
      oldPassword: Joi.string().required().error(new Error(`Old password is required`)),
      newPassword: Joi.string().required().error(new Error(`New password is required`))
    });
    Joi.validate(req.body, changePassword, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  editProfile: (req, res, next) => {
    const editProfile = Joi.object().keys({
      firstName: Joi.string().required().error(new Error(`First name is required`)),
      lastName: Joi.string().required().error(new Error(`Last name is required`))
    });
    Joi.validate(req.body, editProfile, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  fetchUsers: (req, res, next) => {
    console.log('query', req.query);
    const fetchUsers = Joi.object().keys({
      limit: Joi.string().required().error(new Error(`Page limit is required`)),
      page_no: Joi.string().required().error(new Error(`Page number is required`)),
      key: Joi.any(),
      order: Joi.any(),
      pattern: Joi.any()
    });
    Joi.validate(req.query, fetchUsers, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  profile: (req, res, next) => {
    const profile = Joi.object().keys({});
    Joi.validate(req.query, profile, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },

  address: (req, res, next) => {
    const address = Joi.object().keys({
      latitude: Joi.string().required().error(new Error(`Latitude is required`)),
      longitude: Joi.string().required().error(new Error(`Longitude is required`))
    });
    Joi.validate(req.query, address, err => {
      if (err) {
        setValidationErrorResponse(req, res, err.message);
      } else {
        next();
      }
    });
  },
};
