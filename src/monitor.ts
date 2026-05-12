import cron from 'node-cron';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path'; 

dotenv.config({ path: '.env.local' });

import { fetchCrowdStrikeAlerts } from '../src/lib/services/crowdstrike';
import { sendNotifications } from '../src/lib/services/notification/index';
import { pool } from './lib/db';

//const notifiedAlertIds = new Set<string>();

// สร้างตัวแปรสำหรับล็อกการทำงาน
let isProcessing = false;

console.log('=============================================');
console.log(' [Terminal Mode] CrowdStrike Monitor Started!');
console.log(' ระบบจะทำการเช็ค Alert ทุกๆ 1 นาที (กด Ctrl+C เพื่อหยุด)'); 
console.log('=============================================');

const runJob = async () => {
  //เช็คว่าประตูล็อกอยู่ไหม ถ้าระบบยังทำงานรอบเก่าไม่เสร็จ ให้เด้งออกไปเลย
  if (isProcessing) {
    console.log(`\n[${new Date().toLocaleString()}]  ระบบกำลังส่งข้อมูลให้ AI วิเคราะห์อยู่ ข้ามรอบนี้ไปก่อน...`);
    return;
  }

  isProcessing = true; //ล็อกประตู เริ่มการทำงานรอบใหม่

  try {
    console.log(`\n[${new Date().toLocaleString()}] เริ่มกระบวนการทำงาน...`);

    // ขั้นที่ 1 & 2: ดึงข้อมูลมา และ บันทึกลง DB 
    // มันจะดึงมา -> INSERT ลง DB พร้อมสถานะ 'PENDING' -> จบงานของมัน
    await fetchCrowdStrikeAlerts(); 

    // ขั้นที่ 3: เอาข้อมูลจาก DB มาใช้ (หยิบเฉพาะตัวที่ยังไม่ได้ส่ง และเรียงตามเวลาจากเก่าไปใหม่)
    const getPendingQuery = `
        SELECT * FROM "AlertRecord" 
        WHERE "mailStatus" = 'PENDING' 
        ORDER BY timestamp ASC;
    `;
    const pendingResult = await pool.query(getPendingQuery);
    const pendingAlerts = pendingResult.rows;

    if (pendingAlerts.length === 0) {
        console.log(`ℹ️ ไม่มี Alert ค้างส่งในระบบรอบนี้`);
        return;
    }

    console.log(` พบข้อมูลที่ต้องจัดส่งจาก Database จำนวน ${pendingAlerts.length} รายการ`);

    // เริ่มวนลูปประมวลผลข้อมูลที่ได้มาจาก DB
    for (const dbAlert of pendingAlerts) {
        console.log(`\n---- กำลังประมวลผล Alert ID: ${dbAlert.id}`);
        
        // หมายเหตุสำคัญ: ตอนนี้ตัวแปร dbAlert ดึงมาจาก Database 
        // ชื่อ Key ต่างๆ จะอิงตามชื่อ Column ใน Database นะครับ (เช่น dbAlert.ipAddress)
        
        // ขั้นที่ 4 & 5: โยนให้ AI -> จัด Format -> ส่ง Email/Teams
        // ฟังก์ชัน sendNotifications จะรับช่วงต่อจัดการให้ทั้งหมด
        const success = await sendNotifications(dbAlert);
        
        if (success === 'SENT' || success === 'FAIL') {
            // 🌟 ถ้าสถานะเป็น SENT (สำเร็จ) หรือ FAIL (ส่ง Teams ให้คนทำแมนนวลแล้ว) ให้ขีดฆ่าใน DB ได้เลย
            try {
                // เปลี่ยนมารับค่า $1 เป็นสถานะ และ $2 เป็น id
                const updateQuery = `UPDATE "AlertRecord" SET "mailStatus" = $1 WHERE id = $2`;
                await pool.query(updateQuery, [success, dbAlert.id]);
                console.log(`      ✅ อัปเดตสถานะ DB เป็น '${success}' เรียบร้อย`);
            } catch (dbError: any) {
                console.error(`      ❌ อัปเดตสถานะ DB ไม่สำเร็จ:`, dbError.message);
            }
        } else {
            // กรณีเป็น PENDING หรือค่าอื่นๆ คือเมลไม่ไปและไม่ได้ส่ง Teams 
            console.log(`      ⚠️ ระบบเก็บสถานะไว้เป็น PENDING เพื่อดำเนินการใหม่ในรอบหน้า`);
        }
    }

  } catch (error: any) {
    console.error(`--- Error ระหว่างระบบทำงาน:`, error.message);
  } finally {
    isProcessing = false; 
  }
};

// สั่งให้รันทันที 1 รอบตอนเปิดโปรแกรม
runJob();

// ตั้งเวลาให้ทำงานทุกๆ 1 นาที (*/1)
cron.schedule('*/2 * * * *', runJob);