// Property module — Property Register, Add/Edit Property, Images,
// Rooms, Add/Edit Room, Rates, Costs, Inventory.

const PR_PROPERTIES = [
  { id:'P-0001', name:'Away Guesthouse',    short:'Away',    address:'12 Sunrise Ln, Byron Bay NSW 2481',  rooms:4, status:'active',  color:'var(--p-away)',    image:'pr-away' },
  { id:'P-0002', name:'Sunrise Guesthouse', short:'Sunrise', address:'8 Tallowood St, Byron Bay NSW 2481', rooms:4, status:'active',  color:'var(--p-sunrise)', image:'pr-sunrise' },
  { id:'P-0003', name:'BGH',                short:'BGH',     address:'47 Marine Pde, Byron Bay NSW 2481',  rooms:3, status:'active',  color:'var(--p-bgh)',     image:'pr-bgh' },
  { id:'P-0004', name:'Aireys',             short:'Aireys',  address:'2 Headland Rd, Lennox Head NSW 2478',rooms:3, status:'draft',   color:'var(--p-aireys)',  image:'pr-aireys' },
];

// ═══════════════ PROPERTY REGISTER ═══════════════
function PropertyRegister(){
  return (
    <window.AdminPage
      kicker="Property"
      title="Property register"
      subtitle="Every property managed under Away At Byron Bay. Click any property to edit details, manage rooms, rates and contracts."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Doc size={14}/>}>Export</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}
          onClick={() => window.location.hash = 'property-edit'}>Add property</window.Button>
      </>}>
      <window.AdminToolbar
        placeholder="Search properties, suburbs…"
        filters={[
          <window.FilterPill key="a" on count={4}>All</window.FilterPill>,
          <window.FilterPill key="b" count={3}>Active</window.FilterPill>,
          <window.FilterPill key="c" count={1}>Draft</window.FilterPill>,
        ]}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
        {PR_PROPERTIES.map(p => <PropertyCard key={p.id} p={p}/>)}
      </div>
    </window.AdminPage>
  );
}

function PropertyCard({ p }){
  return (
    <div onClick={() => window.location.hash = 'property-edit'} style={{
      background:'var(--paper)', border:'1px solid var(--line)', borderRadius:'var(--r-3)', overflow:'hidden', cursor:'pointer',
      display:'flex', flexDirection:'column',
    }}>
      <div style={{ height:6, background: p.color }}/>
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:0 }}>
        <div style={{ height:200 }}>
          <window.ImgSlot id={`pr-card-${p.id}`} shape="rect" placeholder=""/>
        </div>
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10 }}>
            <div>
              <span className="mono" style={{ fontSize:10.5, color:'var(--ink-faint)' }}>{p.id}</span>
              <div style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:300, letterSpacing:'var(--tight)', marginTop:3, lineHeight:1.1 }}>{p.name}</div>
            </div>
            <window.Pill tone={p.status==='active'?'ok':'warn'} size="sm">{p.status}</window.Pill>
          </div>
          <div style={{ marginTop:10, fontSize:12.5, color:'var(--ink-soft)' }}>{p.address}</div>
          <div style={{ marginTop:'auto', paddingTop:14, display:'flex', gap:10, alignItems:'center' }}>
            <window.Pill tone="paper" size="sm"><window.Icons.Bed size={11}/> {p.rooms} rooms</window.Pill>
            <window.Pill tone="paper" size="sm"><window.Icons.Sparkles size={11}/> 3 staff</window.Pill>
            <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--ink-soft)' }}>
              Edit <window.Icons.ChevronRight size={12}/>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ ADD / EDIT PROPERTY ═══════════════
function PropertyEdit(){
  const [tab, setTab] = React.useState('details');
  const tabs = [
    { id:'details',  label:'Property details' },
    { id:'images',   label:'Images & attachments' },
  ];
  return (
    <window.AdminPage
      kicker="Property"
      title={<>Add / Edit <em style={{ fontStyle:'italic' }}>Property</em></>}
      subtitle={null}
      actions={<>
        <window.Button variant="ghost" size="md"
          onClick={() => window.location.hash = 'property-register'}>Cancel</window.Button>
        <window.Button variant="primary" size="md" iconRight={<window.Icons.Check size={14}/>}>Save</window.Button>
      </>}
      tabs={tabs.map(t => <window.AdminPageTab key={t.id} active={tab===t.id} onClick={() => setTab(t.id)}>{t.label}</window.AdminPageTab>)}
    >
      <PropertyHeaderCard/>
      {tab === 'details' && <PropertyDetails/>}
      {tab === 'images'  && <PropertyImagesTab/>}
    </window.AdminPage>
  );
}

// Header card showing the actual property being edited (Away Guesthouse).
function PropertyHeaderCard(){
  return (
    <window.AdminFormCard>
      <div style={{ padding:'22px 26px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'var(--r-3)', overflow:'hidden', background:'var(--linen)', border:'1px solid var(--line)' }}>
          <window.ImgSlot id="pe-logo-P-0001" shape="rounded" radius={14} placeholder="Logo"/>
        </div>
        <div>
          <div style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:34, lineHeight:1.02, letterSpacing:'var(--tight)' }}>
            Away <em style={{ fontStyle:'italic' }}>Guesthouse</em>
          </div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-faint)', letterSpacing:'var(--tracked)', marginTop:8 }}>
            P-0001 · 12 Sunrise Lane, Byron Bay NSW 2481
          </div>
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <window.Pill tone="ok" size="sm">Active</window.Pill>
            <window.Pill tone="paper" size="sm"><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--p-away)', display:'inline-block', marginRight:4 }}/>Aqua</window.Pill>
            <window.Pill tone="paper" size="sm"><window.Icons.Bed size={11}/> 4 rooms</window.Pill>
          </div>
        </div>
      </div>
    </window.AdminFormCard>
  );
}

