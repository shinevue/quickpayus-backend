import { sendEmail, emailTemplates } from '../utils/sendEmail';

sendEmail({
  ...emailTemplates.otpEmailConfirm,
  email: 'chris.cso1011@gmail.com',
  templateData: {
    username: 'Han',
    otp_code: '123',
    expire_time: 1000,
  },
});
