import axios from 'axios';
import { CrowdStrikeAlert } from '../types/alert';

export async function sendWebhookAlert(alert: CrowdStrikeAlert) {
    // URL ของ Webhook ปลายทาง
    const webhookUrl = 'https://webhook.site/7e7844b5-74ba-43ab-a402-e229d7c0343f';

    // สร้าง Incident Number ให้ดูเป็นระบบ (เอา 8 ตัวอักษรแรกของ ID มาต่อท้าย INC-)
    const shortId = alert.detection_id.split(':')[0].substring(0, 8).toUpperCase();
    const incidentNo = `INC-${shortId}`;

    // ประกอบร่าง JSON Payload ตามฟอร์แมต
    const payload = {
        "inc_no": incidentNo,
        "incident_name": `[CrowdStrike] ตรวจพบความผิดปกติบนเครื่อง ${alert.hostname}`,
        "customer": "SVI", // ใส่ชื่อบริษัทของคุณ 
        "priority": alert.severity, 
        "status": "Open",
        "policy_name": alert.customer_message || alert.description 
    };

    try {
        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`       ✅ ส่ง Webhook สำเร็จ! (Status: ${response.status})`);
    } catch (error: any) {
        console.error('❌ ส่ง Webhook ไม่สำเร็จ:', error.message);
    }
}