function PropertyDetails(){
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <window.AdminFormCard title="Address">
        <window.AdminFormRow label="Property name"><window.AdminTextInput value="Away Guesthouse"/></window.AdminFormRow>
        <window.AdminFormRow label="Street"><window.AdminTextInput value="12 Sunrise Lane"/></window.AdminFormRow>
        <window.AdminFormRow label="Suburb"><window.AdminTextInput value="Byron Bay"/></window.AdminFormRow>
        <window.AdminFormRow label="City"><window.AdminTextInput value="Byron Shire"/></window.AdminFormRow>
        <window.AdminFormRow label="State"><window.AdminSelect value="NSW"/></window.AdminFormRow>
        <window.AdminFormRow label="Post code"><window.AdminTextInput value="2481" w={140}/></window.AdminFormRow>
        <window.AdminFormRow label="Country"><window.AdminSelect value="Australia"/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Configuration">
        <window.AdminFormRow label="Brand color">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {['var(--p-away)','var(--p-sunrise)','var(--p-bgh)','var(--p-aireys)'].map((c, i) => (
              <button key={i} style={{
                width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer',
                border: i===0 ? '2px solid var(--ink)' : '2px solid transparent',
              }}/>
            ))}
            <window.AdminTextInput value="Aqua · #4FB3AA" w={200} mono/>
          </div>
        </window.AdminFormRow>
        <window.AdminFormRow label="Number of rooms">
          <div style={{
            background:'var(--linen-soft)', border:'1px solid var(--line-soft)', borderRadius:'var(--r-2)',
            padding:'8px 12px', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ flex:1, fontFamily:'var(--display)', fontSize:15, fontWeight:400, color:'var(--ink-soft)' }}>4</span>
            <span className="mono" style={{ fontSize:9.5, color:'var(--ink-faint)', letterSpacing:'.06em', textTransform:'uppercase' }}>Auto · from Rooms</span>
          </div>
        </window.AdminFormRow>
        <window.AdminFormRow label="Status"><window.AdminSelect value="Active"/></window.AdminFormRow>
        <window.AdminFormRow label="Property ABN"><window.AdminTextInput value="44 821 117 442" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Website"><window.AdminTextInput value="awaybyronbay.com" mono/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Operations">
        <window.AdminFormRow label="Property manager"><window.AdminSelect value="Mia Hartwell"/></window.AdminFormRow>
        <window.AdminFormRow label="On-call number"><window.AdminTextInput value="+61 421 117 882" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Property email"><window.AdminTextInput value="away@awaybyronbay.com" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Lockbox / access"><window.AdminTextInput value="Side gate · code 4421" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Wi-fi network"><window.AdminTextInput value="Away_Guests · code byron2026" mono/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Property owners">
        <div style={{ padding:'10px 18px 4px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>Owner · 1</div>
        </div>
        <window.AdminFormRow label="Name"><window.AdminTextInput value="Jenny Junkeer"/></window.AdminFormRow>
        <window.AdminFormRow label="Email"><window.AdminTextInput value="j.junkeer@inbox.au" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Phone"><window.AdminTextInput value="+61 401 998 220" mono/></window.AdminFormRow>

        <div style={{ padding:'14px 18px 4px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)' }}>Owner · 2</div>
        </div>
        <window.AdminFormRow label="Name"><window.AdminTextInput value="Tom Junkeer"/></window.AdminFormRow>
        <window.AdminFormRow label="Email"><window.AdminTextInput value="t.junkeer@inbox.au" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Phone"><window.AdminTextInput value="+61 401 887 220" mono/></window.AdminFormRow>
      </window.AdminFormCard>
      </div>

      {/* Amenities — full-width section spanning below the 2-col grid */}
      <PropertyAmenities/>
    </>
  );
}

// ─── Amenities · grouped chip selector ─────────────────────────
const AMENITY_GROUPS = [
  { id:'wifi',   label:'Connectivity', items:['WiFi','Free WiFi'] },
  { id:'climate',label:'Climate',      items:['Air Conditioning','Heating','Ceiling Fan'] },
  { id:'enter',  label:'Entertainment',items:['Television','Smart TV','Streaming Services (Netflix etc.)'] },
  { id:'kitchen',label:'Kitchen',      items:['Kitchen','Kitchenette','Microwave','Refrigerator','Coffee Machine','Tea / Coffee Making Facilities','Toaster','Oven','Dishwasher'] },
  { id:'laundry',label:'Laundry & ironing', items:['Washing Machine','Dryer','Iron','Ironing Board','Hair Dryer'] },
  { id:'bath',   label:'Bathroom',     items:['Private Bathroom','Shared Bathroom','Bathtub','Spa Bath / Jacuzzi','Shower','Complimentary Toiletries'] },
  { id:'service',label:'Service & linen',  items:['Linen Provided','Towels Provided','Daily Housekeeping','Weekly Housekeeping','Room Service'] },
  { id:'food',   label:'Food & drink',     items:['Breakfast Included','Continental Breakfast','Cooked Breakfast','Mini Bar','Welcome Pack'] },
  { id:'view',   label:'Outdoor & views',  items:['Balcony','Courtyard','Garden Access','Ocean View','Mountain View','Pool View','City View'] },
  { id:'park',   label:'Parking & transport', items:['Parking','Free Parking','Street Parking','EV Charging','Airport Transfer','Shuttle Service','Bicycle Hire','Tour Booking Assistance'] },
  { id:'well',   label:'Wellness',     items:['Swimming Pool','Heated Pool','Spa','Sauna','Gym'] },
  { id:'common', label:'Common areas', items:['BBQ Facilities','Outdoor Dining Area','Fireplace','Communal Lounge','Games Room','Library','Workspace / Desk','Conference Room'] },
  { id:'policy', label:'Policies',     items:['Pet Friendly','Adults Only','Family Friendly','Child Friendly','Cot / Crib Available','Extra Bed Available','Non-Smoking Rooms','Smoking Area'] },
  { id:'access', label:'Accessibility',items:['Wheelchair Accessible','Accessible Bathroom','Ground Floor Access'] },
  { id:'check',  label:'Check-in & security', items:['Self Check-In','Late Check-In','Contactless Check-In','Luggage Storage','Security Cameras','Gated Property'] },
];

// Default selection — a realistic slice for Away Guesthouse
const DEFAULT_AMENITIES = new Set([
  'Free WiFi','Air Conditioning','Ceiling Fan','Smart TV','Streaming Services (Netflix etc.)',
  'Kitchenette','Microwave','Refrigerator','Coffee Machine','Tea / Coffee Making Facilities','Toaster',
  'Hair Dryer','Private Bathroom','Shower','Complimentary Toiletries',
  'Linen Provided','Towels Provided','Daily Housekeeping','Welcome Pack',
  'Balcony','Garden Access','Ocean View',
  'Free Parking','BBQ Facilities','Outdoor Dining Area',
  'Family Friendly','Cot / Crib Available',
  'Self Check-In','Late Check-In','Luggage Storage',
]);

function PropertyAmenities(){
  const [selected, setSelected] = React.useState(DEFAULT_AMENITIES);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');   // all | selected | available

  const toggle = (a) => setSelected(s => {
    const next = new Set(s);
    next.has(a) ? next.delete(a) : next.add(a);
    return next;
  });

  const allItems = AMENITY_GROUPS.flatMap(g => g.items);
  const totalCount = allItems.length;
  const selCount = selected.size;

  // Filter logic for the grouped grid
  const visible = (item) => {
    if (query && !item.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === 'selected' && !selected.has(item)) return false;
    if (filter === 'available' && selected.has(item)) return false;
    return true;
  };

  return (
    <window.AdminFormCard title={
      <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
        Amenities
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>
          · {selCount} of {totalCount} selected
        </span>
      </span>
    } action={
      <div style={{ display:'flex', gap:6 }}>
        <window.FilterPill on={filter==='all'}        onClick={() => setFilter('all')}        count={totalCount}>All</window.FilterPill>
        <window.FilterPill on={filter==='selected'}   onClick={() => setFilter('selected')}   count={selCount}>Selected</window.FilterPill>
        <window.FilterPill on={filter==='available'}  onClick={() => setFilter('available')}  count={totalCount - selCount}>Available</window.FilterPill>
      </div>
    }>
      {/* Selected chips strip — always visible, scrolls horizontally if long */}
      {selCount > 0 && (
        <div style={{
          padding:'14px 20px', borderTop:'1px solid var(--line-soft)',
          background:'var(--linen-soft)',
        }}>
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Currently selected · {selCount}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {[...selected].map(a => (
              <button key={a} onClick={() => toggle(a)} style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 10px 6px 12px', borderRadius:'var(--r-pill)',
                background:'var(--ink)', color:'var(--linen)',
                border:'none', cursor:'pointer', font:'inherit',
                fontSize:11.5, fontWeight:500,
              }}>
                <window.Icons.Check size={11} strokeWidth={2.4}/>
                {a}
                <span style={{
                  width:14, height:14, borderRadius:'50%',
                  background:'rgba(251,248,243,.16)', color:'var(--linen)',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  marginLeft:2,
                }}><window.Icons.X size={9} strokeWidth={2.5}/></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{
        padding:'14px 20px', borderTop:'1px solid var(--line-soft)',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{
          flex:1, display:'flex', alignItems:'center', gap:10,
          background:'var(--paper)', border:'1px solid var(--line-strong)',
          borderRadius:'var(--r-pill)', padding:'8px 14px',
        }}>
          <window.Icons.Search size={13} stroke="var(--ink-faint)"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search amenities — wifi, pool, breakfast…"
            style={{ flex:1, border:'none', outline:'none', background:'transparent',
              font:'inherit', fontSize:13, color:'var(--ink)' }}/>
          {query && <button onClick={() => setQuery('')} style={{
            background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-faint)',
            padding:'2px 4px',
          }}><window.Icons.X size={13}/></button>}
        </div>
        <window.Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear all</window.Button>
      </div>

      {/* Grouped chip grid */}
      <div style={{ padding:'8px 20px 20px' }}>
        {AMENITY_GROUPS.map((g, gi) => {
          const items = g.items.filter(visible);
          if (items.length === 0) return null;
          const gSel = g.items.filter(i => selected.has(i)).length;
          return (
            <div key={g.id} style={{
              padding:'18px 0',
              borderTop: gi > 0 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:12 }}>
                <div className="caps" style={{ color:'var(--ink-faint)' }}>{g.label}</div>
                <span className="mono" style={{ fontSize:9.5, color:'var(--ink-faint)' }}>
                  · {gSel} of {g.items.length}
                </span>
                <span style={{ flex:1 }}/>
                {gSel > 0 && (
                  <span style={{
                    width:18, height:6, borderRadius:3, overflow:'hidden',
                    background:'var(--line-soft)',
                  }}>
                    <span style={{
                      display:'block', height:'100%', width:`${(gSel/g.items.length)*100}%`,
                      background:'var(--teal)',
                    }}/>
                  </span>
                )}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {items.map(a => {
                  const on = selected.has(a);
                  return (
                    <button key={a} onClick={() => toggle(a)} style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      padding:'7px 12px', borderRadius:'var(--r-pill)',
                      background: on ? 'var(--linen-soft)' : 'var(--paper)',
                      color: on ? 'var(--ink)' : 'var(--ink-soft)',
                      border: on ? '1px solid var(--ink)' : '1px solid var(--line)',
                      cursor:'pointer', font:'inherit',
                      fontSize:12, fontWeight: on ? 600 : 400,
                      transition:'background .12s, border-color .12s',
                    }}>
                      <span style={{
                        width:14, height:14, borderRadius:4,
                        background: on ? 'var(--ink)' : 'transparent',
                        border: on ? 'none' : '1.5px solid var(--line-strong)',
                        color:'var(--linen)',
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {on && <window.Icons.Check size={9} strokeWidth={2.8}/>}
                      </span>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </window.AdminFormCard>
  );
}

// Images & attachments tab — per-property (no property switcher)
function PropertyImagesTab(){
  const propId = 'P-0001';
  const attachments = [
    { name:'Property survey 2024.pdf',     size:'2.4 MB', type:'PDF', when:'15 Aug 2024' },
    { name:'Owner contract — signed.pdf',  size:'1.1 MB', type:'PDF', when:'01 Jul 2024' },
    { name:'Insurance certificate.pdf',    size:'880 KB', type:'PDF', when:'05 Jul 2024' },
    { name:'Floor plan — Away.pdf',        size:'3.2 MB', type:'PDF', when:'12 Jul 2024' },
  ];
  return (
    <>
      {/* Brand logo */}
      <window.AdminFormCard title="Property brand logo"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Replace</window.Button>}>
        <div style={{ padding:'20px 22px', display:'grid', gridTemplateColumns:'220px 1fr', gap:24, alignItems:'center' }}>
          <div style={{ aspectRatio:'1/1', borderRadius:'var(--r-3)', overflow:'hidden', background:'var(--linen)', border:'1px solid var(--line)' }}>
            <window.ImgSlot id={`pe-logo-${propId}`} shape="rounded" radius={14} placeholder="Drop logo"/>
          </div>
          <div>
            <div className="caps" style={{ color:'var(--ink-faint)' }}>Property logo file</div>
            <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:8, lineHeight:1.55, maxWidth:480 }}>
              The brand logo appears in topbar overlays, invoices, guest emails, and external channel listings. PNG or SVG with transparent background, minimum 512×512.
            </div>
          </div>
        </div>
      </window.AdminFormCard>

      {/* Image gallery */}
      <window.AdminFormCard title="Property image gallery"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Add image</window.Button>}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ marginBottom:14 }}>
            <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Hero · header image</div>
            <div style={{ aspectRatio:'16/7', borderRadius:'var(--r-2)', overflow:'hidden', position:'relative', maxWidth:840 }}>
              <window.ImgSlot id={`pi-hero-${propId}`} shape="rounded" radius={10} placeholder="Drop the hero image for Away Guesthouse"/>
              <span style={{ position:'absolute', top:10, left:10 }}><window.Pill tone="ink" size="sm">Hero</window.Pill></span>
            </div>
          </div>

          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Gallery · 8 images</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
            {['exterior','lounge','room1','room2','kitchen','bathroom','garden','street'].map((id, i) => (
              <div key={id} style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden', position:'relative' }}>
                <window.ImgSlot id={`pi-${propId}-${id}`} shape="rounded" radius={10} placeholder={`Photo ${i+1}`}/>
                <span style={{ position:'absolute', bottom:8, left:8 }}>
                  <window.Pill tone="paper" size="sm">{id}</window.Pill>
                </span>
              </div>
            ))}
          </div>
        </div>
      </window.AdminFormCard>

      {/* Document attachments */}
      <window.AdminFormCard title="Documents & attachments"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Upload file</window.Button>}>
        <div>
          <div style={{
            display:'grid', gridTemplateColumns:'48px 1.6fr 90px 90px 130px 80px',
            gap:12, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
            fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
            letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
          }}>
            <span/><span>File</span><span>Type</span><span>Size</span><span>Uploaded</span><span/>
          </div>
          {attachments.map((d, i) => (
            <div key={d.name} style={{
              display:'grid', gridTemplateColumns:'48px 1.6fr 90px 90px 130px 80px',
              gap:12, alignItems:'center', padding:'12px 22px',
              borderTop:'1px solid var(--line-soft)',
            }}>
              <div style={{
                width:36, height:36, borderRadius:'var(--r-2)',
                background:'var(--linen)', border:'1px solid var(--line-soft)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <window.Icons.Doc size={15}/>
              </div>
              <span style={{ fontFamily:'var(--display)', fontSize:14 }}>{d.name}</span>
              <window.Pill tone="neutral" size="sm">{d.type}</window.Pill>
              <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{d.size}</span>
              <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{d.when}</span>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:4 }}>
                <window.IconButton size={28} variant="quiet"><window.Icons.Eye size={13}/></window.IconButton>
                <window.IconButton size={28} variant="quiet"><window.Icons.More size={13}/></window.IconButton>
              </div>
            </div>
          ))}
        </div>
      </window.AdminFormCard>
    </>
  );
}

// ═══════════════ IMAGES & ATTACHMENTS ═══════════════
function PropertyImagesPage(){
  const [propId, setPropId] = React.useState('P-0001');
  const property = PR_PROPERTIES.find(p => p.id === propId);

  const attachments = [
    { name:'Property survey 2024.pdf',     size:'2.4 MB', type:'PDF', when:'15 Aug 2024' },
    { name:'Owner contract — signed.pdf',  size:'1.1 MB', type:'PDF', when:'01 Jul 2024' },
    { name:'Insurance certificate.pdf',    size:'880 KB', type:'PDF', when:'05 Jul 2024' },
    { name:'Floor plan — Sunrise.pdf',     size:'3.2 MB', type:'PDF', when:'12 Jul 2024' },
    { name:'Welcome brochure.docx',        size:'420 KB', type:'DOC', when:'22 Aug 2024' },
  ];

  return (
    <window.AdminPage
      kicker="Property"
      title="Images & attachments"
      subtitle="Property photos, brochures, owner documents and any other files attached to each property."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Plus size={14}/>}>Upload file</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}>Add image</window.Button>
      </>}
    >
      {/* Property switcher */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <span className="caps" style={{ color:'var(--ink-faint)' }}>Property</span>
        {PR_PROPERTIES.map(p => (
          <window.FilterPill key={p.id} on={propId===p.id} onClick={() => setPropId(p.id)}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', marginRight:4 }}/>
            {p.short || p.name}
          </window.FilterPill>
        ))}
      </div>

      {/* Image gallery */}
      <window.AdminFormCard title="Gallery"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Add image</window.Button>}>
        <div style={{ padding:'18px 20px' }}>
          {/* Hero image (large) */}
          <div style={{ marginBottom:14 }}>
            <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Hero · header image</div>
            <div style={{ aspectRatio:'16/7', borderRadius:'var(--r-2)', overflow:'hidden', position:'relative', maxWidth:840 }}>
              <window.ImgSlot id={`pi-hero-${propId}`} shape="rounded" radius={10} placeholder={`Drop the hero image for ${property.name}`}/>
              <span style={{ position:'absolute', top:10, left:10 }}><window.Pill tone="ink" size="sm">Hero</window.Pill></span>
            </div>
          </div>

          {/* Image grid */}
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Gallery · 8 images</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
            {['exterior','lounge','room1','room2','kitchen','bathroom','garden','street'].map((id, i) => (
              <div key={id} style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden', position:'relative' }}>
                <window.ImgSlot id={`pi-${propId}-${id}`} shape="rounded" radius={10} placeholder={`Photo ${i+1}`}/>
                <span style={{ position:'absolute', bottom:8, left:8 }}>
                  <window.Pill tone="paper" size="sm">{id}</window.Pill>
                </span>
              </div>
            ))}
          </div>
        </div>
      </window.AdminFormCard>

      {/* Floor plans */}
      <window.AdminFormCard title="Floor plans · room layouts"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Add plan</window.Button>}>
        <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {['ground','first','site'].map((id, i) => (
            <div key={id} style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden', border:'1px solid var(--line-soft)', background:'var(--linen)', position:'relative' }}>
              <window.ImgSlot id={`pi-plan-${propId}-${id}`} shape="rounded" radius={10} placeholder={`Floor plan · ${id}`}/>
            </div>
          ))}
        </div>
      </window.AdminFormCard>

      {/* Document attachments */}
      <window.AdminFormCard title="Documents & attachments"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Upload file</window.Button>}>
        <div>
          <div style={{
            display:'grid', gridTemplateColumns:'48px 1.6fr 90px 90px 130px 80px',
            gap:12, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
            fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
            letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
          }}>
            <span/><span>File</span><span>Type</span><span>Size</span><span>Uploaded</span><span/>
          </div>
          {attachments.map((d, i) => (
            <div key={d.name} style={{
              display:'grid', gridTemplateColumns:'48px 1.6fr 90px 90px 130px 80px',
              gap:12, alignItems:'center', padding:'12px 22px',
              borderTop:'1px solid var(--line-soft)',
            }}>
              <div style={{
                width:36, height:36, borderRadius:'var(--r-2)',
                background:'var(--linen)', border:'1px solid var(--line-soft)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <window.Icons.Doc size={15}/>
              </div>
              <span style={{ fontFamily:'var(--display)', fontSize:14 }}>{d.name}</span>
              <window.Pill tone="neutral" size="sm">{d.type}</window.Pill>
              <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{d.size}</span>
              <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{d.when}</span>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:4 }}>
                <window.IconButton size={28} variant="quiet"><window.Icons.Eye size={13}/></window.IconButton>
                <window.IconButton size={28} variant="quiet"><window.Icons.More size={13}/></window.IconButton>
              </div>
            </div>
          ))}
        </div>
      </window.AdminFormCard>
    </window.AdminPage>
  );
}

