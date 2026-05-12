'use client';

import { useEffect, useState } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const formatted = now.toLocaleString('en-US', {
        weekday: 'short',
        day: '2-digit',
        year: 'numeric',
        month: 'short',   
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setTime(formatted);
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] backdrop-blur-sm">
      {/* pulse dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
      </span>

      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-bold">
          System Time
        </span>

        <span className="font-mono text-sm text-slate-100 tracking-wide">
          {time}
        </span>
      </div>
    </div>
  );
}