// Desktop · Guest History — sub-page of Contacts.
// Pick a guest from the left rail; see their full booking history,
// total spend, last stay, preferences, and identity on the right.
// Surfaces a quick way to answer "have we hosted them before?"

const GUEST_HISTORY_GUESTS = [
  { id:'G-1187', first:'Liliana', last:'Djokic',    tint:'teal',
    stays:[
      { ref:'R-5453', when:'22–25 Nov 2026', prop:'away',    room:'Away 03',    nts:3, rate:'A$840',   src:'Booking.com', status:'pending' },
      { ref:'R-5311', when:'10–14 Jun 2025', prop:'sunrise', room:'Sunrise 03', nts:4, rate:'A$720',   src:'Direct',      status:'departed' },
      { ref:'R-5102', when:'02–05 Apr 2024', prop:'bgh',     room:'BGH 02',     nts:3, rate:'A$610',   src:'Direct',      status:'departed' },
    ],
    total:'A$2,170', visits:3, since:'Apr 2024', notes:'Vegetarian breakfast. Repeat guest — last stay June 2025. Always books well in advance.',
  },
  { id:'G-1042', first:'James',   last:'Acres',     tint:'shell',
    stays:[
      { ref:'R-5446', when:'20–24 Nov 2026', prop:'away',    room:'Away 02',    nts:4, rate:'A$1,148', src:'Direct',      status:'inhouse' },
      { ref:'R-5301', when:'15–18 Sep 2025', prop:'away',    room:'Away 02',    nts:3, rate:'A$860',   src:'Direct',      status:'departed' },
      { ref:'R-5210', when:'04–10 Mar 2025', prop:'aireys',  room:'Aireys 03',  nts:6, rate:'A$1,920', src:'Direct',      status:'departed' },
      { ref:'R-5100', when:'29 Dec 2024 – 02 Jan 2025', prop:'sunrise', room:'Sunrise 04', nts:5, rate:'A$1,540', src:'Direct', status:'departed' },
      { ref:'R-5022', when:'14–17 Aug 2024', prop:'away',    room:'Away 02',    nts:3, rate:'A$820',   src:'Direct',      status:'departed' },
    ],
    total:'A$6,288', visits:5, since:'Aug 2024', notes:'Family of 4 (2 kids). Prefers Away 02 — sea-facing. Bookings cluster around school holidays.',
  },
  { id:'G-1234', first:'Priya',   last:'Mehta',     tint:'apri',
    stays:[
      { ref:'R-5448', when:'24–26 Nov 2026', prop:'aireys', room:'Aireys 02', nts:2, rate:'A$520', src:'Airbnb', status:'confirmed' },
      { ref:'R-5188', when:'12–15 Mar 2026', prop:'aireys', room:'Aireys 02', nts:3, rate:'A$700', src:'Airbnb', status:'departed' },
    ],
    total:'A$1,220', visits:2, since:'Mar 2026', notes:'Solo traveller. Airport pickup requested both stays.',
  },
  { id:'G-1156', first:'Sara',    last:'Ng',        tint:'sand',
    stays:[
      { ref:'R-5421', when:'17–20 Nov 2026', prop:'away',    room:'Away 01', nts:3, rate:'A$840',   src:'Direct', status:'departed' },
      { ref:'R-5310', when:'05–08 Jun 2025', prop:'away',    room:'Away 01', nts:3, rate:'A$780',   src:'Direct', status:'departed' },
      { ref:'R-5212', when:'12–18 Mar 2025', prop:'sunrise', room:'Sunrise 02', nts:6, rate:'A$1,540', src:'Direct', status:'departed' },
      { ref:'R-5050', when:'22–25 Sep 2024', prop:'away',    room:'Away 01', nts:3, rate:'A$760',   src:'Direct', status:'departed' },
    ],
    total:'A$3,920', visits:4, since:'Sep 2024', notes:'Always Away 01 when available. Quiet mornings, late checkouts.',
  },
  { id:'G-1444', first:'A.',      last:'Whitman',   tint:'teal',
    stays:[
      { ref:'R-5466', when:'22–27 Nov 2026', prop:'sunrise', room:'Sunrise 02', nts:5, rate:'A$1,400', src:'Direct',      status:'confirmed' },
      { ref:'R-5240', when:'18–22 Aug 2026', prop:'sunrise', room:'Sunrise 02', nts:4, rate:'A$1,120', src:'Direct',      status:'departed' },
      { ref:'R-5180', when:'02–05 May 2026', prop:'bgh',     room:'BGH 03',     nts:3, rate:'A$960',   src:'Direct',      status:'departed' },
      { ref:'R-5100', when:'14–18 Jan 2026', prop:'sunrise', room:'Sunrise 02', nts:4, rate:'A$1,080', src:'Direct',      status:'departed' },
      { ref:'R-5044', when:'08–12 Oct 2025', prop:'sunrise', room:'Sunrise 02', nts:4, rate:'A$1,040', src:'Direct',      status:'departed' },
      { ref:'R-4988', when:'21–25 Aug 2025', prop:'sunrise', room:'Sunrise 02', nts:4, rate:'A$1,040', src:'Direct',      status:'departed' },
    ],
    total:'A$6,640', visits:6, since:'Aug 2025', notes:'VIP — six stays in 18 months. Comp upgrade on next visit.',
  },
  { id:'G-1108', first:'Rosa',    last:'Ibarra',    tint:'shell',
    stays:[
      { ref:'R-5478', when:'27–30 Nov 2026', prop:'sunrise', room:'Sunrise 04', nts:3, rate:'A$780',   src:'Booking.com', status:'confirmed' },
      { ref:'R-5230', when:'15–18 Jun 2025', prop:'sunrise', room:'Sunrise 03', nts:3, rate:'A$720',   src:'Booking.com', status:'departed' },
    ],
    total:'A$1,500', visits:2, since:'Jun 2025', notes:'Travelling with infant. Quiet floor preferred.',
  },
];

