import axios from 'axios';
import dotenv from 'dotenv';
import type { CrowdStrikeAlert } from '../types/alert';
import { pool } from '@/lib/db'; //  นำเข้า Database 


dotenv.config();

// 1. ฟังก์ชันขอ Token (เหมือนเดิม)
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

        if (!alertIds || alertIds.length === 0) {
            return [];
        }

        // 2: ดึงรายละเอียดเต็มๆ
        const detailsResponse = await axios.post(`${process.env.CS_BASE_URL}/alerts/entities/alerts/v2`,
            { composite_ids: alertIds },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 3: แปลงข้อมูล
        const rawAlerts = detailsResponse.data.resources;

        const mappedAlerts: CrowdStrikeAlert[] = rawAlerts.map((alert: any) => ({
            detection_id: alert.composite_id,
            severity: alert.severity_name || 'High',
            description: alert.description || 'ตรวจพบพฤติกรรมน่าสงสัย (No description)',
            hostname: alert.device?.hostname || 'Unknown Device',
            timestamp: alert.created_timestamp,
            ipAddress: alert.device?.local_ip || 'Unknown IP',
            username: alert.user_name || 'Unknown User',
            filename: alert.filename || 'ไม่พบชื่อไฟล์',
            filepath: alert.filepath || 'N/A',
            tactic: alert.tactic || 'Unknown',
            technique: alert.technique || 'Unknown',
            cmdline: alert.cmdline || 'N/A',            
            sha256: alert.sha256 || 'N/A',
            disposition: alert.pattern_disposition_description || 'Unknown action',
            macAddress: alert.device?.mac_address || 'N/A'
        }));

        //  4: บันทึกข้อมูลลง Database 
        const newAlerts: CrowdStrikeAlert[] = [];
        for (const alert of mappedAlerts) {
            const query = `
                INSERT INTO "AlertRecord" (
                    id, severity, description, hostname, "ipAddress", 
                    username, filename, timestamp, "mailStatus",
                    tactic, technique, cmdline, filepath, 
                    sha256, disposition, "macAddress"
                )
                VALUES (
                    $1, $2, $3, $4, $5, 
                    $6, $7, $8, $9,
                    $10, $11, $12, $13, 
                    $14, $15, $16
                )
                ON CONFLICT (id) DO NOTHING;
            `;

            const values = [
                alert.detection_id,             // $1
                alert.severity,                 // $2
                alert.description,              // $3
                alert.hostname,                 // $4
                alert.ipAddress,                // $5
                alert.username,                 // $6
                alert.filename,                 // $7
                new Date(alert.timestamp),      // $8
                'PENDING',                      // $9
                alert.tactic,                   // $10
                alert.technique,                // $11
                alert.cmdline,                  // $12
                alert.filepath,                 // $13
                alert.sha256,                   // $14
                alert.disposition,              // $15
                alert.macAddress                // $16
            ];

            try {
                // เก็บผลลัพธ์ที่ได้จากการรันคิวรี
                const result = await pool.query(query, values);

                // ถ้า rowCount === 1 แปลว่าเป็นข้อมูลใหม่ ให้ดันเข้า newAlerts
                if (result.rowCount === 1) {
                    newAlerts.push(alert);
                }
            } catch (dbError) {
                console.error(`เกิดข้อผิดพลาดตอนบันทึก Alert ID: ${alert.detection_id}`, dbError);
            }
        }
        // ส่งคืนเฉพาะ Array ของใหม่เท่านั้น!
        return newAlerts;

    } catch (error) {
        console.error('Error fetching alerts from CrowdStrike:', error);
        return [];
    }
}