// ═══════════════ ROOMS ═══════════════
// Room types live in Settings now. Just read them off the global lookup.
const ROOM_LIST = (window.ROOMS || []).map(r => ({
  ...r,
  status: 'active', floor: '1F', sort: 1,
}));

function Rooms(){
  return (
    <window.AdminPage
      kicker="Property"
      title="Rooms"
      subtitle="All 14 rooms across the four properties. Bed configuration and room types are managed in Settings."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Doc size={14}/>}>Export</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}
          onClick={() => window.location.hash = 'room-edit'}>Add room</window.Button>
      </>}
    >
      <window.AdminToolbar placeholder="Search room or property…" filters={[
        <window.FilterPill key="a" on count={14}>All</window.FilterPill>,
        <window.FilterPill key="b" count={4}>Away</window.FilterPill>,
        <window.FilterPill key="c" count={4}>Sunrise</window.FilterPill>,
        <window.FilterPill key="d" count={3}>BGH</window.FilterPill>,
        <window.FilterPill key="e" count={3}>Aireys</window.FilterPill>,
      ]}/>
      <window.AdminTable columns={[
        { label:'Room',       w:'200px' },
        { label:'Property',   w:'140px' },
        { label:'Room type',  w:'160px' },
        { label:'Bed config', w:'2fr' },
        { label:'Max occ',    w:'90px',  align:'right' },
        { label:'Tariff',     w:'100px', align:'right' },
        { label:'Status',     w:'110px' },
        { label:'',           w:'40px',  align:'right' },
      ]}>
        {ROOM_LIST.map((r, i) => {
          const rt = (window.ROOM_TYPES || []).find(t => t.name.toLowerCase() === (r.cat||'').toLowerCase()) || {};
          return (
            <window.AdminTRow key={r.id} divider={i>0} accent={window.propColor(r.prop)}
              onClick={() => window.location.hash = `room-edit/${r.id}`}
              columns={[{w:'200px'},{w:'140px'},{w:'160px'},{w:'2fr'},{w:'90px'},{w:'100px'},{w:'110px'},{w:'40px'}]}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'var(--r-1)', overflow:'hidden', position:'relative' }}>
                  <window.ImgSlot id={`rooms-${r.id}`} shape="rounded" radius={6} placeholder=""/>
                  <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}><window.RoomArt palette={r.palette} showLabel={false}/></div>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:14.5 }}>{window.propShort(r.prop)} · <em style={{ fontStyle:'italic' }}>{r.code}</em></div>
                  <div className="mono" style={{ fontSize:10, color:'var(--ink-faint)', marginTop:2 }}>{r.id}</div>
                </div>
              </div>
              <span style={{ fontSize:13 }}>{window.propName(r.prop)}</span>
              <span style={{ fontSize:13 }}>{r.cat}</span>
              <span style={{ fontFamily:'var(--display)', fontStyle:'italic', fontSize:13.5 }}>{rt.beds || '—'}</span>
              <span className="mono" style={{ fontSize:12, textAlign:'right' }}>{rt.max || '—'}</span>
              <span style={{ fontFamily:'var(--display)', fontSize:14, textAlign:'right' }}>{rt.tariff || '—'}</span>
              <window.Pill tone={r.status==='active'?'ok':'warn'} size="sm">{r.status}</window.Pill>
              <window.Icons.ChevronRight size={14} stroke="var(--ink-faint)"/>
            </window.AdminTRow>
          );
        })}
      </window.AdminTable>
    </window.AdminPage>
  );
}

// ═══════════════ ADD / EDIT ROOM ═══════════════
function RoomEdit({ args }){
  const roomId = args && args.length > 0 ? args.split('/')[0] : 'aw-01';
  const r = (window.ROOMS || []).find(x => x.id === roomId) || (window.ROOMS || [])[0];
  const propMeta = r ? window.PROP_LOOKUP[r.prop] : null;
  const [tab, setTab] = React.useState('details');

  const tabs = [
    { id:'details',   label:'Room details' },
    { id:'costs',     label:'Costs' },
    { id:'inventory', label:'Inventory' },
    { id:'photos',    label:'Photos' },
  ];

  return (
    <window.AdminPage
      kicker="Property"
      title={<>Add / Edit <em style={{ fontStyle:'italic' }}>Room</em></>}
      subtitle={null}
      actions={<>
        <window.Button variant="ghost" size="md"
          onClick={() => window.location.hash = 'rooms'}>Cancel</window.Button>
        <window.Button variant="primary" size="md" iconRight={<window.Icons.Check size={14}/>}>Save room</window.Button>
      </>}
      tabs={tabs.map(t => <window.AdminPageTab key={t.id} active={tab===t.id} onClick={() => setTab(t.id)}>{t.label}</window.AdminPageTab>)}
    >
      <RoomHeaderCard r={r}/>
      {tab === 'details'   && <RoomEditDetails r={r}/>}
      {tab === 'costs'     && <RoomEditCosts r={r}/>}
      {tab === 'inventory' && <RoomEditStock r={r}/>}
      {tab === 'photos'    && <RoomEditPhotos r={r}/>}
    </window.AdminPage>
  );
}

function RoomHeaderCard({ r }){
  return (
    <window.AdminFormCard>
      <div style={{ padding:'22px 26px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'var(--r-3)', overflow:'hidden', position:'relative', borderLeft:`4px solid ${window.propColor(r.prop)}` }}>
          <window.ImgSlot id={`re-hero-${r.id}`} shape="rounded" radius={14} placeholder=""/>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            <window.RoomArt palette={r.palette} showLabel={false}/>
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'var(--display)', fontWeight:300, fontSize:34, lineHeight:1.02, letterSpacing:'var(--tight)' }}>
            {window.propShort(r.prop)} <em style={{ fontStyle:'italic' }}>{r.code}</em>
          </div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-faint)', letterSpacing:'var(--tracked)', marginTop:8 }}>
            {r.id} · {window.propName(r.prop)}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <window.Pill tone="ok" size="sm">Active</window.Pill>
            <window.Pill tone="paper" size="sm">{r.cat}</window.Pill>
          </div>
        </div>
      </div>
    </window.AdminFormCard>
  );
}

// ─── Room Requests · multi-select with code ───────────────
const ROOM_REQUESTS = [
  { code:'EC', label:'Early Check-In' },
  { code:'EB', label:'Extra Bed' },
  { code:'EP', label:'Extra Person' },
  { code:'HC', label:'High Chair' },
  { code:'LA', label:'Late Arrival' },
  { code:'LC', label:'Late Check-Out' },
  { code:'MS', label:'Mid Stay Service' },
  { code:'PC', label:'Portacot' },
  { code:'SG', label:'Safety Gate' },
  { code:'SL', label:'Sales Lead' },
  { code:'SR', label:'See Res Notes' },
  { code:'TD', label:'To Do List · Master' },
];

