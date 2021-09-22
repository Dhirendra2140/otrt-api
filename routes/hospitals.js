const express = require('express');
const Router = express.Router();

const hospitalController = require(`../controllers/hospital.controller`);
const hospitalValidator = require(`../validators/index`);


Router.post(`/save` , hospitalValidator.hospitalValidator.validateHospital, hospitalController.saveHospital);

Router.get('/', hospitalController.getAll);

Router.put('/update/:id', hospitalController.updateById);

module.exports = Router;