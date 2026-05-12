import axios from 'axios';

// ---------------------------------------------------------
//ฟังก์ชันส่งไป teams
// ---------------------------------------------------------

export async function sendToTeams(alert: any, aiResponse: any) {
  // ดึง URL จากไฟล์ .env.local
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  // ถ้าไม่ได้ตั้งค่า URL ไว้ ให้ข้ามการทำงานไปเลย ระบบจะได้ไม่พัง
  if (!webhookUrl) {
    console.log("⚠️ ไม่พบ TEAMS_WEBHOOK_URL ในระบบ ข้ามการส่งเข้า MS Teams");
    return false;
  }

  // 🌟 จัดฟอร์แมตหน้าตาการ์ดที่จะไปเด้งใน Teams (MessageCard)
  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    // ใส่ขอบสีแดงให้ดูเป็น Alert (สามารถใช้โค้ดสี HEX ได้)
    "themeColor": "D9534F", 
    "summary": `🚨 CSOC Alert: ${alert.hostname}`,
    "title": `🚨 แจ้งเตือนความเสี่ยงระดับ ${alert.severity || 'High'} บนเครื่อง ${alert.hostname}`,
    "sections": [
      {
        // ใช้ประโยคสรุปที่ AI แต่งให้มาโชว์เป็นหัวเรื่อง
        "activityTitle": aiResponse.short_summary || "มีการแจ้งเตือนความปลอดภัยใหม่จาก CrowdStrike",
        "activitySubtitle": `**IP:** ${alert.ip_address || 'N/A'} | **User:** ${alert.username || 'N/A'}`,
        "facts": [
          {
            "name": "🔍 ผลการวิเคราะห์ (AI):",
            "value": aiResponse.description || "ไม่มีข้อมูล"
          },
          {
            "name": "🛠️ คำแนะนำ (Action):",
            // 💡 ทริค: ใน Teams จะใช้ \n ในการขึ้นบรรทัดใหม่แทน <br> ของอีเมล เลยต้องแปลงค่ากันนิดนึงครับ
            "value": aiResponse.recommend_action ? aiResponse.recommend_action.replace(/<br>/g, '\n\n') : "ไม่มีคำแนะนำ"
          }
        ],
        "markdown": true
      }
    ]
  };

  try {
    console.log(`--- 💬 กำลังส่งแจ้งเตือนเข้า MS Teams...`);
    await axios.post(webhookUrl, payload);
    console.log("✅ ส่งเข้า MS Teams สำเร็จ!");
    return true;
  } catch (error: any) {
    console.error("❌ ส่งเข้า MS Teams ล้มเหลว:", error.message);
    return false;
  }
}