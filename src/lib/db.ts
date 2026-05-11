import { Pool } from 'pg';

// สร้างท่อเชื่อมต่อไปยัง Database จาก DATABASE_URL ในไฟล์ .env
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});