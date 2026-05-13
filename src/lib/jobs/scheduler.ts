import cron from 'node-cron';
import { processAlerts } from './alertJob';

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
  });

  console.log('ระบบ Scheduler เริ่มทำงานแล้ว เช็ครอบถัดไปทุก 1 นาที');
}