const GH_STATUS = {
  inhouse:   { tone:'teal', label:'In house' },
  confirmed: { tone:'ok',   label:'Confirmed' },
  pending:   { tone:'warn', label:'Pending' },
  departed:  { tone:'neutral', label:'Departed' },
};

function GuestHistory(){
  const [selectedId, setSelectedId] = React.useState(GUEST_HISTORY_GUESTS[0].id);
  const [search, setSearch] = React.useState('');
  const guest = GUEST_HISTORY_GUESTS.find(g => g.id === selectedId) || GUEST_HISTORY_GUESTS[0];

  const filtered = GUEST_HISTORY_GUESTS.filter(g =>
    !search ||
    (g.first + ' ' + g.last).toLowerCase().includes(search.toLowerCase()) ||
    g.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <window.AdminPage
      kicker="Contacts / Guest history"
      title={<>Guest <em style={{ fontStyle:'italic' }}>history</em></>}
      subtitle="Every past booking, current stay, and upcoming reservation tied to each guest. Use the rail to switch between guests."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Doc size={14}/>}>Export PDF</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}
          onClick={() => window.location.hash = 'reservation'}>New booking</window.Button>
      </>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:14, alignItems:'start' }}>
        <window.AdminFormCard title="Guests" action={
          <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{filtered.length}</span>
        }>
          <div style={{ padding:'10px 14px 8px', borderTop:'1px solid var(--line-soft)' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'var(--linen)', border:'1px solid var(--line)',
              borderRadius:'var(--r-pill)', padding:'7px 12px',
            }}>
              <window.Icons.Search size={13} stroke="var(--ink-faint)"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guests…"
                style={{ flex:1, border:'none', outline:'none', background:'transparent', font:'inherit', fontSize:12 }}/>
            </div>
          </div>
          <div style={{ maxHeight:560, overflow:'auto' }} className="no-scrollbar">
            {filtered.map(g => (
              <button key={g.id} onClick={() => setSelectedId(g.id)} style={{
                width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:11,
                padding:'12px 16px', cursor:'pointer', font:'inherit', color:'var(--ink)',
                background: g.id === selectedId ? 'var(--linen)' : 'transparent',
                border:'none',
                borderTop: '1px solid var(--line-soft)',
                borderLeft: g.id === selectedId ? '3px solid var(--ink)' : '3px solid transparent',
              }}>
                <window.Avatar name={`${g.first} ${g.last}`} size={36} tint={g.tint}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8 }}>
                    <span style={{ fontFamily:'var(--display)', fontSize:14, fontWeight: g.id===selectedId?500:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.first} {g.last}</span>
                    <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{g.visits}×</span>
                  </div>
                  <div className="mono" style={{ fontSize:9.5, color:'var(--ink-faint)', marginTop:2 }}>
                    {g.id} · since {g.since}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </window.AdminFormCard>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Guest header card */}
          <window.AdminFormCard>
            <div style={{ padding:'22px 24px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center' }}>
              <window.Avatar name={`${guest.first} ${guest.last}`} size={72} tint={guest.tint}/>
              <div>
                <div className="mono" style={{ fontSize:10, color:'var(--ink-faint)', letterSpacing:'var(--tracked)' }}>{guest.id} · since {guest.since}</div>
                <div style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:30, lineHeight:1.05, letterSpacing:'var(--tight)', marginTop:5 }}>
                  {guest.first} <em style={{ fontStyle:'italic' }}>{guest.last}</em>
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                  <window.Pill tone="ok" size="sm">{guest.visits} stays</window.Pill>
                  <window.Pill tone="info" size="sm">{guest.total} lifetime</window.Pill>
                  <window.Pill tone="warn" size="sm">Returning guest</window.Pill>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <window.Button variant="ghost" size="md" icon={<window.Icons.Message size={14}/>}>Message</window.Button>
                <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}
                  onClick={() => window.location.hash = 'reservation'}>New booking</window.Button>
              </div>
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--line-soft)', background:'var(--linen)' }}>
              <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:6 }}>Stay preferences & notes</div>
              <div style={{ fontSize:13, lineHeight:1.55, color:'var(--ink-soft)' }}>{guest.notes}</div>
            </div>
          </window.AdminFormCard>

          {/* Stats row */}
          <window.AdminStatsRow items={[
            { icon:'Bed',        label:'Total stays',     value: String(guest.visits) },
            { icon:'Calendar',   label:'Total nights',    value: String(guest.stays.reduce((s, x) => s + x.nts, 0)) },
            { icon:'Dollar',     label:'Lifetime spend',  value: guest.total, tone:'ok' },
            { icon:'TrendUp',    label:'Avg per stay',    value: 'A$' + Math.round(parseInt(guest.total.replace(/[^0-9]/g,'')) / guest.visits).toLocaleString() },
          ]}/>

          {/* Bookings table */}
          <window.AdminFormCard title="Bookings" action={
            <div style={{ display:'flex', gap:6 }}>
              <window.FilterPill on count={guest.stays.length}>All</window.FilterPill>
              <window.FilterPill count={guest.stays.filter(s => s.status==='departed').length}>Past</window.FilterPill>
              <window.FilterPill count={guest.stays.filter(s => s.status!=='departed').length}>Active & upcoming</window.FilterPill>
            </div>
          }>
            <div>
              <div style={{
                display:'grid', gridTemplateColumns:'110px 1.8fr 1.3fr 70px 110px 130px 110px 40px',
                gap:10, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
                fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
                letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
              }}>
                <span>Ref</span><span>Dates</span><span>Property · Room</span>
                <span style={{ textAlign:'right' }}>Nts</span>
                <span style={{ textAlign:'right' }}>Total</span>
                <span>Source</span><span>Status</span><span/>
              </div>
              {guest.stays.map((s, i) => (
                <div key={s.ref} onClick={() => window.location.hash = `booking/${s.ref}`} style={{
                  display:'grid', gridTemplateColumns:'110px 1.8fr 1.3fr 70px 110px 130px 110px 40px',
                  gap:10, padding:'14px 22px', alignItems:'center', cursor:'pointer',
                  borderTop:'1px solid var(--line-soft)',
                  borderLeft: '3px solid ' + window.propColor(s.prop),
                }}>
                  <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{s.ref}</span>
                  <span style={{ fontSize:13 }}>{s.when}</span>
                  <span style={{ fontFamily:'var(--display)', fontSize:14 }}>{s.room}</span>
                  <span className="mono" style={{ fontSize:12, textAlign:'right' }}>{s.nts}</span>
                  <span style={{ fontFamily:'var(--display)', fontSize:14, textAlign:'right' }}>{s.rate}</span>
                  <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{s.src}</span>
                  <window.Pill tone={GH_STATUS[s.status].tone} size="sm">{GH_STATUS[s.status].label}</window.Pill>
                  <window.Icons.ChevronRight size={14} stroke="var(--ink-faint)"/>
                </div>
              ))}
              {guest.stays.length === 0 && (
                <div style={{ padding:'40px 22px', textAlign:'center', color:'var(--ink-faint)' }}>
                  <div style={{ fontFamily:'var(--display)', fontStyle:'italic', fontSize:18 }}>No bookings yet.</div>
                </div>
              )}
            </div>
          </window.AdminFormCard>

          {/* Timeline visualization */}
          <window.AdminFormCard title="Stay timeline" action={
            <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>Since {guest.since}</span>
          }>
            <div style={{ padding:'24px 24px 28px' }}>
              <GuestTimeline stays={guest.stays}/>
            </div>
          </window.AdminFormCard>
        </div>
      </div>
    </window.AdminPage>
  );
}

