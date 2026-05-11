import { fetchCrowdStrikeAlerts } from '../services/crowdstrike';
import { sendWebhookAlert } from '../services/notificationService';
import { getSummaryFromCustomAI } from '../services/customAI';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processAlerts() {
    console.log(`\n==================================================`);
    console.log(`[${new Date().toLocaleTimeString()}] เริ่มรอบการตรวจสอบ`);
    console.log(`==================================================`);

    try {
        const newAlerts = await fetchCrowdStrikeAlerts();
        console.log(`พบ Alert ใหม่: ${newAlerts.length} รายการ`);

        if (newAlerts.length === 0) {
            console.log(`ไม่มี Alert ใหม่ในรอบนี้`);
            return;
        }

        for (const [i, alert] of newAlerts.entries()) {
            if (i > 0) {
                console.log(`พัก 3 วินาที ป้องกัน AI โควตาเต็ม...`);
                await delay(3000);
            }

            console.log(`[NEW] ID: ${alert.detection_id}`);
            console.log(`      เครื่อง: ${alert.hostname} | IP: ${alert.ip_address}`);
            console.log(`      ผู้ใช้: ${alert.username} | ไฟล์: ${alert.filename}`);
            console.log(`      เวลา: ${new Date(alert.timestamp).toLocaleString()}`);

            const aiMessage = await getSummaryFromCustomAI(alert);
            console.log(`      AI: "${aiMessage}"`);

            await sendWebhookAlert({ ...alert, customer_message: aiMessage });
            console.log(`      ส่ง Teams + Email แล้ว ✅`);
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
    }
}