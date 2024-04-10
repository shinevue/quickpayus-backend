const nodeMailer = require("nodemailer");
const ejs = require("ejs");
const fs = require("fs").promises;

const sendEmail = async (options) => {
  try {
    // Create a nodemailer transporter
    const transporter = nodeMailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    const template = await fs.readFile(options.templatePath, "utf-8");

    const html = ejs.render(template, options.templateData);

    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: options.email,
      subject: options.subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
