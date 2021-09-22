let Joi = require(`joi`);
module.exports = {

    validateHospital: (req, res, next) => {
         
        const validateHospital = Joi.object().keys({
          Hospitalcode: Joi.required().error(new Error(`id is required`)),
          Name: Joi.string().required().error(new Error(`Name is required`)),
          zipCode: Joi.string().required().error(new Error(`ZipCode is required`))
        });
    

        Joi.validate(req.body , validateHospital, err => {
          if (err) {
            console.log("+++++=========>> validation  " , err.message);
            return res.json(err.message);
          } else {
            return next();
          }
        });
      }
}