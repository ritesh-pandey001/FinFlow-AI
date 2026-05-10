import { motion } from 'framer-motion';

export default function MetricCard({ icon: Icon, label, value, trend, trendValue, color = '#22d3ee', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="metric-card glass-panel glass-panel-hover group relative flex h-full flex-col justify-between p-5 sm:p-6"
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/70 transition-colors group-hover:text-white" style={{ color }}>
          {Icon && <Icon size={18} />}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            trend === 'up' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-red-400/20 bg-red-400/10 text-red-300'
          }`}>
            <span>{trend === 'up' ? '▲' : '▼'}</span>
            <span>{trendValue || '0%'}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-6">
        <h4 className="text-[11px] font-medium text-white/45">{label}</h4>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-[clamp(1.6rem,2.4vw,2.4rem)] font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="mt-4 h-px w-full bg-white/8" />
        <div className="mt-4 flex items-center justify-between text-[10px] font-medium text-white/25">
          <span>Live</span>
          <span>Auto-refresh</span>
        </div>
      </div>
    </motion.div>
  );
}
