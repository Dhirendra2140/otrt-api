const Express = require(`express`);
const Router = Express.Router();
const userController = require(`../controllers/user.controller`);
const { userValidator } = require(`../validators/index`);


Router.post(`/signup` , userValidator['signUp'], userController.signUp);

Router.post(`/login`, userValidator['authToken'], userController.login);

Router.get('/logout', userValidator['logout'], userController.logout);

Router.put(`/changePassword`, userValidator['changePassword'], userController.changePassword);

Router.put('/', userValidator['editProfile'], userController.editUserProfile);

Router.post('/generateCode', userValidator['generateCode'], userController.generateCodeForForgotPassword);

Router.get('/getAll' , userController.getAllUser);

module.exports = Router;
