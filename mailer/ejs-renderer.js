// Custom include
const ejs = require(`ejs`);
const path = require(`path`);
const Promise = require(`bluebird`);
const { INVALID_EMAIL_TEMPLATE } = require(`../helpers/error-keys`);
const { sendMail } = require(`./mailer`);
// Absolute path of base template
const baseTemplate = path.join(__dirname, `.`, `..`, `mailer`, `templates`, `base-template.ejs`);

/**
 * Method to generate HTML template using EJS
 * @param data
 * @param filename
 * @param to
 * @param subject
 */
module.exports.generateEJSTemplate = ({ data, filename, to, subject }) => {
    // Use ejs renderFile method to generate HTML template
    // Used path module to generate absolute path for base-template.ejs file
    // Passed required data to the email template
    return new Promise((resolve, reject) => {
        /**
         * Generate mail template and pass that template to send mail method
         * Return Promise
         */
        ejs.renderFile(baseTemplate, {
            data,
            filename
        }, (err, html) => err
            ? reject({ message: INVALID_EMAIL_TEMPLATE })
            : sendMail({ to, html, subject })
                .then(success => resolve(success))
                .catch(err => reject(err)));
    });
};
