import AutoRefresh from './components/AutoRefresh';
import LiveClock from './components/LiveClock';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

//  ฟังก์ชันช่วยสร้าง Badge สีสวยๆ สำหรับสถานะ Email / Teams
function NotificationBadge({ type, status }: { type: string, status: string | null }) {
  const normalizedStatus = (status || 'PENDING').toUpperCase();
  let colorClass = 'text-slate-400 bg-slate-500/10 border-slate-500/20'; // สีเทาสำหรับ PENDING
  let icon = '⏳';

  if (normalizedStatus === 'SENT') {
    colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; // สีเขียวสำหรับ SENT
    icon = '✅';
  } else if (normalizedStatus === 'FAIL' || normalizedStatus === 'FAILED') {
    colorClass = 'text-red-400 bg-red-500/10 border-red-500/20'; // สีแดงสำหรับ FAIL
    icon = '❌';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-md border ${colorClass}`}>
      <span>{icon}</span> {type}: {normalizedStatus}
    </span>
  );
}

export default async function DashboardPage() {
  //  อัปเดต SQL ให้ดึงสถานะล่าสุดจากตาราง notification_logs มาด้วย
  const result = await pool.query(`
    SELECT a.*, 
           (SELECT mail_status FROM notification_logs WHERE alert_id = a.id ORDER BY sent_at DESC LIMIT 1) as mail_log_status,
           (SELECT teams_status FROM notification_logs WHERE alert_id = a.id ORDER BY sent_at DESC LIMIT 1) as teams_log_status
    FROM "AlertRecord" a
    ORDER BY a.timestamp DESC
  `);
  const allAlerts = result.rows;

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-200 font-sans p-6 md:p-10">
      <AutoRefresh intervalMs={15000} />
      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="fixed top-0 left-0 right-0 h-[3px] z-10 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      <div className="relative z-[1] max-w-[1400px] mx-auto space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div>
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

            <p className="text-slate-400 text-sm">
              CrowdStrike Monitoring System
              <span className="mx-2 text-slate-700">|</span>
              Last Sync:{' '}
              <span className="font-mono text-slate-300 font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <LiveClock />
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
                Total Alerts Recorded
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

            <div className="flex justify-between items-center px-7 py-4 border-b border-white/[0.06] bg-white/[0.015]">
              <h2 className="font-bold text-base text-slate-100 tracking-tight">
                Latest Security Events
              </h2>
            </div>

            {allAlerts.length === 0 ? (
              <div className="py-20 text-center">            
                <p className="font-semibold text-slate-400 text-base">
                  No threats detected in database.
                </p>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                {allAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-red-500/[0.045] border border-red-500/[0.15] border-l-[3px] border-l-red-500 rounded-xl p-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5"
                  >
                    {/* 1. Timestamp */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Timestamp
                      </p>
                      <p className="font-mono text-[0.78rem] text-slate-300">
                        {new Date(alert.timestamp).toLocaleString('en-US')}
                      </p>
                    </div>

                    {/* 2. Device / Detection ID */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Device / ID
                      </p>
                      <p className="text-sm font-bold text-slate-100">
                        {alert.hostname}
                      </p>
                      <p className="font-mono text-[0.68rem] text-slate-400 break-all mt-1">
                        {alert.id}
                      </p>
                    </div>

                    {/* 3. User / Network */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        User / Network
                      </p>
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {alert.username}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        IP: {alert.ipAddress}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        MAC: {alert.macAddress}
                      </p>
                    </div>

                    {/* 4. Threat Intel */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Threat Intel
                      </p>
                      <p className="text-xs font-bold text-slate-200">
                        {alert.tactic}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {alert.technique}
                      </p>
                    </div>

                    {/* 5. Severity & Action */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Severity & Action
                      </p>
                      <div className="flex flex-col items-start gap-1.5 mt-1">
                        <span className="inline-flex items-center text-[10px] font-black tracking-[0.14em] uppercase text-red-400 bg-red-500/[0.12] border border-red-500/30 px-2.5 py-0.5 rounded-md">
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-yellow-500/90 leading-tight">
                          {alert.disposition}
                        </span>
                      </div>
                    </div>

                    {/*  6. Notification Status  */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                        Notifications
                      </p>
                      <div className="flex flex-col items-start gap-2 mt-1">
                        <NotificationBadge 
                          type="Email" 
                          status={alert.mail_log_status || alert.mailStatus} 
                        />
                        <NotificationBadge 
                          type="Teams" 
                          status={alert.teams_log_status || alert.mailStatus} 
                        />
                      </div>
                    </div>

                    {/* 7. Deep Dive: Description, File, Path, Cmdline */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-black/30 border-l-2 border-red-500/40 rounded-r-md px-5 py-4 mt-2">

                      {/* Description */}
                      <div className="col-span-full">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                          Description
                        </p>
                        <p className="text-[0.8rem] text-slate-300 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>

                      {/* File & Hash */}
                      <div className="col-span-full md:col-span-1 border-t border-white/5 pt-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                          Target File
                        </p>
                        <p className="font-mono text-[0.8rem] text-cyan-400 break-all mb-1">
                          {alert.filename}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 break-all">
                          SHA256: {alert.sha256}
                        </p>
                      </div>

                      {/* Filepath */}
                      <div className="col-span-full md:col-span-1 border-t border-white/5 pt-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                          File Path
                        </p>
                        <p className="font-mono text-[0.75rem] text-slate-400 break-all">
                          {alert.filepath}
                        </p>
                      </div>

                      {/* Command Line (Terminal Style) */}
                      <div className="col-span-full border-t border-white/5 pt-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-1">
                          Command Line Execution
                        </p>
                        <div className="bg-[#050505] p-3 rounded-md border border-white/10 mt-1.5 shadow-inner">
                          <code className="font-mono text-[0.75rem] text-green-400 break-all">
                            {alert.cmdline !== 'N/A' && alert.cmdline !== null ? `> ${alert.cmdline}` : '> N/A'}
                          </code>
                        </div>
                      </div>

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