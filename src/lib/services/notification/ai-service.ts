import axios from 'axios';

// ---------------------------------------------------------
//ฟังก์ชันขอผลวิเคราะห์จาก AI 
// ---------------------------------------------------------
export async function getAnalysisFromExternalAI(alert: any) {
  const apiUrl = process.env.apiAi!; // ดึง URL ของ AI จาก .env.local

  const safeId = alert.id || "00000000";

  const payload = {
    inc_no: `INC-${String(safeId).substring(0, 8)}`,
    incident_name: `Detection on ${alert.hostname}`,
    customer: "BMSP Intern Project",
    priority: alert.severity || "High",
    status: "Open",
    policy_name: `
    วิเคราะห์ข้อมูลนี้: IP=${alert.ipAddress}, User=${alert.username}, Desc=${alert.description}
      โดยให้ตอบกลับเป็น JSON ที่มี key ดังนี้เท่านั้น:
      1. short_summary: สรุป 1-2 บรรทัด พบพฤติกรรม..."
      2. description: สรุปรายละเอียดเชิงลึกแบบสั้นและกระชับที่สุด ห้ามเกิน 2 บรรทัด (ประมาณ 30-50 คำ)
      3. recommend_action: คำแนะนำการแก้ไขแบบสั้นๆ กระชับ เป็นข้อๆ (ใช้ <br> สำหรับขึ้นบรรทัดใหม่)
    `
  };

  try {
    const response = await axios.post(apiUrl, payload);

    if (!response.data || response.data === "") {
        console.warn("⚠️ AI ระบบกลางไม่ตอบกลับ");
        return null; // 🌟 คืนค่า null เพื่อไปเข้าลูป Retry
    }
    return response.data;
  } catch (error: any) {
    console.error("--- External AI Error:", error.message);
    return null; // 🌟 คืนค่า null เพื่อไปเข้าลูป Retry
  }
}
