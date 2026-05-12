// ตัวอย่างการอัปเดตไฟล์ types/alert.ts
export interface CrowdStrikeAlert {
    id: string;
    detection_id: string;
    severity: string;
    description: string;
    hostname: string;
    ipAddress: string;
    username: string;
    filename: string;
    timestamp: string | Date;
    filepath: string;
    tactic: string;
    technique: string;
    cmdline: string;
    sha256: string;
    disposition: string;
    macAddress: string;

    customer_message : string; // เพิ่มฟิลด์นี้เพื่อเก็บข้อความที่ AI สรุปให้ลูกค้า
}