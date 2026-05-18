// Desktop · Dashboard — today overview for the manager.

const TODAY_ARRIVALS = [
  { id:5453, name:'Liliana Djokic', room:'Sunrise · 03', palette:'warm',
    eta:'10:00pm', nts:3, guests:'2 adults', flag:'Late arrival · keys via lockbox', status:'warn', label:'Pending' },
  { id:5446, name:'James Acres',   room:'Shirley · 01', palette:'teal',
    eta:'3:00pm',  nts:4, guests:'2 adults · 2 kids', flag:'Returning · 3rd visit', status:'ok',   label:'Confirmed' },
  { id:5448, name:'Priya Mehta',   room:'Unwind · 02',  palette:'warm',
    eta:'5:30pm',  nts:2, guests:'1 adult',  flag:'Airport pickup requested', status:'ok',   label:'Confirmed' },
];

const TODAY_DEPARTURES = [
  { id:5421, name:'Sara Ng',          room:'Sunrise · 01', palette:'warm', out:'10:00am', balance:'A$0',     status:'ok',   label:'Departed' },
  { id:5428, name:'Hector Llanos',    room:'Shirley · 02', palette:'teal', out:'11:30am', balance:'A$148',   status:'warn', label:'Open folio' },
];

const FEED = [
  { t:'08:42', label:'James Acres uploaded ID', tone:'info' },
  { t:'08:21', label:'Night audit closed · 19 Nov', tone:'ok' },
  { t:'07:58', label:'Sara Ng checked out · Sunrise 01', tone:'ok' },
  { t:'07:50', label:'Housekeeping started · Sunrise 01', tone:'info' },
  { t:'Yest 22:14', label:'Liliana Djokic confirmed payment method', tone:'ok' },
  { t:'Yest 19:02', label:'New booking #5453 · Sunrise 03', tone:'info' },
];

function Dashboard(){
  return (
    <div style={{ padding:'24px 32px 48px', display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14 }}>
        <window.Stat icon="House"     label="Occupancy"        value="78%" sub="7 of 9 rooms"           tone="ok"/>
        <window.Stat icon="ArrowRight"label="Arrivals today"   value="3"   sub="2 confirmed · 1 pending" />
        <window.Stat icon="Logout"    label="Departures today" value="2"   sub="A$148 open balance"      tone="bad"/>
        <window.Stat icon="Sparkles"  label="Rooms to clean"   value="4"   sub="2 due before 3pm"        />
        <window.Stat icon="Dollar"    label="Tonight"          value="A$1,820" sub="ADR A$260 · ↑ 6%"     tone="ok"/>
      </div>

      {/* Hero — pending arrival w/ countdown */}
      <HeroPending/>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:24 }}>
        {/* Today's flow */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <ArrivalsBlock/>
          <DeparturesBlock/>
        </div>
        {/* Right rail */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <OccupancyCard/>
          <FeedCard/>
        </div>
      </div>
    </div>
  );
}

