/**
 * RoomArt — stylized SVG placeholder for a room photo. Ported from the
 * approved design bundle (system/room-art.jsx). Real MinIO-hosted
 * photographs replace this once the Inventory/Rooms upload flow lands.
 * Pure SVG, no deps — safe in Server Components.
 */
const PALETTES = {
  warm: { sky: "#F6DDD0", wall: "#FBEFE8", floor: "#E6D4B7", sheet: "#FBF8F3", accent: "#C77E63", shade: "#A89274", plant: "#6E9B97", frame: "#5A4A3A" },
  teal: { sky: "#E8F1EE", wall: "#FBF8F3", floor: "#E6D4B7", sheet: "#FBF8F3", accent: "#9DC9C4", shade: "#6E9B97", plant: "#3D5C5A", frame: "#5A4A3A" },
  dark: { sky: "#C77E63", wall: "#3D5C5A", floor: "#5A4A3A", sheet: "#E6D4B7", accent: "#E8B79E", shade: "#1F2A2A", plant: "#6E9B97", frame: "#1F2A2A" },
}

export function RoomArt({
  palette = "warm",
  showLabel = false,
  style = {},
}: {
  palette?: keyof typeof PALETTES
  showLabel?: boolean
  style?: React.CSSProperties
}) {
  const P = PALETTES[palette]
  const gid = `sun-${palette}`
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <rect x="0" y="0" width="400" height="200" fill={P.wall} />
        <rect x="0" y="200" width="400" height="80" fill={P.floor} />
        <rect x="40" y="40" width="140" height="120" rx="2" fill={P.sky} />
        <path d="M40 40 L180 40 L180 160 L40 160 Z" fill={`url(#${gid})`} opacity=".7" />
        <line x1="110" y1="40" x2="110" y2="160" stroke={P.wall} strokeWidth="2" />
        <line x1="40" y1="100" x2="180" y2="100" stroke={P.wall} strokeWidth="2" />
        <path d="M60 160 L160 160 L210 280 L20 280 Z" fill={P.sky} opacity=".35" />
        <rect x="200" y="150" width="170" height="60" rx="4" fill={P.sheet} />
        <rect x="200" y="150" width="170" height="14" rx="3" fill={P.accent} opacity=".35" />
        <rect x="208" y="158" width="46" height="22" rx="3" fill={P.wall} />
        <rect x="258" y="158" width="46" height="22" rx="3" fill={P.wall} />
        <rect x="200" y="208" width="170" height="4" fill={P.shade} opacity=".4" />
        <rect x="370" y="172" width="14" height="6" fill={P.shade} />
        <rect x="374" y="156" width="6" height="16" fill={P.frame} />
        <path d="M368 156 L386 156 L382 142 L372 142 Z" fill={P.accent} />
        <ellipse cx="32" cy="246" rx="14" ry="4" fill={P.shade} opacity=".25" />
        <rect x="22" y="220" width="20" height="22" rx="2" fill={P.frame} />
        <path d="M18 220 Q26 198 32 220 Q38 200 44 220 Q40 208 32 215 Z" fill={P.plant} />
        <rect x="220" y="60" width="50" height="60" fill={P.frame} opacity=".15" />
        <rect x="224" y="64" width="42" height="52" fill={P.shade} />
        <path d="M224 100 Q245 80 266 100 L266 116 L224 116 Z" fill={P.plant} opacity=".7" />
        <circle cx="252" cy="78" r="6" fill={P.accent} opacity=".7" />
        <rect x="290" y="68" width="40" height="46" fill={P.frame} opacity=".15" />
        <rect x="294" y="72" width="32" height="38" fill={P.sheet} />
        <path d="M294 96 L310 86 L326 100 L326 110 L294 110 Z" fill={P.shade} opacity=".6" />
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".9" />
            <stop offset="100%" stopColor={P.sky} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div
          style={{
            position: "absolute", left: 10, bottom: 10, padding: "5px 9px",
            borderRadius: 99, background: "rgba(31,42,42,.55)", color: "#FBF8F3",
            font: '300 9px/1 var(--font-sans), sans-serif', letterSpacing: ".14em",
            textTransform: "uppercase", backdropFilter: "blur(6px)",
          }}
        >
          Room photo · placeholder
        </div>
      )}
    </div>
  )
}
