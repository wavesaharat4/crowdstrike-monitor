import cron from 'node-cron';
import { processAlerts } from './alertJob';
import { purgeOldData } from '../db'; 
// ตัวแปรกันการรันซ้ำซ้อนเวลา Next.js 
let isSchedulerRunning = false;

export function startScheduler() {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  // สั่งให้ทำงานทันที 1 รอบ ตอนที่เปิดโปรแกรม
  console.log('กำลังดึงข้อมูลจาก CrowdStrike ครั้งแรกทันที...');
  processAlerts().catch((err) => console.error('Error during initial run:', err));

  // ตั้งเวลาให้ทำงานรอบต่อๆ ไป (ทุก 1 นาที)
  cron.schedule('*/1 * * * *', async () => {
    await processAlerts();
     console.log('\n⏰ [Scheduler Test] รัน Job ล้างข้อมูล DB ทดสอบทุก 1 นาที...');
    await purgeOldData();
  });

  console.log('ระบบ Scheduler เริ่มทำงานแล้ว เช็ครอบถัดไปทุก 1 นาที');
}