// ─────────── Hero pending ───────────
function HeroPending(){
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'320px 1fr', gap:0,
      background:'var(--paper)', borderRadius:'var(--r-4)', overflow:'hidden',
      border:'1px solid var(--line)', boxShadow:'var(--shadow-2)',
    }}>
      <div style={{ position:'relative', background:'var(--shell)' }}>
        <window.ImgSlot id="dash-hero-room" shape="rect" placeholder="Sunrise 03 — room photo"/>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <window.RoomArt palette="warm" showLabel={false}/>
        </div>
        <div style={{ position:'absolute', top:14, left:14 }}>
          <window.Pill tone="ink">Sunrise · 03</window.Pill>
        </div>
        <div style={{ position:'absolute', bottom:14, left:14, padding:'8px 12px', borderRadius:'var(--r-pill)',
          background:'rgba(31,42,42,.78)', color:'var(--linen)',
          display:'flex', alignItems:'center', gap:8, backdropFilter:'blur(8px)' }}>
          <window.Icons.Clock size={13}/>
          <span className="mono" style={{ fontSize:10, letterSpacing:'var(--tracked)' }}>02:43 to confirm</span>
        </div>
      </div>
      <div style={{ padding:'24px 28px 22px', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>New · Needs confirmation</div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>#5453 · 3 nights</div>
        </div>
        <h2 style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:34, lineHeight:1.05, letterSpacing:'var(--tight)', margin:'10px 0 0' }}>
          Liliana Djokic, <em style={{ fontStyle:'italic' }}>Sunrise 03</em>.
        </h2>
        <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:18, color:'var(--ink-soft)', fontSize:13.5 }}>
          <Meta icon="Calendar" label="22 Nov · 3pm → 25 Nov · 10am"/>
          <Meta icon="User"     label="2 adults"/>
          <Meta icon="Pin"      label="Booking.com · A$840"/>
          <Meta icon="Alert"    label="Late arrival 10pm"/>
        </div>
        <p style={{ marginTop:14, fontSize:13.5, color:'var(--ink-soft)', lineHeight:1.55, maxWidth:540 }}>
          Flight lands 10pm Tue — guest needs late check-in. Vegetarian breakfast for two & airport pickup requested.
          Repeat guest, last stayed June 2025.
        </p>
        <div style={{ display:'flex', gap:10, marginTop:'auto', paddingTop:18 }}>
          <window.Button variant="teal" iconRight={<window.Icons.ArrowRight size={15}/>}>Confirm booking</window.Button>
          <window.Button variant="ghost">Open reservation</window.Button>
          <window.Button variant="danger" style={{ marginLeft:'auto' }}>Decline</window.Button>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, label }){
  const I = window.Icons[icon];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7 }}>
      <I size={14} strokeWidth={1.6} stroke="var(--ink-faint)"/>
      <span>{label}</span>
    </span>
  );
}

// ─────────── Arrivals block ───────────
function ArrivalsBlock(){
  return (
    <window.Card surface="paper" pad={0}>
      <div style={{ padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:'1px solid var(--line-soft)' }}>
        <div>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>Arriving today</div>
          <div style={{ fontFamily:'var(--display)', fontWeight:400, fontSize:20, marginTop:4 }}>3 stays · 5 guests</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <window.FilterPill on>All</window.FilterPill>
          <window.FilterPill>Confirmed</window.FilterPill>
          <window.FilterPill>Pending</window.FilterPill>
        </div>
      </div>
      <div>
        {TODAY_ARRIVALS.map((a, i) => <ArrivalRow key={a.id} a={a} divider={i>0}/>)}
      </div>
    </window.Card>
  );
}

function ArrivalRow({ a, divider }){
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'56px 1.2fr 1fr 110px 100px 130px', gap:16, alignItems:'center',
      padding:'14px 22px', borderTop: divider?'1px solid var(--line-soft)':'none',
    }}>
      <div style={{ width:52, height:52, borderRadius:'var(--r-2)', overflow:'hidden', position:'relative' }}>
        <window.ImgSlot id={`dash-arr-${a.id}`} shape="rounded" radius={10} placeholder=""/>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <window.RoomArt palette={a.palette} showLabel={false}/>
        </div>
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:400 }}>
          {a.name} · <em style={{ fontStyle:'italic' }}>{a.room}</em>
        </div>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:2 }}>
          {a.guests} · {a.nts} nts
        </div>
      </div>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>
        <window.Icons.Alert size={12} stroke="var(--terra)" style={{ marginRight:6, verticalAlign:'-2px' }}/>
        {a.flag}
      </div>
      <div className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>ETA {a.eta}</div>
      <window.Pill tone={a.status}>{a.label}</window.Pill>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <window.Button size="sm" variant="teal">Check in</window.Button>
        <window.IconButton size={32} variant="quiet"><window.Icons.More size={15}/></window.IconButton>
      </div>
    </div>
  );
}