function RoomRequests(){
  const [sel, setSel] = React.useState(new Set(['LA','LC']));
  const toggle = (code) => setSel(s => {
    const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n;
  });
  return (
    <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
        <div className="caps" style={{ color:'var(--ink-faint)' }}>Room requests</div>
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{sel.size} of {ROOM_REQUESTS.length} selected</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {ROOM_REQUESTS.map(r => {
          const on = sel.has(r.code);
          return (
            <button key={r.code} onClick={() => toggle(r.code)} style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'6px 10px 6px 8px', borderRadius:'var(--r-pill)',
              background: on ? 'var(--linen-soft)' : 'var(--paper)',
              color: on ? 'var(--ink)' : 'var(--ink-soft)',
              border: on ? '1px solid var(--ink)' : '1px solid var(--line)',
              cursor:'pointer', font:'inherit',
              fontSize:12, fontWeight: on?600:400,
            }}>
              <span style={{
                fontFamily:'var(--mono)', fontSize:9.5, fontWeight:700,
                padding:'2px 6px', borderRadius:4, letterSpacing:'.04em',
                background: on ? 'var(--ink)' : 'var(--linen-soft)',
                color: on ? 'var(--linen)' : 'var(--ink-faint)',
              }}>{r.code}</span>
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoomEditDetails({ r }){
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <window.AdminFormCard title="Identification">
        <window.AdminFormRow label="Room ID">
          <div style={{
            background:'var(--linen-soft)', border:'1px solid var(--line-soft)', borderRadius:'var(--r-2)',
            padding:'8px 12px', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ flex:1, fontFamily:'var(--mono)', fontSize:13, color:'var(--ink-soft)' }}>{r.id}</span>
            <span className="mono" style={{ fontSize:9.5, color:'var(--ink-faint)', letterSpacing:'.06em', textTransform:'uppercase' }}>System · read-only</span>
          </div>
        </window.AdminFormRow>
        <window.AdminFormRow label="Room name"><window.AdminTextInput value={`${window.propShort(r.prop)} ${r.code}`}/></window.AdminFormRow>
        <window.AdminFormRow label="Room number"><window.AdminTextInput value={r.code}/></window.AdminFormRow>
        <window.AdminFormRow label="Floor / area"><window.AdminTextInput value="Ground"/></window.AdminFormRow>
        <window.AdminFormRow label="Sort order"><window.AdminTextInput value="1"/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Room type & bed configuration">
        <window.AdminFormRow label="Room type"><window.AdminSelect value={r.cat}/></window.AdminFormRow>
        <window.AdminFormRow label="Bed configuration"><window.AdminSelect value="1 × Queen · 1 × Single"/></window.AdminFormRow>
        <window.AdminFormRow label="Base occupancy"><window.AdminTextInput value="2"/></window.AdminFormRow>
        <window.AdminFormRow label="Max occupancy"><window.AdminTextInput value="3"/></window.AdminFormRow>
        <window.AdminFormRow label="Default tariff"><window.AdminTextInput value="A$280" mono/></window.AdminFormRow>
        <div style={{ padding:'10px 18px', borderTop:'1px solid var(--line-soft)', background:'var(--linen)' }}>
          <div style={{ fontSize:11.5, color:'var(--ink-soft)', display:'flex', alignItems:'center', gap:8 }}>
            <window.Icons.Alert size={13} stroke="var(--ink-faint)"/>
            Room types and bed configurations are managed in <a href="#settings-room-types" style={{ color:'var(--ink)', fontWeight:600 }}>Settings → Room types</a>.
          </div>
        </div>
      </window.AdminFormCard>

      <window.AdminFormCard title="Features & amenities">
        <window.AdminFormRow label="Status"><window.AdminSelect value="Active · Maintenance · Unavailable"/></window.AdminFormRow>
        <window.AdminFormRow label="Size (m²)"><window.AdminTextInput value="28"/></window.AdminFormRow>
        <window.AdminFormRow label="View"><window.AdminSelect value="Garden"/></window.AdminFormRow>
        <window.AdminFormRow label="Accessible"><window.AdminSelect value="No"/></window.AdminFormRow>

        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:10 }}>Room amenities</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { name:'Air Conditioning', icon:'Sun',         on:true  },
              { name:'Smart TV',          icon:'Layout',      on:true  },
              { name:'Private Bathroom',  icon:'Door',        on:true  },
              { name:'Hair Dryer',        icon:'Sparkles',    on:true  },
              { name:'Coffee Machine',    icon:'Coffee',      on:true  },
              { name:'Balcony',           icon:'Lighthouse',  on:false },
            ].map(a => {
              const I = window.Icons[a.icon];
              return (
                <label key={a.name} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px', borderRadius:'var(--r-2)',
                  background: a.on ? 'var(--linen-soft)' : 'var(--paper)',
                  border: a.on ? '1px solid var(--ink)' : '1px solid var(--line)',
                  cursor:'pointer',
                }}>
                  <input type="checkbox" defaultChecked={a.on} style={{ width:14, height:14, accentColor:'var(--ink)', margin:0 }}/>
                  <I size={14} stroke={a.on ? 'var(--ink)' : 'var(--ink-faint)'}/>
                  <span style={{ fontSize:13, color: a.on ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: a.on ? 500 : 400 }}>{a.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <RoomRequests/>
      </window.AdminFormCard>

      <window.AdminFormCard title="Description (for booking sources)">
        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Short description</div>
          <div style={{
            background:'var(--paper)', border:'1px solid var(--line-strong)', borderRadius:'var(--r-2)',
            padding:'12px 14px', fontSize:13, lineHeight:1.5, minHeight:120, color:'var(--ink)',
          }}>
            Bright queen-suite with garden outlook and a private patio. Two minutes' walk to the lighthouse path. Sleeps two adults comfortably with one queen bed; a sofa-bed accommodates a child if needed.
          </div>
        </div>
      </window.AdminFormCard>
    </div>
  );
}

function RoomEditCosts({ r }){
  // Sample costs applicable to this room — pulled from the property-wide
  // cost list. Each cost type can be turned on/off and overridden here.
  const costs = [
    { id:'C-001', name:'Standard departure clean', type:'Cleaning',   basis:'Per booking', amount:'A$80',    enabled:true,  override:null },
    { id:'C-002', name:'Deep clean (post 7+ nts)', type:'Cleaning',   basis:'Per booking', amount:'A$140',   enabled:true,  override:null },
    { id:'C-003', name:'Linen replacement',        type:'Consumable', basis:'Per item',    amount:'A$22',    enabled:true,  override:null },
    { id:'C-005', name:'Airbnb commission',        type:'Commission', basis:'% of tariff', amount:'14%',     enabled:true,  override:null },
    { id:'C-007', name:'Returning guest · 5%',     type:'Discount',   basis:'% of tariff', amount:'5%',      enabled:true,  override:null },
    { id:'C-009', name:'Welcome basket',           type:'Consumable', basis:'Per booking', amount:'A$35',    enabled:false, override:null },
  ];
  return (
    <>
      <div style={{ background:'var(--linen)', borderRadius:'var(--r-2)', padding:'14px 18px',
        display:'flex', alignItems:'center', gap:10, border:'1px solid var(--line-soft)' }}>
        <window.Icons.Alert size={14} stroke="var(--ink-faint)"/>
        <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>
          Tick which property-wide cost types apply to this room. Costs are defined in <a href="#costs" style={{ color:'var(--ink)', fontWeight:600 }}>Property → Costs</a>. Per-room overrides allowed.
        </span>
      </div>

      <window.AdminFormCard title="Costs applied to this room"
        action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Add cost</window.Button>}>
        <div>
          <div style={{
            display:'grid', gridTemplateColumns:'50px 90px 1.6fr 130px 130px 120px 100px',
            gap:12, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
            fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
            letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
          }}>
            <span>On</span><span>ID</span><span>Cost</span><span>Type</span><span>Basis</span>
            <span style={{ textAlign:'right' }}>Amount</span><span style={{ textAlign:'right' }}>Override</span>
          </div>
          {costs.map((c, i) => (
            <div key={c.id} style={{
              display:'grid', gridTemplateColumns:'50px 90px 1.6fr 130px 130px 120px 100px',
              gap:12, alignItems:'center', padding:'12px 22px',
              borderTop:'1px solid var(--line-soft)',
              opacity: c.enabled ? 1 : 0.55,
            }}>
              <span style={{
                display:'inline-flex', width:36, height:20, borderRadius:'var(--r-pill)', alignItems:'center',
                background: c.enabled ? 'var(--ink)' : 'var(--line-strong)', position:'relative',
              }}>
                <span style={{
                  position:'absolute', top:2, left: c.enabled ? 18 : 2, width:16, height:16,
                  borderRadius:'50%', background:'#fff',
                }}/>
              </span>
              <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{c.id}</span>
              <span style={{ fontFamily:'var(--display)', fontSize:14.5 }}>{c.name}</span>
              <window.Pill tone={c.type==='Discount'?'warn':c.type==='Commission'?'info':'neutral'} size="sm">{c.type}</window.Pill>
              <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{c.basis}</span>
              <span style={{ fontFamily:'var(--display)', fontSize:15, textAlign:'right' }}>{c.amount}</span>
              <span style={{ fontSize:11.5, color:'var(--ink-faint)', textAlign:'right' }}>
                {c.override || <button style={{
                  background:'transparent', border:'1px dashed var(--line-strong)', borderRadius:'var(--r-pill)',
                  padding:'4px 10px', font:'inherit', fontSize:10.5, color:'var(--ink-soft)', cursor:'pointer',
                }}>Override</button>}
              </span>
            </div>
          ))}
        </div>
      </window.AdminFormCard>
    </>
  );
}

function RoomEditRates({ r }){
  return (
    <window.AdminFormCard title="Rate plans applied to this room"
      action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Apply plan</window.Button>}>
      <div>
        {[
          { id:'RP-001', name:'Standard · refundable',    base:'A$280', enabled:true },
          { id:'RP-002', name:'Non-refundable · 10% off', base:'A$252', enabled:true },
          { id:'RP-004', name:'Bed & breakfast',          base:'A$310', enabled:true },
          { id:'RP-005', name:'Direct booker · 5% off',   base:'A$266', enabled:false },
        ].map((p, i) => (
          <div key={p.id} style={{
            display:'grid', gridTemplateColumns:'50px 110px 1.6fr 120px 100px',
            gap:12, alignItems:'center', padding:'12px 22px',
            borderTop:'1px solid var(--line-soft)',
          }}>
            <span style={{
              display:'inline-flex', width:36, height:20, borderRadius:'var(--r-pill)', alignItems:'center',
              background: p.enabled ? 'var(--ink)' : 'var(--line-strong)', position:'relative',
            }}>
              <span style={{
                position:'absolute', top:2, left: p.enabled ? 18 : 2, width:16, height:16,
                borderRadius:'50%', background:'#fff',
              }}/>
            </span>
            <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{p.id}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:14.5 }}>{p.name}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:15 }}>{p.base}</span>
            <window.Button size="sm" variant="ghost">Edit pricing</window.Button>
          </div>
        ))}
      </div>
    </window.AdminFormCard>
  );
}

