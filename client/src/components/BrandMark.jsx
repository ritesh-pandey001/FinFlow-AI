export default function BrandMark({ size = 40, compact = false }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.03] text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
        <rect x="10" y="10" width="44" height="44" rx="14" fill="rgba(15,23,42,0.88)" />
        <path d="M18 20h20c4.4 0 8 3.6 8 8s-3.6 8-8 8H30v8h-6V20h-6z" fill="#dffafe" />
        <path d="M22 24h15c2.2 0 4 1.8 4 4s-1.8 4-4 4H22v-8z" fill="#22d3ee" opacity="0.72" />
        <circle cx="42" cy="40" r="4" fill="#8b5cf6" opacity="0.88" />
      </svg>
    </div>
  );
}