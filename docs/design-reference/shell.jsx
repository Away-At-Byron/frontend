// Desktop shell — sidebar nav + topbar + page slot.
// Hosts every screen. Tracks current screen and exposes Nav helpers.

const NAV = [
  { id:'dashboard',   label:'Dashboard',   icon:'Layout' },
  { id:'calendar',    label:'Calendar',    icon:'Grid' },
  { id:'reservation', label:'New booking', icon:'Plus' },
  { id:'housekeeping',label:'Housekeeping',icon:'Sparkles' },
];

const NAV_SECONDARY = [
  { id:'reservations',label:'Reservations', icon:'Bed' },
  { id:'guests',      label:'Guests',       icon:'User' },
  { id:'messages',    label:'Messages',     icon:'Message', badge:3 },
  { id:'reports',     label:'Reports',      icon:'Sparkline' },
  { id:'setup',       label:'Setup',        icon:'Settings' },
];

const PROPERTIES = [
  { id:'all',     name:'All properties', rooms:9 },
  { id:'sunrise', name:'Sunrise',        rooms:3 },
  { id:'shirley', name:'Shirley',        rooms:3 },
  { id:'unwind',  name:'Unwind',         rooms:3 },
];

function Shell({ children }){
  const [screen, setScreen] = React.useState(
    (window.location.hash || '#dashboard').slice(1)
  );
  const [property, setProperty] = React.useState('all');
  const [propOpen, setPropOpen] = React.useState(false);

  React.useEffect(() => {
    const onHash = () => setScreen((window.location.hash || '#dashboard').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id) => { window.location.hash = id; setScreen(id); };
  const current = NAV.concat(NAV_SECONDARY).find(n => n.id === screen) || NAV[0];

  return (
    <div data-screen-label={current.label} style={{
      display:'flex', minHeight:'100vh', background:'var(--linen)',
      fontFamily:'var(--ui)', color:'var(--ink)',
    }}>
      <Sidebar screen={screen} go={go} property={property} setProperty={setProperty}
        propOpen={propOpen} setPropOpen={setPropOpen}/>
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        <Topbar current={current} property={PROPERTIES.find(p=>p.id===property)}/>
        <div style={{ flex:1, minWidth:0 }}>
          {window.Screens[screen] ? React.createElement(window.Screens[screen], { property, go })
            : <Placeholder name={current.label}/> }
        </div>
      </main>
    </div>
  );
}

function Sidebar({ screen, go, property, setProperty, propOpen, setPropOpen }){
  return (
    <aside style={{
      width:260, flex:'0 0 260px', borderRight:'1px solid var(--line)',
      background:'var(--linen)',
      display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh',
    }}>
      {/* Brand */}
      <div style={{ padding:'24px 22px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{
          width:36, height:36, borderRadius:'50%', background:'var(--ink)', color:'var(--linen)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--display)', fontStyle:'italic', fontSize:17,
        }}>a</div>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:16, lineHeight:1, fontWeight:400 }}>
            Away <em style={{ fontStyle:'italic' }}>at Byron</em>
          </div>
          <div className="caps" style={{ marginTop:3, fontSize:9, color:'var(--ink-faint)' }}>
            Reservations · Admin
          </div>
        </div>
      </div>

      {/* Property switcher */}
      <div style={{ padding:'8px 14px 4px', position:'relative' }}>
        <button onClick={() => setPropOpen(!propOpen)} style={{
          width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:10,
          background:'var(--shell)', border:'1px solid var(--line-soft)', borderRadius:'var(--r-2)',
          padding:'10px 12px', cursor:'pointer', font:'inherit', color:'var(--ink)',
        }}>
          <window.Icons.House size={16} strokeWidth={1.6}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:400, lineHeight:1, fontStyle:'italic' }}>
              {PROPERTIES.find(p=>p.id===property).name}
            </div>
            <div className="caps" style={{ fontSize:9, color:'var(--ink-faint)', marginTop:3 }}>
              {PROPERTIES.find(p=>p.id===property).rooms} rooms
            </div>
          </div>
          <window.Icons.ChevronDown size={14} stroke="var(--ink-faint)"/>
        </button>
        {propOpen && (
          <div style={{
            position:'absolute', top:'calc(100% + 4px)', left:14, right:14, zIndex:10,
            background:'var(--paper)', border:'1px solid var(--line)', borderRadius:'var(--r-2)',
            boxShadow:'var(--shadow-pop)', padding:6,
          }}>
            {PROPERTIES.map(p => (
              <button key={p.id} onClick={() => { setProperty(p.id); setPropOpen(false); }} style={{
                width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:'var(--r-1)',
                background: property===p.id ? 'var(--shell)' : 'transparent',
                border:'none', cursor:'pointer', font:'inherit', color:'var(--ink)',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span style={{ fontFamily:'var(--display)', fontStyle: property===p.id?'italic':'normal' }}>{p.name}</span>
                <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{p.rooms}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav style={{ padding:'14px 10px', display:'flex', flexDirection:'column', gap:2 }}>
        <div className="caps" style={{ padding:'8px 12px 4px', color:'var(--ink-faint)' }}>Today</div>
        {NAV.map(n => <NavItem key={n.id} item={n} active={screen===n.id} onClick={() => go(n.id)}/>)}

        <div className="caps" style={{ padding:'18px 12px 4px', color:'var(--ink-faint)' }}>Manage</div>
        {NAV_SECONDARY.map(n => <NavItem key={n.id} item={n} active={screen===n.id} onClick={() => go(n.id)}/>)}
      </nav>

      {/* Footer / user */}
      <div style={{ marginTop:'auto', padding:'14px 14px 18px', borderTop:'1px solid var(--line-soft)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <window.Avatar name="Mia Hartwell" size={36} tint="teal"/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:400, lineHeight:1.1 }}>Mia Hartwell</div>
            <div className="caps" style={{ fontSize:9, color:'var(--ink-faint)', marginTop:2 }}>Owner · Manager</div>
          </div>
          <window.IconButton size={30} variant="quiet"><window.Icons.Settings size={15}/></window.IconButton>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onClick }){
  const I = window.Icons[item.icon];
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:12, padding:'9px 12px',
      borderRadius:'var(--r-2)', border:'none', cursor:'pointer', font:'inherit',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--linen)' : 'var(--ink)',
      width:'100%', textAlign:'left',
    }}>
      <I size={17} strokeWidth={1.6}/>
      <span style={{ flex:1, fontSize:13.5, fontWeight: active?600:500 }}>{item.label}</span>
      {item.badge && <span style={{
        background: active ? 'var(--linen)' : 'var(--terra)',
        color: active ? 'var(--ink)' : 'var(--linen)',
        fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:'var(--r-pill)',
      }}>{item.badge}</span>}
    </button>
  );
}

function Topbar({ current, property }){
  const today = '20 Nov · Thursday';
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, padding:'18px 32px',
      borderBottom:'1px solid var(--line)', background:'var(--linen)',
      position:'sticky', top:0, zIndex:5,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="caps" style={{ color:'var(--ink-faint)', fontSize:10 }}>{today} · {property.name}</div>
        <div style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:28, lineHeight:1.05, letterSpacing:'var(--tight)', marginTop:4 }}>
          {current.id === 'dashboard'
            ? <>Good <em style={{ fontStyle:'italic' }}>morning</em>, Mia</>
            : current.label}
        </div>
      </div>

      {/* Search */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        background:'var(--paper)', border:'1px solid var(--line)',
        borderRadius:'var(--r-pill)', padding:'10px 16px', width:320,
      }}>
        <window.Icons.Search size={15} stroke="var(--ink-faint)"/>
        <input placeholder="Search guests, rooms, #5453…" style={{
          flex:1, border:'none', outline:'none', background:'transparent',
          font:'inherit', fontSize:13, color:'var(--ink)',
        }}/>
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)', padding:'2px 6px', background:'var(--shell)', borderRadius:4 }}>⌘K</span>
      </div>

      <window.IconButton variant="paper" size={42} title="Notifications">
        <window.Icons.Bell size={17}/>
        <span style={{ position:'absolute', marginLeft:14, marginTop:-12, width:8, height:8, borderRadius:'50%', background:'var(--terra)', border:'2px solid var(--linen)' }}/>
      </window.IconButton>
      <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={15}/>}>New booking</window.Button>
    </div>
  );
}

function Placeholder({ name }){
  return (
    <div style={{ padding:'80px 32px', textAlign:'center', color:'var(--ink-faint)' }}>
      <div style={{ fontFamily:'var(--display)', fontStyle:'italic', fontSize:32 }}>{name}</div>
      <div style={{ marginTop:12, fontSize:14 }}>Screen not part of this round.</div>
    </div>
  );
}

window.Shell = Shell;
window.Screens = window.Screens || {};
