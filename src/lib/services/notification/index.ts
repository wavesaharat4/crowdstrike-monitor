
import { sendEmailNotification } from '../notification/email';
import { sendToTeams } from '../notification/teams';
import { getAnalysisFromExternalAI } from '../notification/ai-service';

// ---------------------------------------------------------
//ฟังก์ชันหลัก (คุมการทำงานทั้งหมด)
// ---------------------------------------------------------
export async function sendNotifications(alert: any): Promise<boolean> {
  try {
    const aiResponse = await getAnalysisFromExternalAI(alert);

    if (!aiResponse) {
      console.log("--- ไม่ได้รับผลวิเคราะห์จาก AI ข้ามการส่งแจ้งเตือนนี้");
      return false;
    }

    // 🌟 เปลี่ยน Format เป็นแนว Corporate เรียบหรู ตามแบบฉบับ CSOC
    const analyzedMessage = `
      <div style="font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 14px; color: #000000; line-height: 1.5;">
        <p>Dear SVI Teams ,</p>

        <p>
          ${aiResponse.short_summary || `ตรวจพบเหตุการณ์ความเสี่ยงระดับ ${alert.severity || 'High'} บนเครื่อง ${alert.hostname} (IP: ${alert.ip_address}, ผู้ใช้งาน: ${alert.username})`}
        </p>

        <p>
          ${aiResponse.description || 'ไม่มีข้อมูลเพิ่มเติม'}
        </p>

        <p>
          Best Regards,
        </p>
        
        <p>--</p>

        <p>
          <b>Cybersecurity Operations Center (CSOC)</b><br>
          Confidential, do not distribute without explicit authorization.
        </p>

        <p>
          Please do not reply to this message; it is sent from an unmonitored account. Use the commenting system within the ticket to respond.
        </p>

        <p>
          <b>For phone support call Hotline 1613, +66 2 101 1100 press 7</b>
        </p>
      </div>
    `;

    console.log(`--- กำลังส่งผลวิเคราะห์เข้า Email...`);

    // เรียกใช้ฟังก์ชันส่งเมลตรงนี้
    await Promise.all([
      sendEmailNotification(alert, analyzedMessage),
      sendToTeams(alert, aiResponse)
    ]);

    console.log("✅ ดำเนินการแจ้งเตือนเสร็จสิ้น!");
    return true;
  } catch (error) {
    console.error("❌ Notification Error:", error);
    return false;
  }
}
