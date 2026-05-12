import { fetchCrowdStrikeAlerts } from '../services/crowdstrike';
// import { sendEmailNotification } from '../services/notification/email';
// import { sendToTeams } from '../services/notification/teams';
// import { sendNotifications } from '../services/notification/index';
import { getAnalysisFromExternalAI } from '../services/notification/ai-service';

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

            console.log(`[NEW] ID: ${alert.id}`);
            console.log(`      เครื่อง: ${alert.hostname} | IP: ${alert.ipAddress}`);
            console.log(`      ผู้ใช้: ${alert.username} | ไฟล์: ${alert.filename}`);
            console.log(`      เวลา: ${new Date(alert.timestamp).toLocaleString()}`);

            const aiResponse = await getAnalysisFromExternalAI(alert);

            if (!aiResponse) {
                console.log("--- ไม่ได้รับผลวิเคราะห์จาก AI ข้ามการส่งแจ้งเตือนนี้");
                return false;
            }
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
    }
}