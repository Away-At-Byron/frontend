// Away PMS — shared UI primitives.
// Imported by Design System, Desktop and Mobile files.
// CSS tokens live in system/tokens.css; functions just compose them.

// ─── Button ──────────────────────────────────────────────────
function Button({ variant='primary', size='md', icon, iconRight, children, onClick, style={} }){
  const variants = {
    primary: { background:'var(--ink)',   color:'var(--linen)',  border:'1px solid var(--ink)' },
    teal:    { background:'var(--teal)',  color:'var(--ink)',    border:'1px solid var(--teal)' },
    accent:  { background:'var(--terra)', color:'var(--linen)',  border:'1px solid var(--terra)' },
    ghost:   { background:'transparent',  color:'var(--ink)',    border:'1px solid var(--line-strong)' },
    quiet:   { background:'transparent',  color:'var(--ink)',    border:'1px solid transparent' },
    paper:   { background:'var(--paper)', color:'var(--ink)',    border:'1px solid var(--line)' },
    danger:  { background:'transparent',  color:'var(--terra-deep)', border:'1px solid rgba(168,98,75,.32)' },
  };
  const sizes = {
    sm: { height:32, padding:'0 12px', fontSize:12, gap:6 },
    md: { height:40, padding:'0 18px', fontSize:13, gap:8 },
    lg: { height:48, padding:'0 22px', fontSize:14, gap:10 },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button onClick={onClick} style={{
      ...v, ...s, borderRadius:'var(--r-pill)', cursor:'pointer',
      fontFamily:'var(--ui)', fontWeight:600, letterSpacing:'.01em',
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:s.gap,
      whiteSpace:'nowrap', transition:'transform .08s, box-shadow .12s, background .12s',
      ...style,
    }}>
      {icon ? icon : null}
      {children}
      {iconRight ? iconRight : null}
    </button>
  );
}

// ─── Icon Button ─────────────────────────────────────────────
function IconButton({ children, size=38, variant='shell', style={}, onClick, title }){
  const bg = variant==='shell' ? 'var(--shell)' : variant==='paper' ? 'var(--paper)' : variant==='ink' ? 'var(--ink)' : 'transparent';
  const fg = variant==='ink' ? 'var(--linen)' : 'var(--ink)';
  return (
    <button onClick={onClick} title={title} style={{
      width:size, height:size, borderRadius:'50%', border:'none', cursor:'pointer',
      background:bg, color:fg,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      ...style,
    }}>{children}</button>
  );
}

// ─── Status / Pill ───────────────────────────────────────────
function Pill({ children, tone='neutral', size='md', solid, ink, style={} }){
  const tones = {
    neutral: { bg:'transparent',     fg:'var(--ink)',     bd:'var(--line-strong)' },
    ok:      { bg:'var(--ok-bg)',    fg:'var(--ok-fg)',   bd:'transparent' },
    warn:    { bg:'var(--warn-bg)',  fg:'var(--warn-fg)', bd:'transparent' },
    bad:     { bg:'var(--bad-bg)',   fg:'var(--bad-fg)',  bd:'transparent' },
    info:    { bg:'var(--info-bg)',  fg:'var(--info-fg)', bd:'transparent' },
    teal:    { bg:'var(--teal)',     fg:'var(--ink)',     bd:'transparent' },
    accent:  { bg:'var(--terra)',    fg:'var(--linen)',   bd:'transparent' },
    ink:     { bg:'var(--ink)',      fg:'var(--linen)',   bd:'transparent' },
    paper:   { bg:'var(--paper)',    fg:'var(--ink)',     bd:'var(--line)' },
  };
  const sizes = {
    sm: { fontSize:9.5, padding:'4px 8px', gap:4 },
    md: { fontSize:10, padding:'6px 10px', gap:5 },
    lg: { fontSize:11, padding:'8px 12px', gap:6 },
  };
  const t = tones[tone];
  const s = sizes[size];
  return (
    <span style={{
      background:t.bg, color:t.fg, border:`1px solid ${t.bd}`,
      ...s, borderRadius:'var(--r-pill)',
      fontFamily:'var(--mono)', fontWeight:500,
      letterSpacing:'var(--tracked)', textTransform:'uppercase', whiteSpace:'nowrap',
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:s.gap,
      ...style,
    }}>{children}</span>
  );
}