// ─── Per-room stock (assets · inventory · consumables in this room) ────
function RoomEditStock({ r }){
  const sections = [
    { kind:'assets', title:'Assets in this room', subtitle:'Furniture, fixtures and durable equipment installed in the room.',
      items:[
        { id:'A-001', name:'Queen bed frame',         qty:1, unit:'A$420', total:'A$420', condition:'good',     installed:'12 Jul 2024' },
        { id:'A-002', name:'Pocket-spring mattress',  qty:1, unit:'A$680', total:'A$680', condition:'good',     installed:'12 Jul 2024' },
        { id:'A-003', name:'Bedside lamp',            qty:2, unit:'A$95',  total:'A$190', condition:'good',     installed:'12 Jul 2024' },
        { id:'A-004', name:'Smart TV · 43"',          qty:1, unit:'A$680', total:'A$680', condition:'good',     installed:'12 Jul 2024' },
        { id:'A-005', name:'Bar fridge',              qty:1, unit:'A$320', total:'A$320', condition:'fair',     installed:'12 Jul 2024' },
        { id:'A-006', name:'Coffee machine',          qty:1, unit:'A$220', total:'A$220', condition:'good',     installed:'04 Sep 2025' },
        { id:'A-010', name:'Hairdryer · wall',        qty:1, unit:'A$80',  total:'A$80',  condition:'good',     installed:'12 Jul 2024' },
        { id:'A-012', name:'Artwork · framed',        qty:2, unit:'A$110', total:'A$220', condition:'good',     installed:'12 Jul 2024' },
      ]
    },
    { kind:'inventory', title:'Inventory · linen & reusables', subtitle:'Linen, towels and reusable items allocated to this room.',
      items:[
        { id:'I-001', name:'King fitted sheet',  qty:2, min:2, unit:'A$32', total:'A$64', last:'Today',     status:'ok' },
        { id:'I-003', name:'King quilt cover',   qty:1, min:1, unit:'A$48', total:'A$48', last:'Today',     status:'ok' },
        { id:'I-004', name:'Pillow case',        qty:4, min:4, unit:'A$8',  total:'A$32', last:'Today',     status:'ok' },
        { id:'I-005', name:'Bath towel',         qty:4, min:4, unit:'A$22', total:'A$88', last:'Today',     status:'ok' },
        { id:'I-006', name:'Hand towel',         qty:1, min:2, unit:'A$10', total:'A$10', last:'Yesterday', status:'low' },
        { id:'I-007', name:'Bath mat',           qty:1, min:1, unit:'A$14', total:'A$14', last:'Today',     status:'ok' },
      ]
    },
    { kind:'consumable', title:'Consumables', subtitle:'Single-use guest amenities re-stocked at every clean.',
      items:[
        { id:'I-101', name:'Shampoo (250ml)',         qty:1, min:1, unit:'A$4.20', total:'A$4.20', last:'Today',     status:'ok' },
        { id:'I-102', name:'Conditioner (250ml)',     qty:1, min:1, unit:'A$4.20', total:'A$4.20', last:'Today',     status:'ok' },
        { id:'I-103', name:'Body wash (250ml)',       qty:1, min:1, unit:'A$4.40', total:'A$4.40', last:'Today',     status:'ok' },
        { id:'I-104', name:'Hand soap bar',           qty:2, min:2, unit:'A$2.20', total:'A$4.40', last:'Today',     status:'ok' },
        { id:'I-105', name:'Coffee pods',             qty:8, min:6, unit:'A$0.85', total:'A$6.80', last:'Today',     status:'ok' },
        { id:'I-106', name:'Long-life milk (250ml)',  qty:1, min:2, unit:'A$0.95', total:'A$0.95', last:'Yesterday', status:'low' },
        { id:'I-107', name:'Tea bags',                qty:8, min:6, unit:'A$0.18', total:'A$1.44', last:'Today',     status:'ok' },
        { id:'I-108', name:'Sugar sachets',           qty:12,min:8, unit:'A$0.05', total:'A$0.60', last:'Today',     status:'ok' },
        { id:'I-109', name:'Toilet paper roll',       qty:3, min:2, unit:'A$1.10', total:'A$3.30', last:'Today',     status:'ok' },
      ]
    }
  ];

  const grandTotal = sections.reduce((s, sec) =>
    s + sec.items.reduce((ss, i) => ss + parseFloat(String(i.total).replace(/[^0-9.]/g,'')), 0), 0);
  const lowCount = sections.flatMap(s => s.items).filter(i => i.status === 'low').length;

  return (
    <>
      <window.AdminStatsRow items={[
        { icon:'Bed',        label:'Asset value · this room',  value:'A$2,810', tone:'ok' },
        { icon:'Sparkles',   label:'Inventory + consumables',  value: 'A$' + Math.round(grandTotal).toLocaleString() },
        { icon:'Alert',      label:'Below reorder · in-room',  value: String(lowCount), sub: lowCount > 0 ? 'Hand towel · milk' : 'All stocked', tone: lowCount ? 'bad' : 'ok' },
        { icon:'CheckCircle',label:'Last full re-stock',       value:'09:12 today' },
      ]}/>

      <window.AdminToolbar
        placeholder="Search items in this room…"
        filters={[
          <window.FilterPill key="a" on>All</window.FilterPill>,
          <window.FilterPill key="b">Assets</window.FilterPill>,
          <window.FilterPill key="c">Inventory</window.FilterPill>,
          <window.FilterPill key="d">Consumables</window.FilterPill>,
          <window.FilterPill key="e" count={lowCount}>Below reorder</window.FilterPill>,
        ]}
        actions={[
          <window.Button key="r" variant="ghost" size="sm" icon={<window.Icons.Sparkles size={13}/>}>Mark re-stocked</window.Button>,
          <window.Button key="a" variant="primary" size="sm" icon={<window.Icons.Plus size={13}/>}>Add item to room</window.Button>,
        ]}
      />

      {sections.map(sec => (
        <window.AdminFormCard key={sec.kind}
          title={
            <span style={{ display:'inline-flex', alignItems:'baseline', gap:10 }}>
              <span>{sec.title}</span>
              <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>
                · {sec.items.length} items · A$
                {Math.round(sec.items.reduce((s, i) => s + parseFloat(String(i.total).replace(/[^0-9.]/g,'')), 0)).toLocaleString()}
              </span>
            </span>
          }
          action={
            <span style={{ fontSize:11.5, color:'var(--ink-soft)', maxWidth:380, textAlign:'right' }}>
              {sec.subtitle}
            </span>
          }
        >
          <RoomStockTable section={sec}/>
        </window.AdminFormCard>
      ))}

      <window.AdminFormCard title="Recent activity · this room">
        <div>
          {[
            { t:'Today · 09:12',  who:'Anna T.',  kind:'Re-stock',  detail:'Linen + consumables · standard turnover' },
            { t:'Today · 09:00',  who:'Anna T.',  kind:'Loss · STN',detail:'Hand towel · 1 unit · stained', tone:'bad' },
            { t:'Yesterday',      who:'System',   kind:'Reorder',   detail:'Auto-flagged: long-life milk below reorder' },
            { t:'18 Nov',         who:'Mia',      kind:'Asset add', detail:'Coffee machine replaced (A-006 · A$220)' },
          ].map((e, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'140px 110px 150px 1fr',
              gap:14, padding:'12px 22px', alignItems:'center',
              borderTop: i ? '1px solid var(--line-soft)' : 'none',
            }}>
              <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{e.t}</span>
              <span style={{ fontSize:12.5 }}>{e.who}</span>
              <window.Pill tone={e.tone === 'bad' ? 'bad' : e.kind === 'Re-stock' ? 'ok' : 'neutral'} size="sm">{e.kind}</window.Pill>
              <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{e.detail}</span>
            </div>
          ))}
        </div>
      </window.AdminFormCard>
    </>
  );
}

function RoomStockTable({ section }){
  const isAssets = section.kind === 'assets';
  return (
    <>
      <div style={{
        display:'grid',
        gridTemplateColumns: isAssets
          ? '100px 1.6fr 70px 100px 100px 110px 130px 40px'
          : '100px 1.6fr 70px 80px 100px 100px 110px 110px 40px',
        gap:10, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
        fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
        letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
      }}>
        <span>ID</span><span>Item</span>
        <span style={{ textAlign:'right' }}>Qty</span>
        {!isAssets && <span style={{ textAlign:'right' }}>Par</span>}
        <span style={{ textAlign:'right' }}>Unit</span>
        <span style={{ textAlign:'right' }}>Value</span>
        {isAssets
          ? <><span>Condition</span><span>Installed</span></>
          : <><span>Last re-stock</span><span>Status</span></>}
        <span/>
      </div>
      {section.items.map((it, i) => (
        <div key={it.id} style={{
          display:'grid',
          gridTemplateColumns: isAssets
            ? '100px 1.6fr 70px 100px 100px 110px 130px 40px'
            : '100px 1.6fr 70px 80px 100px 100px 110px 110px 40px',
          gap:10, padding:'12px 22px', alignItems:'center',
          borderTop: '1px solid var(--line-soft)',
        }}>
          <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{it.id}</span>
          <span style={{ fontFamily:'var(--display)', fontSize:14 }}>{it.name}</span>
          <span style={{ fontFamily:'var(--display)', fontSize:15, fontStyle:'italic', textAlign:'right' }}>{it.qty}</span>
          {!isAssets && (
            <span className="mono" style={{ fontSize:11.5, color:'var(--ink-faint)', textAlign:'right' }}>{it.min}</span>
          )}
          <span className="mono" style={{ fontSize:11.5, textAlign:'right' }}>{it.unit}</span>
          <span style={{ fontFamily:'var(--display)', fontSize:14, textAlign:'right' }}>{it.total}</span>
          {isAssets
            ? <>
                <window.Pill tone={it.condition === 'fair' ? 'warn' : 'ok'} size="sm">{it.condition}</window.Pill>
                <span className="mono" style={{ fontSize:11, color:'var(--ink-soft)' }}>{it.installed}</span>
              </>
            : <>
                <span className="mono" style={{ fontSize:11, color:'var(--ink-soft)' }}>{it.last}</span>
                <window.Pill tone={it.status === 'low' ? 'warn' : 'ok'} size="sm">{it.status === 'low' ? 'low' : 'ok'}</window.Pill>
              </>}
          <window.IconButton size={28} variant="quiet"><window.Icons.More size={13}/></window.IconButton>
        </div>
      ))}
    </>
  );
}

function RoomEditPhotos({ r }){
  return (
    <window.AdminFormCard title="Room photos">
      <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
        {['hero','bedroom','bathroom','view','workspace','detail'].map((id, i) => (
          <div key={id} style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden', position:'relative' }}>
            <window.ImgSlot id={`room-${r.id}-photo-${id}`} shape="rounded" radius={10} placeholder={`Photo ${i+1}`}/>
            {i === 0 && <span style={{ position:'absolute', top:8, left:8 }}><window.Pill tone="ink" size="sm">Hero</window.Pill></span>}
          </div>
        ))}
      </div>
    </window.AdminFormCard>
  );
}

