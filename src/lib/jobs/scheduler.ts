import cron from 'node-cron';
import { processAlerts } from './alertJob';

export function startScheduler() {
  cron.schedule('*/1 * * * *', async () => {
    await processAlerts();
  });

  console.log('✅ Scheduler เริ่มทำงานแล้ว (ทุก 1 นาที)');
}