import nodemailer from 'nodemailer';

export class EmailService {
  private static get SMTP_USER() { return process.env.SMTP_USER || process.env.SENDER_EMAIL || ''; }
  private static get SMTP_PASS() { return process.env.SMTP_PASS || process.env.BREVO_API_KEY || ''; }
  private static get SENDER_EMAIL() { return process.env.SMTP_SENDER || process.env.SENDER_EMAIL || 'noreply@shopmanager.com'; }
  private static get SMTP_PORT() { return parseInt(process.env.SMTP_PORT || '2525', 10); }
  private static SENDER_NAME = 'Shop Manager';

  private static getTransporter() {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: this.SMTP_PORT,
      secure: this.SMTP_PORT === 465,
      auth: {
        user: this.SMTP_USER,
        pass: this.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  static async sendOTP(to: string, code: string, type: 'SIGNUP' | 'FORGOT_PASSWORD') {
    console.info('🔐 OTP for', to, ':', code);
    if (!this.SMTP_USER || !this.SMTP_PASS) {
      console.warn('SMTP credentials are not set. OTP would be:', code);
      return { success: true, message: 'Simulated email sent' };
    }

    const subject = type === 'SIGNUP' 
      ? 'Your Shop Manager Verification Code' 
      : 'Reset Your Shop Manager Password';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e40af; text-align: center;">Shop Manager</h2>
        <p style="color: #333; font-size: 16px;">Hello,</p>
        <p style="color: #333; font-size: 16px;">
          ${type === 'SIGNUP' 
            ? 'Thank you for signing up! Please use the verification code below to complete your registration.' 
            : 'We received a request to reset your password. Use the verification code below to proceed.'}
        </p>
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    const textContent = type === 'SIGNUP'
      ? `Hello, Thank you for signing up! Your verification code is: ${code}. This code will expire in 10 minutes.`
      : `Hello, We received a request to reset your password. Your verification code is: ${code}. This code will expire in 10 minutes.`;

    try {
      const transporter = this.getTransporter();
      
      const info = await transporter.sendMail({
        from: `"${this.SENDER_NAME}" <${this.SENDER_EMAIL}>`,
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      console.log('Message sent: %s', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('Email Service Error:', error);
      console.warn('Fallback: simulated OTP is', code);
      return { success: false, error };
    }
  }
}
