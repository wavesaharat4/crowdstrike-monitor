import { sendEmailNotification } from '../notification/email';
import { sendToTeams } from '../notification/teams';
import { getAnalysisFromExternalAI } from '../notification/ai-service';

// ---------------------------------------------------------
//ฟังก์ชันหลัก (คุมการทำงานทั้งหมด)
// ---------------------------------------------------------
export async function sendNotifications(alert: any): Promise<String> {
  try {
    let aiResponse = null;
    const maxRetries = 3;

    //ลูปพยายามขอผลจาก AI 3 ครั้ง
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`--- 🤖 กำลังขอผลวิเคราะห์จาก AI (รอบที่ ${attempt}/${maxRetries})...`);
      aiResponse = await getAnalysisFromExternalAI(alert);

      if (aiResponse) {
        break; // ถ้าได้ผลลัพธ์จาก AI สำเร็จ ให้หลุดออกจากลูปทันที
      }

      if (attempt < maxRetries) {
        console.log(`   ⏳ AI ไม่ตอบกลับ รอ 3 วินาทีก่อนลองใหม่...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // หน่วงเวลาพักหายใจ 3 วิ
      }
    }

    // 2. กรณีล้มเหลว: ลองครบ 3 ครั้งแล้ว AI ยังไม่ตอบกลับ
    if (!aiResponse) {
      console.warn("⚠️ ล้มเหลว: AI ไม่ตอบสนองหลังจากลอง 3 ครั้ง! -> ข้ามอีเมล และส่งเตือน Teams");

      // ปั้นข้อมูลฉุกเฉินเพื่อส่งไปโชว์ใน Teams
      const manualAlertData = {
        short_summary: `❌ AI System Failure (Alert: ${alert.hostname})`,
        description: `ระบบพยายามให้ AI วิเคราะห์ข้อมูล 3 ครั้งแต่ไม่สำเร็จ จึงข้ามการส่งอีเมลอัตโนมัติ`,
        recommend_action: `🚨 **กรุณาดำเนินการส่ง Email แจ้งเตือนลูกค้าแบบ Manual (ทำมือ)**\n\n**ข้อมูลเบื้องต้น:**\n- Severity: ${alert.severity || 'High'}\n- IP: ${alert.ipAddress}\n- User: ${alert.username}\n- Desc: ${alert.description}`
      };

      // ส่งแค่ Teams ช่องทางเดียว
      const teamsSuccess = await sendToTeams(alert, manualAlertData);
      
      if (!teamsSuccess) {
        console.error("❌ ล้มเหลวซ้ำซ้อน! ไม่สามารถส่งแจ้งเตือน Manual เข้า Teams ได้");
        // 🌟 ถ้าส่ง Teams ไม่ผ่านด้วย ให้คืนค่า PENDING เพื่อรอให้รอบหน้ามาลองใหม่
        return 'PENDING'; 
      }

      console.log("✅ ส่งแจ้งเตือน Manual เข้า Teams สำเร็จ ");
      // 🌟 คืนค่า 'FAIL' กลับไปให้อัปเดต DB (คนจะได้รู้ว่าเคสนี้ต้องมาทำ Manual)
      return 'FAIL'; 
    }

    // 3. กรณีสำเร็จ: AI ตอบกลับมาปกติ (ทำงาน Flow เดิม)
    const analyzedMessage = `
      <div style="font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 14px; color: #000000; line-height: 1.5;">
        <p>Dear SVI Teams ,</p>
        <p>
          ${`ตรวจพบเหตุการณ์ความเสี่ยงระดับ ${alert.severity || 'High'} บนเครื่อง ${alert.hostname} (IP: ${alert.ipAddress}, ผู้ใช้งาน: ${alert.username})`}
        </p>
        <p>
          ${aiResponse.description || 'ไม่มีข้อมูลเพิ่มเติม'}
        </p>
        <p>Best Regards,</p>
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

    console.log(`--- กำลังส่งผลวิเคราะห์เข้า Email และ Teams...`);

    const [emailSuccess, teamsSuccess] = await Promise.all([
      sendEmailNotification(alert, analyzedMessage),
      sendToTeams(alert, aiResponse)
    ]);

    if (!emailSuccess && !teamsSuccess) {
      console.error("❌ ล้มเหลวทั้งหมด! ไม่สามารถส่ง Email และ Teams ได้เลย");
      return 'Fail'; 
    }

    if (!emailSuccess) {
      console.error("❌ ส่ง Email ไม่สำเร็จ! (ระบบจะบันทึกสถานะเป็น PENDING)");
      return 'Fail'; 
    }

    console.log("✅ ดำเนินการแจ้งเตือนเสร็จสิ้นอย่างสมบูรณ์!");
    return 'Sent'; 

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดร้ายแรงในกระบวนการแจ้งเตือน:", error);
    return 'Fail'; 
  }
}
