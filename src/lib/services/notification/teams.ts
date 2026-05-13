import axios from 'axios';

// ---------------------------------------------------------
//ฟังก์ชันส่งไป teams
// ---------------------------------------------------------

export async function sendToTeams(alert: any, aiResponse: any) {
  // ดึง URL จากไฟล์ .env.local
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  // ถ้าไม่ได้ตั้งค่า URL ไว้ ให้ข้ามการทำงานไปเลย ระบบจะได้ไม่พัง
 if (!webhookUrl) {
    return {
      success: false,
      payload: null,
      error: 'No webhook url'
    };
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
        "activitySubtitle": `**IP:** ${alert.ipAddress || 'N/A'} | **User:** ${alert.username || 'N/A'}`,
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

    await axios.post(webhookUrl, payload);

    console.log("✅ ส่ง Teams สำเร็จ");

    return {
      success: true,
      payload,
      error: null
    };

  } catch (error: any) {

    console.error("❌ Teams Error:", error.message);

    return {
      success: false,
      payload,
      error: error.message
    };
  }
}