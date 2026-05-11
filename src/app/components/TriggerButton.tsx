'use client';

import { useState } from 'react';

export default function TriggerButton({ action }: { action: () => Promise<void> }) {
    const [isPending, setIsPending] = useState(false);

    const handleTrigger = async () => {
        setIsPending(true);
        try {
            await action(); // เรียกฟังก์ชันหลังบ้าน
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการตรวจสอบ');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleTrigger}
            disabled={isPending}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white shadow-md transition-all duration-200
                ${isPending 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
                }`}
        >
            {isPending ? (
                <>
                    {/* SVG Spinner หมุนๆ */}
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังตรวจสอบ...
                </>
            ) : (
                <>
                    ตรวจสอบทันที
                </>
            )}
        </button>
    );
}