// ═══════════════ RATES ═══════════════
// Structured by Property → Room. Each room shows its rate plans + nightly grid.
function Rates(){
  const [propId, setPropId] = React.useState('away');
  return (
    <div style={{ background:'var(--linen)', minHeight:'calc(100vh - 81px)' }}>
      <div style={{ padding:'24px 32px 18px' }}>
        <div className="caps page-kicker" style={{ color:'var(--ink-faint)' }}>Property</div>
        <h1 className="page-title" style={{ margin:'4px 0 0', fontFamily:'var(--display)', fontWeight:300, fontSize:30, lineHeight:1.05, letterSpacing:'var(--tight)' }}>
          Rates
        </h1>
        <div style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {window.PROPERTIES.filter(p => p.id !== 'all').map(p => (
              <window.FilterPill key={p.id} on={propId===p.id} onClick={() => setPropId(p.id)}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', marginRight:4 }}/>
                {p.short || p.name}
              </window.FilterPill>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <window.Button variant="ghost" size="md" icon={<window.Icons.Calendar size={14}/>}>Bulk update</window.Button>
            <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}>New rate plan</window.Button>
          </div>
        </div>
      </div>

      <div style={{ padding:'8px 32px 80px', display:'flex', flexDirection:'column', gap:18 }}>
        {(window.ROOMS || []).filter(r => r.prop === propId).map(r => <RoomRateBlock key={r.id} room={r}/>)}
      </div>
    </div>
  );
}

function RoomRateBlock({ room }){
  const rt = (window.ROOM_TYPES || []).find(t => t.name.toLowerCase() === (room.cat||'').toLowerCase()) || {};
  const plans = [
    { id:'RP-001', name:'Standard · refundable',    type:'Per night', refund:'Yes', brk:'No',  base:rt.tariff || 'A$280', status:'active'  },
    { id:'RP-002', name:'Non-refundable · 10% off', type:'Per night', refund:'No',  brk:'No',  base:'A$252', status:'active'  },
    { id:'RP-004', name:'Bed & breakfast',          type:'Per night', refund:'Yes', brk:'Yes', base:'A$310', status:'active'  },
    { id:'RP-005', name:'Direct booker · 5% off',   type:'Per night', refund:'Yes', brk:'No',  base:'A$266', status:'draft'   },
  ];
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const baseRate = parseInt((rt.tariff || 'A$280').replace(/[^0-9]/g,''));
  return (
    <window.AdminFormCard title={
      <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ width:8, height:24, borderRadius:3, background: window.propColor(room.prop) }}/>
        <span style={{ fontFamily:'var(--display)', fontWeight:400, fontSize:18 }}>
          {window.propShort(room.prop)} · <em style={{ fontStyle:'italic' }}>{room.code}</em>
        </span>
        <span className="mono" style={{ fontSize:10.5, color:'var(--ink-faint)' }}>
          {room.cat} · {rt.beds || 'config in Settings'} · {rt.tariff || 'tariff —'}
        </span>
      </span>
    } action={<window.Button size="sm" variant="ghost" icon={<window.Icons.Plus size={13}/>}>Apply plan</window.Button>}>
      {/* Rate plans table */}
      <div>
        <div style={{
          display:'grid', gridTemplateColumns:'100px 1.6fr 130px 80px 80px 100px 90px 40px',
          gap:10, padding:'12px 22px', borderTop:'1px solid var(--line-soft)',
          fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase',
          letterSpacing:'var(--tracked)', color:'var(--ink-faint)', fontWeight:500,
        }}>
          <span>Plan ID</span><span>Name</span><span>Type</span><span>Refund</span><span>B&amp;B</span>
          <span style={{ textAlign:'right' }}>Base</span><span>Status</span><span/>
        </div>
        {plans.map((p, i) => (
          <div key={p.id} style={{
            display:'grid', gridTemplateColumns:'100px 1.6fr 130px 80px 80px 100px 90px 40px',
            gap:10, alignItems:'center', padding:'10px 22px',
            borderTop:'1px solid var(--line-soft)',
          }}>
            <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{p.id}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:14 }}>{p.name}</span>
            <span style={{ fontSize:12.5 }}>{p.type}</span>
            <span style={{ fontSize:12.5 }}>{p.refund}</span>
            <span style={{ fontSize:12.5 }}>{p.brk}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:14, textAlign:'right' }}>{p.base}</span>
            <window.Pill tone={p.status==='active'?'ok':'warn'} size="sm">{p.status}</window.Pill>
            <window.Icons.ChevronRight size={14} stroke="var(--ink-faint)"/>
          </div>
        ))}
      </div>

      {/* 7-day rate calendar */}
      <div style={{ padding:'18px 22px', borderTop:'1px solid var(--line)' }}>
        <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:10 }}>Daily rates · next 7 nights</div>
        <div style={{ display:'grid', gridTemplateColumns:`140px repeat(7, 1fr)`, gap:0 }}>
          <span className="caps" style={{ color:'var(--ink-faint)', padding:'8px 0' }}>Plan</span>
          {days.map((d, i) => (
            <span key={i} className="mono" style={{ textAlign:'center', fontSize:9.5, color: i===3?'var(--terra)':'var(--ink-faint)', padding:'8px 0' }}>
              {d}<br/>{17+i}
            </span>
          ))}
          {plans.filter(p => p.status==='active').map(plan => (
            <React.Fragment key={plan.id}>
              <div style={{ padding:'10px 0', fontFamily:'var(--display)', fontStyle:'italic', fontSize:13, borderTop:'1px solid var(--line-soft)' }}>
                {plan.name.split(' · ')[0]}
              </div>
              {days.map((_, i) => {
                const isWeekend = i===5 || i===6;
                const rate = parseInt(plan.base.replace(/[^0-9]/g,'')) + (isWeekend ? 40 : 0);
                return (
                  <div key={i} style={{
                    padding:'10px 0', textAlign:'center', borderTop:'1px solid var(--line-soft)',
                    background: isWeekend ? 'rgba(246,221,208,.25)' : 'transparent',
                    fontFamily:'var(--display)', fontSize:13.5,
                    color: isWeekend ? 'var(--terra-deep)' : 'var(--ink)',
                  }}>{rate}</div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </window.AdminFormCard>
  );
}

// ═══════════════ COSTS ═══════════════
// Defines cost types library AND shows which rooms each cost type
// applies to. Per-room toggling/overrides happen on the Room edit page.
const COST_TYPES = [
  { id:'C-001', name:'Standard departure clean',    type:'Cleaning',    basis:'Per booking',  amount:'A$80',   appliedRooms:14 },
  { id:'C-002', name:'Deep clean (post 7+ nts)',    type:'Cleaning',    basis:'Per booking',  amount:'A$140',  appliedRooms:14 },
  { id:'C-003', name:'Linen replacement',           type:'Consumable',  basis:'Per item',     amount:'A$22',   appliedRooms:14 },
  { id:'C-004', name:'Booking.com commission',      type:'Commission',  basis:'% of tariff',  amount:'15%',    appliedRooms:14 },
  { id:'C-005', name:'Airbnb commission',           type:'Commission',  basis:'% of tariff',  amount:'14%',    appliedRooms:14 },
  { id:'C-006', name:'Travel agent commission',     type:'Commission',  basis:'% of tariff',  amount:'10%',    appliedRooms:14 },
  { id:'C-007', name:'Returning guest · 5%',        type:'Discount',    basis:'% of tariff',  amount:'5%',     appliedRooms:14 },
  { id:'C-008', name:'Group · 10%',                 type:'Discount',    basis:'% of tariff',  amount:'10%',    appliedRooms:14 },
  { id:'C-009', name:'Welcome basket',              type:'Consumable',  basis:'Per booking',  amount:'A$35',   appliedRooms:3  },
  { id:'C-010', name:'Linen laundry (outsourced)',  type:'Cleaning',    basis:'Per kg',       amount:'A$4.50', appliedRooms:14 },
];

function Costs(){
  return (
    <window.AdminPage
      kicker="Property"
      title="Costs"
      subtitle="Cost types library. Each cost type can be applied to one or many rooms. Per-room overrides are managed inside each room's edit page."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Doc size={14}/>}>Export</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}>New cost type</window.Button>
      </>}
    >
      <window.AdminToolbar placeholder="Search costs…" filters={[
        <window.FilterPill key="a" on count={COST_TYPES.length}>All</window.FilterPill>,
        <window.FilterPill key="b" count={3}>Cleaning</window.FilterPill>,
        <window.FilterPill key="c" count={3}>Consumables</window.FilterPill>,
        <window.FilterPill key="d" count={3}>Commission</window.FilterPill>,
        <window.FilterPill key="e" count={2}>Discount</window.FilterPill>,
      ]}/>
      <window.AdminTable columns={[
        { label:'Cost ID',          w:'100px' },
        { label:'Name',             w:'2fr' },
        { label:'Type',             w:'130px' },
        { label:'Basis',            w:'140px' },
        { label:'Amount',           w:'120px', align:'right' },
        { label:'Applied to rooms', w:'170px', align:'right' },
        { label:'',                 w:'120px', align:'right' },
      ]}>
        {COST_TYPES.map((c, i) => (
          <window.AdminTRow key={c.id} divider={i>0}
            columns={[{w:'100px'},{w:'2fr'},{w:'130px'},{w:'140px'},{w:'120px'},{w:'170px'},{w:'120px'}]}>
            <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{c.id}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:14.5 }}>{c.name}</span>
            <window.Pill tone={c.type==='Discount'?'warn':c.type==='Commission'?'info':'neutral'} size="sm">{c.type}</window.Pill>
            <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{c.basis}</span>
            <span style={{ fontFamily:'var(--display)', fontSize:15, textAlign:'right' }}>{c.amount}</span>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
              <div style={{ width:50, height:5, background:'var(--line-soft)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width: `${(c.appliedRooms/14)*100}%`, height:'100%', background:'var(--teal)' }}/>
              </div>
              <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{c.appliedRooms} / 14</span>
            </div>
            <window.Button size="sm" variant="ghost" style={{ marginLeft:'auto' }}>Manage rooms</window.Button>
          </window.AdminTRow>
        ))}
      </window.AdminTable>
    </window.AdminPage>
  );
}

// ═══════════════ INVENTORY ═══════════════
const INV_ASSETS = [
  { id:'A-001', name:'Queen bed frame',     qty:14, prop:'All',     unit:'A$420',  rooms:14, status:'ok' },
  { id:'A-002', name:'Pocket-spring mattress', qty:14, prop:'All',  unit:'A$680', rooms:14, status:'ok' },
  { id:'A-003', name:'Bedside lamp',        qty:28, prop:'All',     unit:'A$95',   rooms:14, status:'ok' },
  { id:'A-004', name:'Smart TV · 43"',      qty:14, prop:'All',     unit:'A$680',  rooms:14, status:'ok' },
  { id:'A-005', name:'Bar fridge',          qty:14, prop:'All',     unit:'A$320',  rooms:14, status:'ok' },
  { id:'A-006', name:'Coffee machine',      qty:14, prop:'All',     unit:'A$220',  rooms:14, status:'ok' },
  { id:'A-007', name:'Kettle',              qty:14, prop:'All',     unit:'A$45',   rooms:14, status:'ok' },
  { id:'A-008', name:'Toaster',             qty:14, prop:'All',     unit:'A$60',   rooms:14, status:'ok' },
  { id:'A-009', name:'Microwave',           qty:8,  prop:'All',     unit:'A$140',  rooms:8,  status:'ok' },
  { id:'A-010', name:'Hairdryer · wall',    qty:14, prop:'All',     unit:'A$80',   rooms:14, status:'ok' },
  { id:'A-011', name:'Floor lamp',          qty:6,  prop:'Sunrise', unit:'A$160',  rooms:6,  status:'ok' },
  { id:'A-012', name:'Artwork · framed',    qty:22, prop:'All',     unit:'A$110',  rooms:14, status:'ok' },
];

function Inventory(){
  const [tab, setTab] = React.useState('assets');
  return (
    <window.AdminPage
      kicker="Property"
      title="Inventory"
      subtitle="Assets, reusable inventory and consumables across the four properties."
      actions={<>
        <window.Button variant="ghost" size="md" icon={<window.Icons.Doc size={14}/>}>Export</window.Button>
        <window.Button variant="primary" size="md" icon={<window.Icons.Plus size={14}/>}
          onClick={() => window.location.hash = `inventory-edit/${tab}`}>Add item</window.Button>
      </>}
      tabs={<>
        <window.AdminPageTab active={tab==='assets'}     onClick={() => setTab('assets')}>Assets</window.AdminPageTab>
        <window.AdminPageTab active={tab==='inventory'}  onClick={() => setTab('inventory')}>Inventory</window.AdminPageTab>
        <window.AdminPageTab active={tab==='consumable'} onClick={() => setTab('consumable')}>Consumables</window.AdminPageTab>
        <window.AdminPageTab active={tab==='per-room'}   onClick={() => setTab('per-room')}>Per-room stock</window.AdminPageTab>
      </>}
    >
      {tab === 'assets'     && <InventoryList kind="assets"/>}
      {tab === 'inventory'  && <InventoryList kind="inventory"/>}
      {tab === 'consumable' && <InventoryList kind="consumable"/>}
      {tab === 'per-room'   && <InventoryPerRoom/>}
    </window.AdminPage>
  );
}

const INV_LINEN = [
  { id:'I-001', name:'King fitted sheet',    qty: 22, min:18, prop:'All',     unit:'A$32',  rooms:14, status:'ok' },
  { id:'I-002', name:'Queen fitted sheet',   qty:  9, min:12, prop:'All',     unit:'A$28',  rooms:11, status:'low' },
  { id:'I-003', name:'King quilt cover',     qty: 12, min:10, prop:'All',     unit:'A$48',  rooms:6,  status:'ok' },
  { id:'I-004', name:'Pillow case',          qty: 48, min:30, prop:'All',     unit:'A$8',   rooms:28, status:'ok' },
  { id:'I-005', name:'Bath towel',           qty: 36, min:32, prop:'All',     unit:'A$22',  rooms:28, status:'ok' },
  { id:'I-006', name:'Hand towel',           qty: 14, min:24, prop:'All',     unit:'A$10',  rooms:28, status:'low' },
  { id:'I-007', name:'Bath mat',             qty:  8, min:14, prop:'All',     unit:'A$14',  rooms:14, status:'low' },
];

const INV_CONSUMABLE = [
  { id:'I-101', name:'Shampoo bottle (250ml)',  qty:42, min:30, prop:'All',    unit:'A$4.20', rooms:14, status:'ok' },
  { id:'I-102', name:'Conditioner (250ml)',     qty:24, min:30, prop:'All',    unit:'A$4.20', rooms:14, status:'low' },
  { id:'I-103', name:'Body wash (250ml)',       qty:36, min:30, prop:'All',    unit:'A$4.40', rooms:14, status:'ok' },
  { id:'I-104', name:'Hand soap bar',           qty:18, min:14, prop:'All',    unit:'A$2.20', rooms:14, status:'ok' },
  { id:'I-105', name:'Coffee pods · Veneziano', qty:120,min:100,prop:'All',    unit:'A$0.85', rooms:14, status:'ok' },
  { id:'I-106', name:'Long-life milk (250ml)',  qty: 14, min:24,prop:'All',    unit:'A$0.95', rooms:14, status:'low' },
  { id:'I-107', name:'Tea (English breakfast)', qty:280,min:200,prop:'All',    unit:'A$0.18', rooms:14, status:'ok' },
  { id:'I-108', name:'Sugar sachets',           qty:480,min:400,prop:'All',    unit:'A$0.05', rooms:14, status:'ok' },
  { id:'I-109', name:'Toilet paper roll',       qty: 64, min:80,prop:'All',    unit:'A$1.10', rooms:14, status:'low' },
  { id:'I-110', name:'Welcome chocolate',       qty:  8, min:30,prop:'Sunrise',unit:'A$2.40', rooms:4,  status:'critical' },
];

function InventoryList({ kind }){
  const rows = kind === 'assets' ? INV_ASSETS
             : kind === 'inventory' ? INV_LINEN
             : INV_CONSUMABLE;
  const isAssets = kind === 'assets';
  const lowCount = isAssets ? 0 : rows.filter(r => r.status !== 'ok').length;
  // Sum stock value: qty × unit cost
  const sumValue = rows.reduce((s, r) => {
    const n = parseFloat(String(r.unit).replace(/[^0-9.]/g,'')) || 0;
    return s + n * r.qty;
  }, 0);
  const fmt = (v) => 'A$' + Math.round(v).toLocaleString();
  const kindLabel = isAssets ? 'assets' : kind === 'inventory' ? 'inventory' : 'consumables';
  return (
    <>
      <window.AdminStatsRow items={
        isAssets ? [
          { icon:'Dollar',      label:'Asset value · on hand', value:fmt(sumValue), tone:'ok' },
          { icon:'CheckCircle', label:'In service',            value:String(rows.length) },
          { icon:'Alert',       label:'Lost / damaged · 30d',  value:'2', tone:'bad' },
        ] : [
          { icon:'Dollar', label:`Stock value · ${kindLabel}`, value:fmt(sumValue), tone:'ok' },
          { icon:'Alert',  label:'Below reorder', value:lowCount, sub:'Time to reorder', tone:'bad' },
          { icon:'Sparkles', label:'Lost / damaged · 30d', value:'3', tone:'bad' },
        ]
      }/>
      <window.AdminToolbar placeholder={`Search ${kindLabel}…`} filters={[
        <window.FilterPill key="a" on count={rows.length}>All</window.FilterPill>,
        !isAssets && <window.FilterPill key="b" count={lowCount}>Below reorder</window.FilterPill>,
        <window.FilterPill key="c" count={4}>All properties</window.FilterPill>,
        <window.FilterPill key="d">Lost / damaged</window.FilterPill>,
      ].filter(Boolean)}/>
      <window.AdminTable columns={isAssets ? [
        { label:'Item ID',  w:'100px' },
        { label:'Name',     w:'2fr' },
        { label:'Property', w:'110px' },
        { label:'On hand',  w:'90px',  align:'right' },
        { label:'Unit cost',w:'100px', align:'right' },
        { label:'In rooms', w:'100px', align:'right' },
        { label:'Status',   w:'100px' },
        { label:'',         w:'160px', align:'right' },
      ] : [
        { label:'Item ID',  w:'100px' },
        { label:'Name',     w:'2fr' },
        { label:'Property', w:'110px' },
        { label:'On hand',  w:'90px',  align:'right' },
        { label:'Reorder',  w:'90px',  align:'right' },
        { label:'Per unit', w:'100px', align:'right' },
        { label:'In rooms', w:'100px', align:'right' },
        { label:'Status',   w:'100px' },
        { label:'',         w:'160px', align:'right' },
      ]}>
        {rows.map((r, i) => <InvRow key={r.id} r={r} kind={kind} divider={i>0}/>)}
      </window.AdminTable>
    </>
  );
}

function InvRow({ r, kind, divider }){
  const isAssets = kind === 'assets';
  const tone = r.status === 'critical' ? 'bad' : r.status === 'low' ? 'warn' : 'ok';
  const cols = isAssets ? [{w:'100px'},{w:'2fr'},{w:'110px'},{w:'90px'},{w:'100px'},{w:'100px'},{w:'100px'},{w:'160px'}]
                        : [{w:'100px'},{w:'2fr'},{w:'110px'},{w:'90px'},{w:'90px'},{w:'100px'},{w:'100px'},{w:'100px'},{w:'160px'}];
  return (
    <window.AdminTRow divider={divider} columns={cols}
      onClick={() => window.location.hash = `inventory-edit/${kind}/${r.id}`}>
      <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{r.id}</span>
      <span style={{ fontFamily:'var(--display)', fontSize:14.5 }}>{r.name}</span>
      <span style={{ fontSize:12.5 }}>{r.prop}</span>
      <span style={{ fontFamily:'var(--display)', fontSize:15, fontStyle:'italic', textAlign:'right' }}>{r.qty}</span>
      {!isAssets && <span className="mono" style={{ fontSize:12, textAlign:'right' }}>{r.min}</span>}
      <span className="mono" style={{ fontSize:11.5, textAlign:'right' }}>{r.unit}</span>
      <span className="mono" style={{ fontSize:11.5, textAlign:'right', color:'var(--ink-soft)' }}>{r.rooms} rms</span>
      <window.Pill tone={isAssets ? 'ok' : tone} size="sm">{isAssets ? 'in service' : r.status}</window.Pill>
      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
        <window.Button size="sm" variant="ghost"
          onClick={e => { e.stopPropagation(); window.location.hash = `inventory-edit/${kind}/${r.id}/loss`; }}>Loss</window.Button>
        {!isAssets && r.status !== 'ok'
          ? <window.Button size="sm" variant="primary">Reorder</window.Button>
          : <window.Button size="sm" variant="ghost">Edit</window.Button>}
      </div>
    </window.AdminTRow>
  );
}

function InventoryPerRoom(){
  const propIds = ['away','sunrise','bgh','aireys'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {propIds.map(pid => <PropPerRoom key={pid} pid={pid}/>)}
    </div>
  );
}

function PropPerRoom({ pid }){
  const rooms = (window.ROOMS || []).filter(r => r.prop === pid);
  const items = [
    { name:'Linen sets',     icon:'Bed',       qty:2,  cost:'A$110' },
    { name:'Towels',         icon:'Suitcase',  qty:4,  cost:'A$88'  },
    { name:'Toiletries',     icon:'Coffee',    qty:1,  cost:'A$22'  },
    { name:'Coffee · pods',  icon:'Coffee',    qty:8,  cost:'A$6.80'},
    { name:'TP rolls',       icon:'Doc',       qty:3,  cost:'A$3.30'},
  ];
  return (
    <window.AdminFormCard title={
      <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:window.propColor(pid) }}/>
        {window.propName(pid)}
        <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{rooms.length} rooms</span>
      </span>
    }>
      <div style={{ display:'grid', gridTemplateColumns:`200px repeat(${items.length}, 1fr)`, padding:0 }}>
        <div className="caps" style={{ padding:'12px 18px', color:'var(--ink-faint)', borderTop:'1px solid var(--line-soft)' }}>Room</div>
        {items.map(it => {
          const I = window.Icons[it.icon];
          return (
            <div key={it.name} style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:6, borderTop:'1px solid var(--line-soft)' }}>
              <I size={13} stroke="var(--ink-faint)"/>
              <span className="caps" style={{ color:'var(--ink-faint)' }}>{it.name}</span>
            </div>
          );
        })}
        {rooms.map(r => (
          <React.Fragment key={r.id}>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--line-soft)', fontFamily:'var(--display)', fontSize:14 }}>
              {window.propShort(r.prop)} · <em style={{ fontStyle:'italic' }}>{r.code}</em>
            </div>
            {items.map(it => (
              <div key={it.name+r.id} style={{ padding:'12px 14px', borderTop:'1px solid var(--line-soft)', display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:6 }}>
                <span style={{ fontFamily:'var(--display)', fontSize:15 }}>{it.qty}</span>
                <span className="mono" style={{ fontSize:10, color:'var(--ink-faint)' }}>{it.cost}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </window.AdminFormCard>
  );
}

// Expose global Room types (sourced from settings module)
window.ROOM_TYPES = window.ROOM_TYPES || [
  { id:'RT-001', name:'Queen suite',     base:2, max:2, beds:'1 × Queen',                         tariff:'A$280' },
  { id:'RT-002', name:'Family villa',    base:2, max:4, beds:'1 × King · 2 × Single',             tariff:'A$310' },
  { id:'RT-003', name:'Studio',          base:1, max:2, beds:'1 × Queen · sofa bed',              tariff:'A$240' },
  { id:'RT-004', name:'Ocean queen',     base:2, max:3, beds:'1 × Queen · 1 × Single',            tariff:'A$260' },
  { id:'RT-005', name:'Master suite',    base:2, max:2, beds:'1 × Super king',                    tariff:'A$320' },
  { id:'RT-006', name:'Headland house',  base:2, max:5, beds:'1 × King · 1 × Queen · 1 × Bunk',   tariff:'A$385' },
];

window.Screens['property-register'] = PropertyRegister;
window.Screens['property-edit']     = PropertyEdit;
window.Screens['property-images']   = PropertyImagesPage;
window.Screens['rooms']             = Rooms;
window.Screens['room-edit']         = RoomEdit;
window.Screens['rates']             = Rates;
window.Screens['costs']             = Costs;
window.Screens['inventory']         = Inventory;
window.Screens['inventory-edit']    = InventoryEdit;

// ═══════════════ ADD / EDIT INVENTORY ITEM ═══════════════
function InventoryEdit({ args }){
  const parts = (args || '').split('/');
  const kind = parts[0] || 'assets';     // assets | inventory | consumable
  const id   = parts[1] || '';
  const isLoss = parts[2] === 'loss';
  const isAssets = kind === 'assets';
  const kindLabel = isAssets ? 'Asset' : kind === 'inventory' ? 'Inventory' : 'Consumable';

  const [tab, setTab] = React.useState(isLoss ? 'loss' : 'details');
  const isNew = !id;

  return (
    <window.AdminPage
      kicker="Property / Inventory"
      title={<>{isNew ? 'Add' : 'Edit'} <em style={{ fontStyle:'italic' }}>{kindLabel}</em></>}
      subtitle={null}
      actions={<>
        <window.Button variant="ghost" size="md"
          onClick={() => window.location.hash = 'inventory'}>Cancel</window.Button>
        <window.Button variant="primary" size="md" iconRight={<window.Icons.Check size={14}/>}>Save</window.Button>
      </>}
      tabs={<>
        <window.AdminPageTab active={tab==='details'}  onClick={() => setTab('details')}>Item details</window.AdminPageTab>
        <window.AdminPageTab active={tab==='purchase'} onClick={() => setTab('purchase')}>Purchase & bill</window.AdminPageTab>
        <window.AdminPageTab active={tab==='loss'}     onClick={() => setTab('loss')}>Lost / damaged</window.AdminPageTab>
        <window.AdminPageTab active={tab==='history'}  onClick={() => setTab('history')}>Movement history</window.AdminPageTab>
      </>}
    >
      {tab === 'details'  && <InvItemDetails kind={kind} isAssets={isAssets}/>}
      {tab === 'purchase' && <InvItemPurchase/>}
      {tab === 'loss'     && <InvItemLoss/>}
      {tab === 'history'  && <InvItemHistory/>}
    </window.AdminPage>
  );
}

function InvItemDetails({ kind, isAssets }){
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <window.AdminFormCard title="Identification">
        <window.AdminFormRow label="Item ID">
          <div style={{
            background:'var(--linen-soft)', border:'1px solid var(--line-soft)', borderRadius:'var(--r-2)',
            padding:'8px 12px', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ flex:1, fontFamily:'var(--mono)', fontSize:13, color:'var(--ink-soft)' }}>{isAssets?'A-013':'I-013'}</span>
            <span className="mono" style={{ fontSize:9.5, color:'var(--ink-faint)', letterSpacing:'.06em', textTransform:'uppercase' }}>System</span>
          </div>
        </window.AdminFormRow>
        <window.AdminFormRow label="Name"><window.AdminTextInput placeholder="Item name…"/></window.AdminFormRow>
        <window.AdminFormRow label="Category">
          <window.AdminSelect value={isAssets?'Furniture':kind==='inventory'?'Linen':'Toiletries'}/>
        </window.AdminFormRow>
        <window.AdminFormRow label="Property"><window.AdminSelect value="All properties"/></window.AdminFormRow>
        <window.AdminFormRow label="Status">
          <window.AdminSelect value={isAssets?'In service':'Available'}/>
        </window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Stock & cost">
        <window.AdminFormRow label="Quantity on hand"><window.AdminTextInput value="14"/></window.AdminFormRow>
        {!isAssets && <window.AdminFormRow label="Reorder level">
          <window.AdminTextInput value="12" suffix="units"/>
        </window.AdminFormRow>}
        <window.AdminFormRow label="Unit cost"><window.AdminTextInput value="A$" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Used in rooms"><window.AdminTextInput value="14"/></window.AdminFormRow>
        <window.AdminFormRow label="Supplier"><window.AdminSelect value="—"/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Description">
        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div style={{
            background:'var(--paper)', border:'1px solid var(--line-strong)', borderRadius:'var(--r-2)',
            padding:'12px 14px', fontSize:13, color:'var(--ink-faint)', fontStyle:'italic', minHeight:96,
          }}>Notes about the item — model, dimensions, finish…</div>
        </div>
      </window.AdminFormCard>

      <window.AdminFormCard title="Photo">
        <div style={{ padding:'16px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden' }}>
            <window.ImgSlot id="inv-edit-photo" shape="rounded" radius={10} placeholder="Drop a photo of the item"/>
          </div>
        </div>
      </window.AdminFormCard>
    </div>
  );
}

function InvItemPurchase(){
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>
      <window.AdminFormCard title="Purchase record">
        <window.AdminFormRow label="Purchase date"><window.AdminTextInput value="22 Nov 2026" suffix="📅"/></window.AdminFormRow>
        <window.AdminFormRow label="Supplier"><window.AdminSelect value="Bunnings · trade account"/></window.AdminFormRow>
        <window.AdminFormRow label="Invoice / bill #"><window.AdminTextInput value="BNG-44218" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Quantity received"><window.AdminTextInput value="6"/></window.AdminFormRow>
        <window.AdminFormRow label="Unit cost"><window.AdminTextInput value="A$48.00" mono/></window.AdminFormRow>
        <window.AdminFormRow label="GST"><window.AdminTextInput value="A$28.80" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Total"><window.AdminTextInput value="A$316.80" mono/></window.AdminFormRow>
        <window.AdminFormRow label="Paid by"><window.AdminSelect value="Property card · ending 4421"/></window.AdminFormRow>
        <window.AdminFormRow label="Push to Xero"><window.AdminSelect value="Yes · queued for next sync"/></window.AdminFormRow>
      </window.AdminFormCard>

      <window.AdminFormCard title="Bill upload">
        <div style={{ padding:'18px 22px' }}>
          <div style={{
            aspectRatio:'4/3', borderRadius:'var(--r-3)', overflow:'hidden',
            border:'1.5px dashed var(--line-strong)',
          }}>
            <window.ImgSlot id="inv-bill" shape="rounded" radius={14} placeholder="Drop bill / receipt (PDF, JPG)"/>
          </div>
          <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
            <window.Icons.Doc size={14} stroke="var(--ink-faint)"/>
            <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>PDF, JPG or PNG — max 10 MB</span>
            <span style={{ flex:1 }}/>
            <window.Button variant="ghost" size="sm" icon={<window.Icons.Plus size={13}/>}>Upload</window.Button>
          </div>

          <div style={{ marginTop:18 }}>
            <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Previous bills · 3</div>
            {[
              { f:'BNG-44218.pdf', d:'22 Nov 2026', a:'A$316.80' },
              { f:'BNG-44102.pdf', d:'04 Sep 2026', a:'A$148.50' },
              { f:'BNG-43890.pdf', d:'12 Jun 2026', a:'A$528.00' },
            ].map(b => (
              <div key={b.f} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius:'var(--r-2)',
                background:'var(--linen)', border:'1px solid var(--line-soft)',
                marginBottom:6,
              }}>
                <window.Icons.Doc size={14} stroke="var(--ink-faint)"/>
                <span style={{ flex:1, fontFamily:'var(--mono)', fontSize:11.5 }}>{b.f}</span>
                <span style={{ fontSize:12, color:'var(--ink-soft)' }}>{b.d}</span>
                <span style={{ fontFamily:'var(--display)', fontSize:13 }}>{b.a}</span>
                <window.IconButton size={26} variant="quiet"><window.Icons.Eye size={12}/></window.IconButton>
              </div>
            ))}
          </div>
        </div>
      </window.AdminFormCard>
    </div>
  );
}

