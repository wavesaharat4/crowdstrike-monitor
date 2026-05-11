import axios from 'axios';
import dotenv from 'dotenv';
import type { CrowdStrikeAlert } from '../types/alert';

dotenv.config();

// 1. ฟังก์ชันขอ Token 
async function getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${process.env.CS_CLIENT_ID}:${process.env.CS_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
        `${process.env.CS_BASE_URL}/oauth2/token`,
        'grant_type=client_credentials',
        { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
}

// 2. ฟังก์ชันหลักสำหรับดึงข้อมูล
export async function fetchCrowdStrikeAlerts(): Promise<CrowdStrikeAlert[]> {
    try {
        const token = await getAccessToken();
        
        // 1: ค้นหา ID ของ Alert 
        const queryResponse = await axios.get(`${process.env.CS_BASE_URL}/alerts/queries/alerts/v2`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { filter: "severity:>=60", limit: 1 }
        });

        const alertIds = queryResponse.data.resources;
        
        // ถ้าไม่มี Alert ระดับ High เลย ให้จบการทำงาน
        if (!alertIds || alertIds.length === 0) {
            return [];
        }

        //  2: ดึงรายละเอียดเต็มๆ (จาก curl ตัวล่าสุด)
        const detailsResponse = await axios.post(`${process.env.CS_BASE_URL}/alerts/entities/alerts/v2`, 
            { 
                composite_ids: alertIds // ส่ง Array ของ ID 
            },
            { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } 
            }
        );

        // 3: แปลงข้อมูลเตรียมส่ง Teams / Email
        const rawAlerts = detailsResponse.data.resources;
        
        return rawAlerts.map((alert: any) => ({
            detection_id: alert.composite_id, 
            severity: alert.severity_name || 'High', // เช่น High
            description: alert.description || 'ตรวจพบพฤติกรรมน่าสงสัย (No description)',
            hostname: alert.device?.hostname || 'Unknown Device',
            timestamp: alert.created_timestamp,
            ip_address: alert.device?.local_ip || 'Unknown IP',
            username: alert.user_name || 'Unknown User',
            filename: alert.filename || 'ไม่พบชื่อไฟล์'
        }));

    } catch (error) {
        console.error('❌ Error fetching alerts from CrowdStrike:', error);
        return [];
    }
}