import { fetchCrowdStrikeAlerts } from '@/lib/services/crowdstrike';
import { processAlerts } from '@/lib/jobs/alertJob';
import { revalidatePath } from 'next/cache';
import TriggerButton from './components/TriggerButton';
import { pool } from '@/lib/db';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  //อ่านจาก DB ไม่ไปยิง CrowdStrike API
  const result = await pool.query(
    `SELECT * FROM "AlertRecord" ORDER BY timestamp DESC`
  );
  const allAlerts = result.rows;
  async function runManualCheck() {
    'use server';
    console.log("Manual check triggered by user");
    await processAlerts();
    revalidatePath('/');
  }

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-200 font-sans p-6 md:p-10">

      {/* Background grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Top red accent bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-10 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      <div className="relative z-[1] max-w-[1400px] mx-auto space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div>
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[11px] font-mono tracking-[0.18em] text-red-500 font-bold uppercase">
                LIVE
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-tight text-slate-50 leading-none mb-2">
              Security<span className="text-red-500">.</span>
            </h1>

            <p className="text-slate-400 text-sm"> {/* ปรับให้สว่างขึ้นจาก 500 เป็น 400 */}
              CrowdStrike Monitoring System
              <span className="mx-2 text-slate-700">|</span>
              Last Sync:{' '}
              <span className="font-mono text-slate-300 font-medium"> {/* ปรับให้สว่างขึ้นจาก 400 เป็น 300 */}
                {new Date().toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex-shrink-0 pt-1">
            <TriggerButton action={runManualCheck} />
          </div>
        </header>

        {/* ── Stats Card ── */}
        <div>
          <div className="inline-flex items-center gap-5 bg-red-500/[0.07] border border-red-500/20 border-l-4 border-l-red-500 rounded-2xl px-8 py-5">
            <div className="w-12 h-12 rounded-xl bg-red-500/[0.12] flex items-center justify-center text-2xl flex-shrink-0">
              🔥
            </div>
            <div>
              <p className="text-[11px] text-red-400 uppercase tracking-[0.12em] font-bold mb-1">
                High / Critical Alerts
              </p>
              <p className="text-5xl font-black text-red-500 leading-none">
                {allAlerts.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Event Log ── */}
        <section>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">

            {/* Section header */}
            <div className="flex justify-between items-center px-7 py-4 border-b border-white/[0.06] bg-white/[0.015]">
              <h2 className="font-bold text-base text-slate-100 tracking-tight">
                Latest Security Events
              </h2>
              <span className="text-[9px] text-cyan-400 tracking-[0.2em] uppercase font-bold font-mono bg-cyan-400/[0.07] border border-cyan-400/[0.18] px-3 py-1 rounded">
                ● Live Updates
              </span>
            </div>

            {/* Empty state */}
            {allAlerts.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="font-semibold text-slate-400 text-base"> {/* ปรับจาก 500 เป็น 400 */}
                  No high-severity threats detected.
                </p>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-3">
                {allAlerts.map((alert) => (
                  <div
                    key={alert.detection_id}
                    className="bg-red-500/[0.045] border border-red-500/[0.15] border-l-[3px] border-l-red-500 rounded-xl p-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4"
                  >
                    {/* Timestamp */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1"> {/* หัวข้อปรับเป็น 400 */}
                        Timestamp
                      </p>
                      <p className="font-mono text-[0.78rem] text-slate-300"> {/* ข้อมูลปรับเป็น 300 */}
                        {new Date(alert.timestamp).toLocaleString('en-US')}
                      </p>
                    </div>

                    {/* Detection ID / Device */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Detection ID / Device
                      </p>
                      <p className="text-sm font-bold text-slate-100">
                        {alert.hostname}
                      </p>
                      <p className="font-mono text-[0.68rem] text-slate-400 break-all mt-1"> {/* ID มืดไป ปรับจาก 600 เป็น 400 */}
                        {alert.detection_id}
                      </p>
                    </div>

                    {/* User / Network */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        User / Network
                      </p>
                      <p className="text-sm font-semibold text-slate-100"> {/* ชื่อคนให้ชัดขึ้นเป็น 100 */}
                        {alert.username}
                      </p>
                      <p className="font-mono text-xs text-slate-400 mt-0.5"> {/* IP ปรับจาก 500 เป็น 400 */}
                        {alert.ip_address}
                      </p>
                    </div>

                    {/* File */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        File
                      </p>
                      <p className="font-mono text-[0.78rem] text-cyan-300 font-semibold break-all">
                        {alert.filename}
                      </p>
                    </div>

                    {/* Severity */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Severity
                      </p>
                      <span className="inline-flex items-center text-[10px] font-black tracking-[0.14em] uppercase text-red-400 bg-red-500/[0.12] border border-red-500/30 px-2.5 py-0.5 rounded-md">
                        {alert.severity}
                      </span>
                    </div>

                    {/* Description — full width */}
                    <div className="col-span-full bg-black/20 border-l-2 border-red-500/35 rounded-r-md px-4 py-3 mt-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Description
                      </p>
                      <p className="text-[0.8rem] text-slate-300 leading-relaxed"> {/* เนื้อหาคำอธิบายปรับเป็น 300 จะอ่านง่ายขึ้นมาก */}
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}