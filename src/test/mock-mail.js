const { sendEmail, emailTemplates } = require("../utils/sendEmail");

sendEmail({
    email: 'chris.cso1011@gmail.com',
    templateData: {
        username: 'Han',
        otp_code: '123',
        expire_time: 1000
    },
    ...emailTemplates.otpEmailConfirm
});