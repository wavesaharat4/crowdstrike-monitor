import axios from 'axios';

// ---------------------------------------------------------
//ฟังก์ชันขอผลวิเคราะห์จาก AI 
// ---------------------------------------------------------
export async function getAnalysisFromExternalAI(alert: any) {
  const apiUrl = process.env.apiAi!; // ดึง URL ของ AI จาก .env.local

  const safeId = alert.alertIds || "00000000";

  const payload = {
    inc_no: `INC-${String(safeId).substring(0, 8)}`,
    incident_name: `Detection on ${alert.hostname}`,
    customer: "BMSP Intern Project",
    priority: alert.severity || "High",
    status: "Open",
    policy_name: `
    วิเคราะห์ข้อมูลนี้: IP=${alert.ip_address}, User=${alert.username}, Desc=${alert.description}
      โดยให้ตอบกลับเป็น JSON ที่มี key ดังนี้เท่านั้น:
      1. short_summary: สรุป 1-2 บรรทัด พบพฤติกรรม..."
      2. description: สรุปรายละเอียดเชิงลึกแบบสั้นและกระชับที่สุด ห้ามเกิน 2 บรรทัด (ประมาณ 30-50 คำ)
      3. recommend_action: คำแนะนำการแก้ไขแบบสั้นๆ กระชับ เป็นข้อๆ (ใช้ <br> สำหรับขึ้นบรรทัดใหม่)
    `
  };

  try {
    console.log(`--- กำลังส่งให้ AI ของระบบกลางวิเคราะห์...`);
    const response = await axios.post(apiUrl, payload);
    console.log("--- ได้รับผลวิเคราะห์กลับมาแล้ว:\n", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("--- External AI Error:", error.message);
    return null;
  }
}