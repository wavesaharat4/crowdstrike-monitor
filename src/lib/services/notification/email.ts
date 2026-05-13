import nodemailer from 'nodemailer';

// ---------------------------------------------------------
//ฟังก์ชันส่ง Email 
// ---------------------------------------------------------
export async function sendEmailNotification(alert: any, htmlContent: string) {
  try {
    // 🌟 เปลี่ยนจากการใช้ service ผูกขาด มาเป็นการชี้เป้าหมายเซิร์ฟเวอร์ SMTP โดยตรง
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,       // ดึงที่อยู่เซิร์ฟเวอร์จาก .env
      port: Number(process.env.SMTP_PORT), // ดึงพอร์ตจาก .env (เช่น 587)
      secure: false,                     // ใช้ false สำหรับพอร์ต 587 (TLS), ใช้ true สำหรับพอร์ต 465 (SSL)
      auth: {
        user: process.env.SMTP_USER,     // ดึงอีเมลผู้ส่งจาก .env
        pass: process.env.SMTP_PASS,     // ดึงรหัสผ่าน หรือ App Password จาก .env
      },
    });

    const alertSubject = `🚨 [Alert] ตรวจพบเหตุการณ์ความเสี่ยงระดับ ${alert.severity || 'High'} บน ${alert.hostname}`;
    const mailOptions = {
      // 💡 สามารถแต่งชื่อผู้ส่งให้ดูเป็นทางการขึ้นได้ตรงนี้
      from: `"BMSP SOC Team" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO, // อีเมลปลายทาง 
      subject: alertSubject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ ส่ง Email ผ่าน SMTP สำเร็จ! Message ID:", info.messageId);
     return {
      success: true,
      messageId: info.messageId,
      subject: alertSubject,
      error: null,
    };

  } catch (error: any) {

    console.error("❌ Email Sending Error:", error.message);

    return {
      success: false,
      messageId: null,
      subject: null,
      error: error.message,
    };
  }
}
