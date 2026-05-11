import axios from 'axios';
import { CrowdStrikeAlert } from '../types/alert';

export async function getSummaryFromCustomAI(alert: CrowdStrikeAlert): Promise<string> {
    const webhookUrl = 'http://172.236.136.184:5679/webhook/1573200f-6dea-4921-bf1a-483f1dea5146';

    const shortId = alert.detection_id.split(':')[0].substring(0, 8).toUpperCase();
    
    // 💡 แพ็กข้อมูลให้ AI ของคุณวิเคราะห์ (มีข้อมูลครบเหมือนที่เคยส่งให้ Gemini)
    const payload = {
        "inc_no": `INC-${shortId}`,
        "incident_name": `[CrowdStrike] ตรวจพบความผิดปกติบนเครื่อง ${alert.hostname}`,
        "customer": alert.username || "Unknown",
        "priority": alert.severity,
        "status": "Open",
        "policy_name": alert.description,
        // เพิ่มข้อมูลเชิงลึกเข้าไปด้วย เผื่อ AI ของคุณต้องใช้เขียนเนื้อหา Email
        "technical_details": {
            "hostname": alert.hostname,
            "ip_address": alert.ip_address,
            "filename": alert.filename,
        }
    };

    try {
        console.log(`       กำลังส่งข้อมูลให้ Custom AI วิเคราะห์...`);
        
        // ยิง POST ไปที่ Webhook และรอคำตอบกลับมา (รอสูงสุด 30 วินาที)
        const response = await axios.post(webhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        // 💡 ดึงข้อความที่ AI ของคุณตอบกลับมา
        // สมมติว่า Webhook ของคุณตอบกลับมาเป็น JSON แบบนี้ { "message": "ข้อความที่จะส่งให้ลูกค้า..." }
        // ถ้า Webhook ของคุณตอบมาเป็นแบบอื่น ให้เปลี่ยน .message เป็น Key ที่ถูกต้องนะครับ
        const aiMessage = response.data?.message || response.data?.summary || response.data;

        if (typeof aiMessage === 'string') {
            return aiMessage.trim();
        } else {
            return JSON.stringify(aiMessage); // กันพลาดกรณี Webhook พ่นกลับมาเป็น Object
        }

    } catch (error: any) {
        console.error('❌ Custom AI Error:', error.message);
        // Fallback: ถ้า Webhook พัง หรือ AI ตอบช้าเกินไป ให้ใช้ข้อความมาตรฐานแทน
        return `ระบบตรวจพบความเสี่ยงระดับ ${alert.severity} บนเครื่อง ${alert.hostname} (ผู้ใช้งาน: ${alert.username}) ขณะนี้ทีมงานรับทราบและกำลังดำเนินการตรวจสอบครับ`; 
    }
}