const sendEmail = async (options) => {
    const nodemailer = require("nodemailer");
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT, // if secure is true port should be 465, if false 587
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    // define email options
    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    // send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;