import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!config.SMTP_HOST || !config.SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    },
    // Hạn chế timeout dài khi SMTP lỗi
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  return transporter;
}

/**
 * Gửi email chứa liên kết đặt lại mật khẩu
 * @param {string} toEmail - Địa chỉ email người nhận
 * @param {string} resetUrl - Đường dẫn khôi phục đầy đủ
 * @param {string} userName - Tên người dùng
 */
export async function sendPasswordResetEmail(toEmail, resetUrl, userName = 'Bạn') {
  const mailTransport = getTransporter();

  // Kiểm tra xem máy chủ SMTP đã được cấu hình hay chưa
  if (!mailTransport) {
    if (config.DEV_MODE_ALLOW_CONSOLE_EMAIL) {
      console.log('\n======================================================');
      console.log('🔔 [CHẾ ĐỘ DEV - EMAIL KHÔI PHỤC MẬT KHẨU]');
      console.log(`Người nhận: ${toEmail} (${userName})`);
      console.log(`Liên kết khôi phục (Hết hạn trong 15 phút):`);
      console.log(`👉 ${resetUrl}`);
      console.log('======================================================\n');
      return { success: true, mode: 'dev_console', resetUrl };
    }

    throw new Error(
      'Dịch vụ gửi email chưa được cấu hình SMTP (thiếu SMTP_HOST hoặc SMTP_USER trong file .env). ' +
      'Vui lòng cấu hình thông tin SMTP để gửi email thực tế đến người dùng.'
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Khôi phục mật khẩu - PetCare PRO AI</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f7f5; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0f2c22, #184232); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo-badge { display: inline-block; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .title { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); }
        .warning-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 10px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px; }
        .link-fallback { font-size: 11px; color: #64748b; word-break: break-all; margin-top: 16px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-badge">PetCare PRO AI Security</div>
          <h1 class="title">Yêu Cầu Đặt Lại Mật Khẩu</h1>
        </div>
        <div class="content">
          <p class="greeting">Xin chào ${userName},</p>
          <p class="desc">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PetCare PRO AI gắn với email <strong>${toEmail}</strong>.
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Đặt lại mật khẩu của bạn</a>
          </div>
          <div class="warning-box">
            ⏱ <strong>Lưu ý quan trọng:</strong> Liên kết này chỉ có giá trị trong vòng <strong>15 phút</strong> và chỉ sử dụng được <strong>duy nhất 1 lần</strong>.
          </div>
          <p class="desc" style="font-size: 13px; margin-bottom: 8px;">
            Nếu bạn không bấm được vào nút phía trên, hãy sao chép và dán liên kết sau vào trình duyệt:
          </p>
          <div class="link-fallback">${resetUrl}</div>
          <p class="desc" style="font-size: 12px; margin-top: 24px; color: #94a3b8;">
            * Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này. Mật khẩu của bạn sẽ không bị thay đổi.
          </p>
        </div>
        <div class="footer">
          Hệ sinh thái chăm sóc thú cưng thông minh PetCare PRO AI 2026<br/>
          Đây là email tự động, vui lòng không trả lời trực tiếp email này.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Xin chào ${userName},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PetCare PRO AI của bạn (${toEmail}).
Vui lòng truy cập liên kết dưới đây để đặt lại mật khẩu mới:

${resetUrl}

LƯU Ý: Liên kết này chỉ có hiệu lực trong 15 phút và chỉ được dùng 1 lần.
Nếu bạn không yêu cầu, vui lòng bỏ qua thư này.

Hệ sinh thái PetCare PRO AI.
  `.trim();

  try {
    const info = await mailTransport.sendMail({
      from: config.EMAIL_FROM,
      to: toEmail,
      subject: '[PetCare PRO AI] Đặt lại mật khẩu tài khoản của bạn',
      text: textContent,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Lỗi khi gửi email qua SMTP:', error);
    throw new Error(`Gửi email thất bại: ${error.message || 'Lỗi kết nối máy chủ thư SMTP'}`);
  }
}
