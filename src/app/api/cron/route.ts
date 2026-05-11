import { NextResponse } from 'next/server';
import { processAlerts } from '@/lib/jobs/alertJob';

// Vercel Cron จะส่ง Request มาเป็นแบบ GET
export async function GET(request: Request) {
    // 1. ดึงค่า Header ที่ Vercel ส่งมาให้
    const authHeader = request.headers.get('authorization');

    // 👇 เพิ่ม 2 บรรทัดนี้ เพื่อแอบดูข้อมูล
    console.log("🕵️‍♂️ Header ที่ฝั่ง Vercel ได้รับ:", authHeader);
    console.log("🔐 รหัสใน Vercel (CRON_SECRET):", process.env.CRON_SECRET ? "ถูกตั้งค่าแล้ว" : "ยังเป็นค่าว่าง (undefined)");
    // 2. ตรวจสอบว่าตรงกับ CRON_SECRET ในไฟล์ .env หรือบนเว็บ Vercel ไหม
    // Vercel จะส่งมาในรูปแบบ "Bearer รหัสผ่าน"
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('มีการพยายามเรียกใช้ Cron Job โดยไม่ได้รับอนุญาต');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('ยืนยันรหัสผ่าน Cron Job ถูกต้อง กำลังเริ่มทำงาน...');
        
        // 3. สั่งให้ระบบทำงานจริง
        await processAlerts();
        
        return NextResponse.json({ success: true, message: 'Cron job executed successfully' });
    } catch (error) {
        console.error('❌ Cron job error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}