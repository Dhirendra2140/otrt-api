const nodemailer = require(`nodemailer`);
const Promise = require(`bluebird`);
const { mailServer, gMailServer, sparkPostAPIkey } = require(`../config/config`);
const sgTransport = require(`nodemailer-sendgrid-transport`);
const stringConstant = require(`../helpers/success-constants`);
const {ERROR_WHILE_MAIL_SENDING} = require(`../helpers/error-keys`);

const options = {
  auth: {
    api_user: mailServer.user_id,
    api_key: mailServer.password
  }
};

/**
 * create reusable transporter object using the default SMTP transport
 */
const transporter = nodemailer.createTransport(sgTransport(options));

const gmailTransporter = nodemailer.createTransport({
  service: `Gmail`,
  auth: {
    user: gMailServer.user_id,
    pass: gMailServer.password
  }
});



/**
 * Method to send email notification
 * @param to
 * @param html
 * @param subject
 */
module.exports.sendMail = ({to, html, subject}) => new Promise((resolve, reject) => {
  let text = html;
  const mailOptions = {
    to,
    subject,
    html,
    text,
    from: stringConstant.SENDER_EMAIL
  };
  // Send composed mail using sendgrid`s sendMail method.
  gmailTransporter.sendMail(mailOptions, function(error, info) {
    if(error){
      console.log('===========', error)
      reject({ message: ERROR_WHILE_MAIL_SENDING })
    } else {
      resolve({ message: info.message });
    }
  }
)});
