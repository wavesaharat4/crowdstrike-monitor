import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: {
    rejectUnauthorized: false,
  },
});

export async function purgeOldData() {
    try {
        console.log(`[Purge] เริ่มต้นกระบวนการล้างข้อมูลเก่า...`);
        
        // สั่งลบ Alert ที่เก่ากว่า 90 วัน
        const purgeQuery = `
            DELETE FROM "AlertRecord" 
            WHERE "created_at" < NOW() - INTERVAL '90 days'
        `;
        
        const result = await pool.query(purgeQuery);
        console.log(`ล้างข้อมูล Alert และ Log ที่เก่าเกิน 90 วันไปทั้งหมด: ${result.rowCount} รายการ`);

    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการล้างข้อมูล:`, error);
    }
}