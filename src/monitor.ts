import cron from 'node-cron';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path'; 

dotenv.config({ path: '.env.local' });

import { fetchCrowdStrikeAlerts } from '../src/lib/services/crowdstrike';
import { sendNotifications } from '../src/lib/services/notification/index';

const notifiedAlertIds = new Set<string>();

// สร้างตัวแปรสำหรับล็อกการทำงาน
let isProcessing = false;

console.log('=============================================');
console.log(' [Terminal Mode] CrowdStrike Monitor Started!');
console.log(' ระบบจะทำการเช็ค Alert ทุกๆ 1 นาที (กด Ctrl+C เพื่อหยุด)'); 
console.log('=============================================');

//  สร้าง path สำหรับเก็บไฟล์ JSON
const DB_FILE = path.join(process.cwd(), 'alerts.json');

const runJob = async () => {
  //เช็คว่าประตูล็อกอยู่ไหม ถ้าระบบยังทำงานรอบเก่าไม่เสร็จ ให้เด้งออกไปเลย
  if (isProcessing) {
    console.log(`\n[${new Date().toLocaleString()}]  ระบบกำลังส่งข้อมูลให้ AI วิเคราะห์อยู่ ข้ามรอบนี้ไปก่อน...`);
    return;
  }

  isProcessing = true; //ล็อกประตู เริ่มการทำงานรอบใหม่

  try {
    console.log(`\n[${new Date().toLocaleString()}]  Checking for alerts...`);
    const alertIds = await fetchCrowdStrikeAlerts();
    
    //  นำข้อมูล Alerts ทั้งหมดมาเซฟลงไฟล์ JSON เพื่อให้หน้าเว็บเอาไปอ่าน
    await fs.writeFile(DB_FILE, JSON.stringify(alertIds, null, 2));

    for (const alert of alertIds) {
      // ตรวจสอบว่าเป็น Alert ใหม่หรือไม่
      if (!notifiedAlertIds.has(alert.detection_id)) {
        console.log(`---- พบ Alert ใหม่! ID: ${alert.detection_id}`);
        const success = await sendNotifications(alert);
        
        if (success) {
          notifiedAlertIds.add(alert.detection_id); // ถ้าส่งสำเร็จ ค่อยจดจำ ID
        }
      } 
      else {
        console.log(`--- ข้าม Alert (ส่งแจ้งเตือนไปแล้ว ID: ${alert.detection_id})`);
      }
    }
  } catch (error: any) {
    console.error(`--- Error:`, error.message);
  } finally {
    //ปลดล็อกประตูไม่ว่าจะทำงานสำเร็จหรือเกิด Error ก็ตาม
    isProcessing = false; 
  }
};

// สั่งให้รันทันที 1 รอบตอนเปิดโปรแกรม
runJob();

// ตั้งเวลาให้ทำงานทุกๆ 1 นาที (*/1)
cron.schedule('*/2 * * * *', runJob);