function InvItemLoss(){
  const REASONS = [
    { code:'LOST',    label:'Lost',         desc:'Cannot be located' },
    { code:'DMG',     label:'Damaged',      desc:'Damaged beyond use' },
    { code:'BRKN',    label:'Broken',       desc:'Mechanical / structural failure' },
    { code:'STN',     label:'Stained',      desc:'Linen / fabric staining' },
    { code:'WRN',     label:'Worn out',     desc:'End of useful life' },
    { code:'WST',     label:'Wasted',       desc:'Expired / spoiled (consumable)' },
    { code:'THFT',    label:'Theft',        desc:'Reported missing after guest stay' },
    { code:'WRTOFF',  label:'Write-off',    desc:'Other · explain in notes' },
  ];
  const [reason, setReason] = React.useState('LOST');
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>
      <window.AdminFormCard title="Record loss / damage">
        <window.AdminFormRow label="Date noticed"><window.AdminTextInput value="20 Nov 2026" suffix="📅"/></window.AdminFormRow>
        <window.AdminFormRow label="Quantity affected"><window.AdminTextInput value="1" suffix="units"/></window.AdminFormRow>
        <window.AdminFormRow label="Property"><window.AdminSelect value="Away Guesthouse"/></window.AdminFormRow>
        <window.AdminFormRow label="Room (optional)"><window.AdminSelect value="Away 03"/></window.AdminFormRow>
        <window.AdminFormRow label="Reported by"><window.AdminSelect value="Anna T. (Housekeeper)"/></window.AdminFormRow>
        <window.AdminFormRow label="Linked booking"><window.AdminTextInput value="R-5421 (optional)" mono/></window.AdminFormRow>

        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:10 }}>Reason code</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {REASONS.map(r => {
              const on = r.code === reason;
              return (
                <button key={r.code} onClick={() => setReason(r.code)} style={{
                  display:'flex', alignItems:'flex-start', gap:10, textAlign:'left',
                  padding:'10px 12px', borderRadius:'var(--r-2)',
                  background: on ? 'var(--linen-soft)' : 'var(--paper)',
                  color:'var(--ink)',
                  border: on ? '1px solid var(--ink)' : '1px solid var(--line)',
                  cursor:'pointer', font:'inherit',
                }}>
                  <span style={{
                    fontFamily:'var(--mono)', fontSize:9.5, fontWeight:700, padding:'3px 7px',
                    borderRadius:4, letterSpacing:'.04em',
                    background: on ? 'var(--ink)' : 'var(--linen-soft)',
                    color: on ? 'var(--linen)' : 'var(--ink-faint)',
                  }}>{r.code}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight: on ? 600 : 500 }}>{r.label}</div>
                    <div style={{ fontSize:11.5, color:'var(--ink-soft)', marginTop:2 }}>{r.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div className="caps" style={{ color:'var(--ink-faint)', marginBottom:8 }}>Notes</div>
          <div style={{
            background:'var(--paper)', border:'1px solid var(--line-strong)', borderRadius:'var(--r-2)',
            padding:'12px 14px', fontSize:13, color:'var(--ink-faint)', fontStyle:'italic', minHeight:80,
          }}>Anything to add — guest interaction, follow-up needed…</div>
        </div>

        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--line-soft)', background:'var(--linen)',
          display:'flex', alignItems:'center', gap:10 }}>
          <window.Icons.Alert size={14} stroke="var(--terra-deep)"/>
          <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>
            Saving will decrement the on-hand quantity by <strong style={{ color:'var(--terra-deep)' }}>1 unit</strong> and write an audit entry.
          </span>
        </div>
      </window.AdminFormCard>

      <window.AdminFormCard title="Evidence photo">
        <div style={{ padding:'16px 18px', borderTop:'1px solid var(--line-soft)' }}>
          <div style={{ aspectRatio:'4/3', borderRadius:'var(--r-2)', overflow:'hidden' }}>
            <window.ImgSlot id="inv-loss-photo" shape="rounded" radius={10} placeholder="Drop a photo (optional)"/>
          </div>
          <div className="caps" style={{ color:'var(--ink-faint)', marginTop:14, marginBottom:6 }}>Recent losses</div>
          {[
            { what:'Bath towel · 2', when:'18 Nov · stained', reason:'STN' },
            { what:'Coffee mug · 1', when:'14 Nov · broken', reason:'BRKN' },
            { what:'Hair dryer · 1', when:'08 Nov · theft', reason:'THFT' },
          ].map(e => (
            <div key={e.what} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 0',
              borderTop:'1px solid var(--line-soft)',
            }}>
              <span style={{
                fontFamily:'var(--mono)', fontSize:9.5, fontWeight:700,
                padding:'2px 6px', borderRadius:4, background:'var(--linen-soft)',
                color:'var(--ink-faint)', letterSpacing:'.04em',
              }}>{e.reason}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:500 }}>{e.what}</div>
                <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{e.when}</div>
              </div>
            </div>
          ))}
        </div>
      </window.AdminFormCard>
    </div>
  );
}

