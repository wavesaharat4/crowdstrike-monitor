import { NextResponse } from 'next/server';
import { fetchCrowdStrikeAlerts } from '@/lib/services/crowdstrike';

// ฟังก์ชัน GET นี้จะทำงานก็ต่อเมื่อมีการเรียกใช้ API นี้เท่านั้น
export async function GET() {
    try {
        console.log(" เริ่มค้นหาข้อมูลจาก CrowdStrike...");
        
        const alerts = await fetchCrowdStrikeAlerts();
        
        // ส่งผลลัพธ์กลับไปแสดงบนหน้าจอ
        return NextResponse.json({ 
            success: true, 
            message: "ตรวจสอบสำเร็จ", 
            newAlertsCount: alerts.length,
            data: alerts 
        });

    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดใน API:", error);
        return NextResponse.json({ success: false, error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
    }
}