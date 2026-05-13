'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    // ตั้งเวลาให้สั่งรีเฟรชข้อมูลตามช่วงเวลาที่กำหนด (Default คือ 1 นาที หรือ 60,000 ms)
    const interval = setInterval(() => {
      console.log('อัปเดตข้อมูลอัตโนมัติ...');
      router.refresh(); // สั่งให้ Next.js ไปดึงข้อมูลจาก Server Component ใหม่โดยไม่รีโหลดหน้าเว็บ
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null; // คอมโพเนนต์นี้ไม่ต้องแสดงผลอะไรบนหน้าจอ
}