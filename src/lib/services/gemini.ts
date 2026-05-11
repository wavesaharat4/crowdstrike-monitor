import { GoogleGenerativeAI } from '@google/generative-ai';
import { CrowdStrikeAlert } from '../types/alert';

// ดึง API Key จากไฟล์ .env
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function summarizeAlertForCustomer(alert: CrowdStrikeAlert): Promise<string> {
    if (!apiKey) {
        console.warn("⚠️ ไม่พบ GEMINI_API_KEY จะใช้ข้อความต้นฉบับแทน");
        return alert.description;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Prompt สั่งงาน AI ให้เรียบเรียงข้อความใหม่
        const prompt = `
        คุณคือผู้เชี่ยวชาญด้าน IT Security Support 
        มีระบบแจ้งเตือนความปลอดภัย (Alert) จาก CrowdStrike เกิดขึ้น กรุณาสรุปข้อมูลต่อไปนี้
        ให้เป็นข้อความภาษาไทยที่ "สั้น กระชับ เข้าใจง่าย ไม่ตื่นตระหนก และเป็นมืออาชีพ" เพื่อส่งแจ้งเตือนให้ลูกค้าทราบ
        
        กฎ:
        1. ไม่ต้องอธิบายศัพท์เทคนิคเชิงลึก ให้สรุปภาพรวมว่าเกิดเหตุการณ์อะไร
        2. ให้ระบุข้อมูลที่สำคัญ ได้แก่ ชื่อเครื่อง, ผู้ใช้งาน, และชื่อไฟล์ที่พบความผิดปกติ
        3. ลงท้ายด้วยข้อความทำนองว่า "ขณะนี้ทีมงานรับทราบปัญหาและกำลังดำเนินการตรวจสอบเพื่อความปลอดภัยสูงสุดครับ"

        ข้อมูลดิบจากระบบ:
        - ระดับความรุนแรง: ${alert.severity}
        - ชื่อเครื่อง (Hostname): ${alert.hostname}
        - ไอพี (IP Address): ${alert.ip_address}
        - ผู้ใช้งาน (Username): ${alert.username}
        - ชื่อไฟล์ที่พบ (Filename): ${alert.filename}
        - รายละเอียดจากระบบ: ${alert.description}

        ข้อความที่จะส่งให้ลูกค้า (ไม่ต้องมีคำทักทายขึ้นต้น เริ่มประโยคได้เลย):`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        // Fallback กรณี AI ล่ม เพื่อให้ระบบยังทำงานต่อไปได้
        return `ระบบตรวจพบความเสี่ยงระดับ ${alert.severity} บนเครื่อง ${alert.hostname} (ผู้ใช้งาน: ${alert.username}) ขณะนี้ทีมงานรับทราบและกำลังดำเนินการตรวจสอบครับ`; 
    }
}