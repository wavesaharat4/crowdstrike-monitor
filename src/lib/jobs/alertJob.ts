import { fetchCrowdStrikeAlerts } from '../services/crowdstrike';
import { sendWebhookAlert } from '../services/notificationService';
import { getSummaryFromCustomAI } from '../services/customAI';

// เก็บ ID ของ Alert ที่เคยแจ้งเตือนไปแล้วไว้ใน Memory
const processedAlerts = new Set<string>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export async function processAlerts() {
    console.log(`\n==================================================`);
    console.log(`[${new Date().toLocaleTimeString()}] เริ่มรอบการตรวจสอบ CrowdStrike Alerts`);
    console.log(`==================================================`);
    
    try {
        // 1. ดึงข้อมูล
        console.log(`กำลังดึงข้อมูลจาก CrowdStrike API...`);
        const alerts = await fetchCrowdStrikeAlerts();
        console.log(`ดึงข้อมูลสำเร็จ: พบทั้งหมด ${alerts.length} รายการ`);

        // 2. กรองเอาเฉพาะ High 
        const highSeverityAlerts = alerts.filter(a => a.severity === 'High');
        console.log(`กรองเฉพาะความรุนแรงระดับ 'High': เหลือ ${highSeverityAlerts.length} รายการ`);

        // เช็คดักไว้ก่อน ถ้าไม่มี High เลย จะได้ไม่ต้องทำลูป
        if (highSeverityAlerts.length === 0) {
            console.log(`ไม่มี Alert ระดับ High ในรอบนี้ จบการทำงาน`);
            return;
        }

        let newAlertsCount = 0;
        let skippedAlertsCount = 0;

        console.log(`\nเริ่มตรวจสอบและส่งการแจ้งเตือน...`);
        
        for (const alert of highSeverityAlerts) {
            // 3. เช็คว่าเป็น Record ใหม่หรือไม่
            if (!processedAlerts.has(alert.detection_id)) {
                newAlertsCount++;
                console.log(`   [NEW] พบ Alert ใหม่! ส่งแจ้งเตือน ID: ${alert.detection_id}`);
                // 2. ใส่เบรกก่อนเรียก Gemini (เช่น หน่วงไว้ 3 วินาที หรือ 3000 ms)
                // เพื่อไม่ให้ API ฟรีของ Google โดนยิงรัวเกินไป
                if (newAlertsCount > 1) {
                    console.log(`       ⏳ หยุดพัก 3 วินาที ป้องกัน AI โควตาเต็ม...`);
                    await delay(3000); 
                }
                console.log(`       เครื่องที่พบ: ${alert.hostname}`);
                console.log(`       IP:(${alert.ip_address},ผู้ใช้งาน: ${alert.username}) `)
                console.log(`       เขียนไฟล์ ${alert.filename}`)

                console.log(`       รายละเอียด: ${alert.description}`);
                // แปลงเวลาให้เป็นรูปแบบที่อ่านง่ายขึ้น
                console.log(`       เวลาเกิดเหตุ: ${new Date(alert.timestamp).toLocaleString()}`);
                console.log(`       กำลังให้ Gemini ช่วยเรียบเรียงข้อความ`);
                const aiMessage = await getSummaryFromCustomAI(alert);
                console.log(`        ได้รับข้อความจาก AI แล้ว!`);
                console.log(`        ข้อความจาก AI: "${aiMessage}..."`);
                const alertWithAiMessage = {
                    ...alert,
                    customer_message: aiMessage
                };
                console.log(`       => กำลังส่งเข้า Teams และ Email...`);
                console.log(`   ---------------------------------------------`);
                

                // บันทึก ID ลง Set
                processedAlerts.add(alert.detection_id);
            } else {
                skippedAlertsCount++;
            }
        }

        // สรุปผลตอนท้าย 
        console.log(`\nสรุปผลการทำงานรอบนี้:`);
        console.log(`   - ส่งแจ้งเตือนใหม่: ${newAlertsCount} รายการ`);
        console.log(`   - ข้าม Alert เก่า: ${skippedAlertsCount} รายการ`);
        console.log(`   - จำนวน ID ที่จำไว้ในระบบ: ${processedAlerts.size} รายการ`);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการทำงาน:', error);
    }
}