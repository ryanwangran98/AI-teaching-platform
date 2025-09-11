import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 发送邮件的接口
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// 发送邮件函数
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('邮件已发送:', info.messageId);
  } catch (error) {
    console.error('发送邮件失败:', error);
    throw error;
  }
};

// 发送欢迎邮件
export const sendWelcomeEmail = async (email: string, username: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: '欢迎加入AI教学平台',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">欢迎加入AI教学平台！</h2>
        <p>亲爱的 ${username}，</p>
        <p>感谢您注册AI教学平台。您的账号已成功创建。</p>
        <p>现在您可以：</p>
        <ul>
          <li>浏览丰富的课程资源</li>
          <li>参与互动式学习</li>
          <li>获得AI个性化学习建议</li>
          <li>与教师和同学交流讨论</li>
        </ul>
        <p>祝您学习愉快！</p>
        <p>AI教学平台团队</p>
      </div>
    `,
  });
};

// 发送作业通知邮件
export const sendAssignmentNotification = async (
  email: string,
  studentName: string,
  assignmentTitle: string,
  dueDate: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `新作业通知：${assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">新作业通知</h2>
        <p>亲爱的 ${studentName}，</p>
        <p>您有新的作业需要完成：</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">${assignmentTitle}</h3>
          <p><strong>截止日期：</strong> ${dueDate}</p>
        </div>
        <p>请及时登录平台完成作业。</p>
        <p>祝您学习愉快！</p>
        <p>AI教学平台团队</p>
      </div>
    `,
  });
};