function InvItemHistory(){
  const events = [
    { t:'22 Nov 2026', kind:'Purchase',     by:'Mia',  delta:'+6', notes:'Bill BNG-44218 · A$316.80' },
    { t:'20 Nov 2026', kind:'Loss · STN',   by:'Anna', delta:'-1', notes:'Stained linen — Away 03 turnover' },
    { t:'14 Nov 2026', kind:'Loss · BRKN',  by:'Marco',delta:'-1', notes:'Broken mug — Sunrise 02' },
    { t:'04 Sep 2026', kind:'Purchase',     by:'Mia',  delta:'+4', notes:'Bill BNG-44102 · A$148.50' },
    { t:'21 Aug 2026', kind:'Adjustment',   by:'Mia',  delta:'-1', notes:'Stock-take correction' },
    { t:'12 Jun 2026', kind:'Purchase',     by:'Mia',  delta:'+8', notes:'Bill BNG-43890 · A$528.00' },
  ];
  return (
    <window.AdminFormCard title="Movement history">
      <window.AdminTable columns={[
        { label:'Date',   w:'130px' },
        { label:'Kind',   w:'170px' },
        { label:'By',     w:'120px' },
        { label:'Δ qty',  w:'80px', align:'right' },
        { label:'Notes',  w:'2fr' },
      ]}>
        {events.map((e, i) => (
          <window.AdminTRow key={i} divider={i>0}
            columns={[{w:'130px'},{w:'170px'},{w:'120px'},{w:'80px'},{w:'2fr'}]}>
            <span className="mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{e.t}</span>
            <window.Pill tone={e.kind.startsWith('Loss')?'bad':e.kind==='Purchase'?'ok':'neutral'} size="sm">{e.kind}</window.Pill>
            <span style={{ fontSize:12.5 }}>{e.by}</span>
            <span style={{
              fontFamily:'var(--display)', fontSize:15, fontStyle:'italic', textAlign:'right',
              color: e.delta.startsWith('+') ? 'var(--teal-ink)' : 'var(--terra-deep)',
            }}>{e.delta}</span>
            <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{e.notes}</span>
          </window.AdminTRow>
        ))}
      </window.AdminTable>
    </window.AdminFormCard>
  );
}
