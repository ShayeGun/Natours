const nodemailer = require('nodemailer');

const sendMail = async (option) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: `"This is God 👽" <admin@gmail.com>`, // sender address
    to: option.email, // list of receivers
    subject: option.subject, // Subject line
    text: option.message, // plain text body
  });
};

module.exports = sendMail;
