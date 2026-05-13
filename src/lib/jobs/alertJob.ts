import { fetchCrowdStrikeAlerts } from '../services/crowdstrike';
// import { sendEmailNotification } from '../services/notification/email';
// import { sendToTeams } from '../services/notification/teams';
// import { sendNotifications } from '../services/notification/index';
import { getAnalysisFromExternalAI } from '../services/notification/ai-service';
import { pool } from '../../lib/db';
import { sendNotifications } from '../services/notification/index';

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
        }

        for (const [i, alert] of newAlerts.entries()) {
            console.log(`[NEW] ID: ${alert.detection_id}`);
            console.log(`      เครื่อง: ${alert.hostname} | IP: ${alert.ipAddress}`);
            console.log(`      ผู้ใช้: ${alert.username} | ไฟล์: ${alert.filename}`);
            console.log(`      เวลา: ${new Date(alert.timestamp).toLocaleString()}`);

        }
        const getPendingQuery = `
                SELECT * FROM "AlertRecord" 
                WHERE "mailStatus" = 'PENDING' 
                ORDER BY timestamp ASC;
            `;
            const pendingResult = await pool.query(getPendingQuery);
            const pendingAlerts = pendingResult.rows;
        
            if (pendingAlerts.length === 0) {
                console.log(`ไม่มี Alert ค้างส่งในระบบรอบนี้`);
                return;
            }
        
            console.log(`พบข้อมูลที่ต้องจัดส่งจาก Database จำนวน ${pendingAlerts.length} รายการ`);
        
            // เริ่มวนลูปประมวลผลข้อมูลที่ได้มาจาก DB
            for (const dbAlert of pendingAlerts) {
                console.log(`\n---- กำลังประมวลผล Alert ID: ${dbAlert.id}`);
            
                // โยนให้ AI -> จัด Format -> ส่ง Email/Teams
                // ฟังก์ชัน sendNotifications จะรับช่วงต่อจัดการให้ทั้งหมด
                const success = await sendNotifications(dbAlert);
                
                if (success === 'SENT' || success === 'FAIL') {
                    //  ถ้าสถานะเป็น SENT (สำเร็จ) หรือ FAIL (ส่ง Teams ให้คนทำแมนนวลแล้ว) 
                    try {
                        // เปลี่ยนมารับค่า $1 เป็นสถานะ และ $2 เป็น id
                        const updateQuery = `UPDATE "AlertRecord" SET "mailStatus" = $1 WHERE id = $2`;
                        await pool.query(updateQuery, [success, dbAlert.id]);
                        console.log(`อัปเดต Mail Status เป็น ${success} เรียบร้อย`);
                    } catch (dbError: any) {
                        console.error(`อัปเดตสถานะ DB ไม่สำเร็จ:`, dbError.message);
                    }
                } else {
                    // กรณีเป็น PENDING หรือค่าอื่นๆ คือเมลไม่ไปและไม่ได้ส่ง Teams 
                    console.log(`ระบบเก็บสถานะไว้เป็น PENDING เพื่อดำเนินการใหม่ในรอบหน้า`);
                }
            }

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
    }
}