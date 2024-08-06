import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs/promises';

interface EmailOptions {
  email: string;
  subject: string;
  message?: string;
  templatePath?: string;
  templateData?: Record<string, any>;
}

interface EmailContent {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const sendEmail = async (
  options: EmailOptions,
  otp?: string,
): Promise<void> => {
  try {
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: 'timons128@outlook.com',
        pass: 'Timon2000220',
      },
    });

    const mailOptions: EmailContent = {
      from: 'timons128@outlook.com',
      to: options.email,
      subject: options.subject,
      text: options?.message || `Your opt code is ${otp}`,
    };

    if (options.templatePath && options.templateData) {
      const template = await fs.readFile(options.templatePath, 'utf-8');

      const html = ejs.render(template, options.templateData);

      mailOptions.html = html;
    }

    if (options.message) {
      mailOptions.text = options.message;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// send warning mail part
const sendWarningEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: 'timons128@outlook.com',
        pass: 'Timon2000220',
      },
    });

    const mailOptions: EmailContent = {
      from: 'timons128@outlook.com',
      to: options.email,
      subject: options.subject,
      text: 'If you login in 14 days again,  your account will be re alive. But not, it will be deleted forever',
    };

    if (options.templatePath && options.templateData) {
      const template = await fs.readFile(options.templatePath, 'utf-8');

      const html = ejs.render(template, options.templateData);

      mailOptions.html = html;
    }

    if (options.message) {
      mailOptions.text = options.message;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const emailTemplates: Record<string, any> = {
  otpEmailConfirm: {
    templatePath: './utils/emailTemplates/otpEmailConfirm.ejs',
    subject: 'Confirm Your Email Address for QUICKPAYUS',
  },
  emailSuccessCreation: {
    templatePath: './utils/emailTemplates/emailSuccessCreation.ejs',
    subject: 'Welcome to QUICKPAYUS!',
  },
  otpResetPassword: {
    templatePath: './utils/emailTemplates/otpResetPassword.ejs',
    subject: 'Reset Your QUICKPAYUS Password',
  },
  depositApproved: {
    templatePath: './utils/emailTemplates/depositApproved.ejs',
    subject: 'Deposit Confirmation',
  },
  depositRejected: {
    templatePath: './utils/emailTemplates/depositRejected.ejs',
    subject: 'Deposit Rejection Notification',
  },
  kycApproved: {
    templatePath: './utils/emailTemplates/kycApproved.ejs',
    subject: 'KYC Verification Completed Successfully',
  },
  kycRejected: {
    templatePath: './utils/emailTemplates/kycRejected.ejs',
    subject: 'KYC Verification Rejected',
  },
  otpWithdrawConfirm: {
    templatePath: './utils/emailTemplates/otpWithdrawConfirm.ejs',
    subject: 'Confirm Your Withdrawal Request',
  },
  withdrawApproval: {
    templatePath: './utils/emailTemplates/withdrawApproval.ejs',
    subject: 'Withdrawal Request Approved',
  },
  withdrawRejected: {
    templatePath: './utils/emailTemplates/withdrawRejected.ejs',
    subject: 'Withdrawal Request Rejected',
  },
  rankRewardsRequest: {
    templatePath: './utils/emailTemplates/rankRewardsRequest.ejs',
    subject: 'Request for Rank Rewards Verification',
  },
  rankRewardsApproved: {
    templatePath: './utils/emailTemplates/rankRewardsApproved.ejs',
    subject: 'Rank Rewards Approved',
  },
  rankRewardsRejected: {
    templatePath: './utils/emailTemplates/rankRewardsRejected.ejs',
    subject: 'Rank Rewards Rejection Notification',
  },
  rankPromotion: {
    templatePath: './utils/emailTemplates/rankPromotion.ejs',
    subject: 'Congratulations on Your Rank Promotion!',
  },
  rankDemotion: {
    templatePath: './utils/emailTemplates/rankDemotion.ejs',
    subject: 'Notification of Rank Demotion',
  },
  inactiveAccountRemind: {
    templatePath: './utils/emailTemplates/inactiveAccountRemind.ejs',
    subject: 'Action Required: Reactivate Your QUICKPAYUS Account',
  },
  accountCloseConfirm: {
    templatePath: './utils/emailTemplates/accountCloseConfirm.ejs',
    subject: 'Account Closure Confirmation',
  },
  accountSuspension: {
    templatePath: './utils/emailTemplates/accountSuspension.ejs',
    subject: 'Account Suspension Notice',
  },
  accountDeleted: {
    templatePath: './utils/emailTemplates/accountDeleted.ejs',
    subject: 'Account Deletion Confirmation',
  },
  supportHelp: {
    templatePath: './utils/emailTemplates/supportHelp.ejs',
    subject: "Need Assistance? We're Here to Help!",
  },
  feedback: {
    templatePath: './utils/emailTemplates/feedback.ejs',
    subject: 'Share Your Feedback with Us',
  },
};

export { emailTemplates, sendEmail, sendWarningEmail };