// ─────────── Departures ───────────
function DeparturesBlock(){
  return (
    <window.Card pad={0}>
      <div style={{ padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:'1px solid var(--line-soft)' }}>
        <div>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>Departing today</div>
          <div style={{ fontFamily:'var(--display)', fontWeight:400, fontSize:20, marginTop:4 }}>2 stays · A$148 open</div>
        </div>
        <window.Button variant="ghost" size="sm">Open all folios</window.Button>
      </div>
      {TODAY_DEPARTURES.map((d, i) => (
        <div key={d.id} style={{
          display:'grid', gridTemplateColumns:'56px 1.2fr 90px 110px 100px 130px', gap:16, alignItems:'center',
          padding:'14px 22px', borderTop: i?'1px solid var(--line-soft)':'none',
        }}>
          <div style={{ width:52, height:52, borderRadius:'var(--r-2)', overflow:'hidden', position:'relative' }}>
            <window.ImgSlot id={`dash-dep-${d.id}`} shape="rounded" radius={10} placeholder=""/>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              <window.RoomArt palette={d.palette} showLabel={false}/>
            </div>
          </div>
          <div>
            <div style={{ fontFamily:'var(--display)', fontSize:16 }}>{d.name} · <em style={{ fontStyle:'italic' }}>{d.room}</em></div>
            <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:2 }}>Departing today</div>
          </div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{d.out}</div>
          <div style={{ fontFamily:'var(--display)', fontStyle: d.balance==='A$0'?'normal':'italic', fontSize:15, color: d.balance==='A$0'?'var(--ink-faint)':'var(--terra-deep)' }}>
            {d.balance}
          </div>
          <window.Pill tone={d.status}>{d.label}</window.Pill>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            {d.status==='warn'
              ? <window.Button size="sm" variant="teal">Settle</window.Button>
              : <window.Button size="sm" variant="ghost">Receipt</window.Button>}
            <window.IconButton size={32} variant="quiet"><window.Icons.More size={15}/></window.IconButton>
          </div>
        </div>
      ))}
    </window.Card>
  );
}

// ─────────── Occupancy chart ───────────
function OccupancyCard(){
  const days = ['M','T','W','T','F','S','S','M','T','W','T','F','S','S'];
  const data = [4,5,7,6,8,9,9,7,7,8,9,9,9,8];
  const max = 9;
  return (
    <window.Card pad={22}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>Occupancy · next 14 nights</div>
          <div style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:28, marginTop:6 }}>83% <em style={{ fontStyle:'italic', fontSize:18, color:'var(--ink-soft)' }}>avg</em></div>
        </div>
        <window.Pill tone="ok"><window.Icons.TrendUp size={11}/> ↑ 6 vs last fortnight</window.Pill>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${days.length}, 1fr)`, gap:6, marginTop:24, height:120, alignItems:'end' }}>
        {data.map((d, i) => {
          const h = (d/max) * 100;
          const tone = d>=8 ? 'var(--teal)' : d>=6 ? 'var(--sand)' : 'var(--shell-deep)';
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ flex:1, width:'100%', display:'flex', alignItems:'end' }}>
                <div style={{ width:'100%', background:tone, borderRadius:'4px 4px 2px 2px', height:`${h}%` }}/>
              </div>
              <div className="mono" style={{ fontSize:9, color:'var(--ink-faint)' }}>{days[i]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:14, marginTop:14, fontSize:11.5, color:'var(--ink-soft)' }}>
        <Legend swatch="var(--teal)" label="Full (8–9)"/>
        <Legend swatch="var(--sand)" label="High (6–7)"/>
        <Legend swatch="var(--shell-deep)" label="Open (≤5)"/>
      </div>
    </window.Card>
  );
}

function Legend({ swatch, label }){
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
      <span style={{ width:10, height:10, background:swatch, borderRadius:3 }}/>
      <span>{label}</span>
    </span>
  );
}

// ─────────── Feed ───────────
function FeedCard(){
  return (
    <window.Card pad={0}>
      <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line-soft)' }}>
        <div className="caps" style={{ color:'var(--ink-faint)' }}>Activity</div>
        <div style={{ fontFamily:'var(--display)', fontWeight:400, fontSize:20, marginTop:4 }}>Today, so far.</div>
      </div>
      <div style={{ padding:'14px 22px 20px' }}>
        {FEED.map((f, i) => (
          <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'8px 0' }}>
            <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)', width:74, flex:'0 0 74px', paddingTop:3 }}>{f.t}</span>
            <span style={{ width:8, height:8, borderRadius:'50%', flex:'0 0 8px', marginTop:7,
              background: f.tone==='ok' ? 'var(--teal)' : 'var(--ink-mute)' }}/>
            <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{f.label}</span>
          </div>
        ))}
      </div>
    </window.Card>
  );
}

window.Screens.dashboard = Dashboard;