// ─── Filter Pill (toggle) ────────────────────────────────────
function FilterPill({ children, on, count, onClick, style={} }){
  return (
    <button onClick={onClick} style={{
      height:34, padding:'0 14px', borderRadius:'var(--r-pill)', cursor:'pointer',
      background: on ? 'var(--ink)' : 'transparent',
      color: on ? 'var(--linen)' : 'var(--ink)',
      border: on ? 'none' : '1px solid var(--line-strong)',
      fontFamily:'var(--mono)', fontSize:10, fontWeight:500,
      letterSpacing:'var(--tracked)', textTransform:'uppercase',
      display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
      ...style,
    }}>
      {children}
      {count!=null && <span style={{ opacity: on?.7:.5 }}>· {count}</span>}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────
function Card({ children, surface='paper', pad=20, style={}, ...rest }){
  const surfaces = {
    paper: 'var(--paper)', shell:'var(--shell)', linen:'var(--linen)',
    mist:'var(--mist)', ink:'var(--ink)',
  };
  return (
    <div style={{
      background:surfaces[surface], borderRadius:'var(--r-3)',
      padding:pad, border:'1px solid var(--line)',
      boxShadow:'var(--shadow-1)',
      ...style,
    }} {...rest}>{children}</div>
  );
}

// ─── Stat block ──────────────────────────────────────────────
function Stat({ icon, label, value, sub, tone, style={} }){
  const I = window.Icons[icon];
  return (
    <div style={{
      background:'var(--paper)', borderRadius:'var(--r-3)',
      padding:'18px 20px', border:'1px solid var(--line)', boxShadow:'var(--shadow-1)',
      ...style,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--ink-faint)' }}>
        {I && <I size={15} strokeWidth={1.6}/>}
        <span className="caps">{label}</span>
      </div>
      <div style={{
        fontFamily:'var(--display)', fontWeight:300, fontSize:38, lineHeight:1,
        letterSpacing:'var(--tight)', marginTop:14,
      }}>
        {value}
      </div>
      {sub && <div style={{ marginTop:8, fontSize:12.5, color:'var(--ink-soft)' }}>
        {tone === 'ok' && <span style={{ color:'var(--teal-ink)', fontWeight:600 }}>↑ </span>}
        {tone === 'bad' && <span style={{ color:'var(--terra-deep)', fontWeight:600 }}>↓ </span>}
        {sub}
      </div>}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ name, size=36, tint='teal', src }){
  const tints = {
    teal: { bg:'var(--teal)',     fg:'var(--ink)' },
    shell:{ bg:'var(--shell-deep)', fg:'var(--ink)' },
    sand: { bg:'var(--sand)',     fg:'var(--ink)' },
    ink:  { bg:'var(--ink)',      fg:'var(--linen)' },
    apri: { bg:'var(--apricot)',  fg:'var(--ink)' },
  };
  const t = tints[tint] || tints.teal;
  const initials = (name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flex:'0 0 auto',
      background:t.bg, color:t.fg, overflow:'hidden',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--display)', fontStyle:'italic', fontWeight:400,
      fontSize: Math.round(size*0.42),
    }}>
      {src ? <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initials}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────
function SectionHead({ kicker, title, right, style={} }){
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between',
      marginBottom:14, ...style }}>
      <div>
        {kicker && <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:4 }}>{kicker}</div>}
        {title && <div style={{
          fontFamily:'var(--display)', fontWeight:300, fontSize:22,
          letterSpacing:'var(--tight)', lineHeight:1.1,
        }}>{title}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Image slot wrapper (custom element passthrough) ─────────
// `<image-slot>` is defined in system/image-slot.js. We just provide
// a React-friendly factory that emits the correct attributes.
function ImgSlot({ id, w='100%', h='100%', shape='rect', radius, placeholder, style={} }){
  // React doesn't pre-define image-slot; cast via createElement.
  return React.createElement('image-slot', {
    id, shape, radius, placeholder,
    style:{ width:w, height:h, display:'block', ...style },
  });
}

Object.assign(window, {
  Button, IconButton, Pill, FilterPill, Card, Stat, Avatar, SectionHead, ImgSlot,
});