function GuestTimeline({ stays }){
  // Sort by year/month, simple horizontal bands per stay
  const items = stays.slice().reverse(); // chronological
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)', width:80 }}>2024</span>
        <span style={{ flex:1, height:1, background:'var(--line)' }}/>
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)', width:80, textAlign:'right' }}>2026</span>
      </div>
      <div style={{ position:'relative', height: Math.max(80, items.length * 18 + 24) }}>
        {items.map((s, i) => {
          // Crude year-mapping for visual purposes
          const yearMatch = s.when.match(/(\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1]) : 2024;
          const monthMatch = s.when.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
          const monthIdx = monthMatch
            ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthMatch[1])
            : 0;
          const totalMonths = 36; // 2024 Jan to 2026 Dec
          const x = ((year - 2024) * 12 + monthIdx) / totalMonths * 100;
          return (
            <div key={s.ref} style={{
              position:'absolute',
              left: `${Math.min(96, x)}%`,
              top: i * 18,
              transform:'translateX(-50%)',
            }}>
              <div style={{
                width:16, height:16, borderRadius:'50%',
                background: window.propColor(s.prop),
                border:'2px solid var(--paper)',
                boxShadow:'0 1px 0 rgba(31,42,42,.08)',
              }} title={`${s.when} · ${s.room}`}/>
              <div style={{
                position:'absolute', left:'120%', top:'50%', transform:'translateY(-50%)',
                fontSize:11, color:'var(--ink-soft)', whiteSpace:'nowrap',
                fontFamily:'var(--display)',
              }}>{s.when} · {s.room}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Screens['guest-history'] = GuestHistory;
