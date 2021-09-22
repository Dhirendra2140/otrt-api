const express = require('express');
const Router = express.Router();

const hospitalController = require(`../controllers/hospital.controller`);
const { hospitalValidator } = require(`../validators/index`);


Router.post(`/save` , hospitalValidator.validateHospital, hospitalController.signUp);

Router.post(`/login`, hospitalValidator['authToken'] , hospitalController.login);

Router.get('/logout', hospitalValidator['logout'] , hospitalController.logout);

Router.put(`/changePassword`, hospitalValidator['changePassword'] , hospitalController.changePassword);

Router.put('/', hospitalValidator['editProfile'] , hospitalController.editUserProfile);

Router.post('/generateCode', hospitalValidator['generateCode'] , hospitalController.generateCodeForForgotPassword);

Router.get('/getAll' , hospitalController.getAllHospitals);


module.exports = Router;