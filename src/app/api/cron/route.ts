import { NextResponse } from 'next/server';
// เปลี่ยน path ให้ตรงกับที่เก็บไฟล์ processAlerts ของคุณ
import { processAlerts } from '@/lib/jobs/alertJob'; 

// บังคับให้ Next.js ไม่จำ Cache ของหน้านี้ (ให้รันใหม่ทุกครั้งที่ถูกเรียก)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        console.log("ได้รับสัญญาณCron Job");
        
        // สั่งให้ลอจิกดึงข้อมูล CrowdStrike และส่ง Teams/Email ทำงาน
        await processAlerts();

        return NextResponse.json({ 
            success: true, 
            message: 'ระบบตรวจสอบ Alert ทำงานเสร็จสิ้น' 
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการตรวจสอบ Alert' 
        }, { status: 500 });
    }
}