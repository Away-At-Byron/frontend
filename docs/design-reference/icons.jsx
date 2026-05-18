// Simple, hospitality-flavored icon set.
// More curvy and iconic than a generic UI set — slight personality:
// rounded mattresses, key with a round bow, sun with curved rays,
// door with an arched top, smile-curve chat bubble. All 24×24 viewBox.
//
// Defaults: stroke 1.8, round caps/joins, fill="none".
// Pass strokeWidth to override per usage. Pass filled to use solid variants.

function Icon({ children, size=22, stroke='currentColor', fill='none', strokeWidth=1.8 }){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const Icons = {
  // ── HOSPITALITY ──────────────────────────────────────────
  // Bed: rounded mattress with two scroll pillows. Headboard arcs gently.
  Bed: (p)=>(<Icon {...p}>
    <path d="M3.5 17.5v-3.2c0-1.2.9-2.2 2.1-2.3l3-.3a3 3 0 0 1 2.2.7c.6.5 1.3.5 1.9.5h7.3c1 0 1.9.8 2 1.8l.5 3"/>
    <path d="M3.5 17.5v2.5M20.5 17.5v2.5"/>
    <path d="M5.5 11.7V8.8c0-1 .8-1.8 1.8-1.8h9.4c1 0 1.8.8 1.8 1.8v2.9"/>
    <path d="M8.5 11.6V9.6c0-.7.6-1.2 1.2-1.2h.6c.7 0 1.2.5 1.2 1.2v2"/>
  </Icon>),

  // Key: round bow with hole + simple bit
  Key: (p)=>(<Icon {...p}>
    <circle cx="7.5" cy="12" r="3.7"/>
    <circle cx="7.5" cy="12" r="1.1"/>
    <path d="M11.2 12h9"/>
    <path d="M16.5 12v2.5M19.5 12v2"/>
  </Icon>),

  // Concierge bell: dome with little stem + button on top, plate underneath
  ConciergeBell: (p)=>(<Icon {...p}>
    <path d="M4 16.5h16"/>
    <path d="M5 16.5C5 12.9 8.1 10 12 10s7 2.9 7 6.5"/>
    <path d="M12 10V8.4"/>
    <path d="M10.6 8.4h2.8" />
  </Icon>),

  // Coffee cup with curved handle + a steam squiggle
  Coffee: (p)=>(<Icon {...p}>
    <path d="M5 11.5h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4z"/>
    <path d="M16 12.5h1.4a2.4 2.4 0 0 1 0 4.8H16"/>
    <path d="M8.5 6.5C8 7.5 9 8 8.5 9M11.5 5.5C11 6.5 12 7 11.5 8"/>
  </Icon>),

  // Suitcase with rounded handle + a soft crease
  Suitcase: (p)=>(<Icon {...p}>
    <rect x="3.5" y="8" width="17" height="11.5" rx="2.5"/>
    <path d="M9 8V6.4c0-.8.6-1.4 1.4-1.4h3.2c.8 0 1.4.6 1.4 1.4V8"/>
    <path d="M12 8.5v10.5"/>
  </Icon>),

  // Sun with curved (not pointed) rays
  Sun: (p)=>(<Icon {...p}>
    <circle cx="12" cy="12" r="3.6"/>
    <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8"/>
    <path d="M6.2 6.2l1.3 1.3M16.5 16.5l1.3 1.3M6.2 17.8l1.3-1.3M16.5 7.5l1.3-1.3"/>
  </Icon>),

  // Moon: soft crescent
  Moon: (p)=>(<Icon {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4c0 4.4 3.6 8 8 8 .9 0 1.7-.1 2.5-.4-.5 1-.7 1.9-.7 2.9z"/>
  </Icon>),

  // Door with rounded/arched top
  Door: (p)=>(<Icon {...p}>
    <path d="M6 20.5V8c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v12.5"/>
    <path d="M4 20.5h16"/>
    <circle cx="14" cy="13" r=".9" fill="currentColor" stroke="none"/>
  </Icon>),

  // Heart: smooth curves only
  Heart: (p)=>(<Icon {...p}>
    <path d="M12 20s-7-4.4-7-10A4 4 0 0 1 12 7a4 4 0 0 1 7 3c0 5.6-7 10-7 10z"/>
  </Icon>),

  // House w/ curved roof
  House: (p)=>(<Icon {...p}>
    <path d="M3.5 11C7 7 8.5 4.5 12 4.5S17 7 20.5 11"/>
    <path d="M5 10v9.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>
    <path d="M10 20v-5h4v5"/>
  </Icon>),

  // Lighthouse: round-headed, curved beam strokes
  Lighthouse: (p)=>(<Icon {...p}>
    <path d="M9 20.5h6"/>
    <path d="M10 20.5l1-9h2l1 9"/>
    <path d="M8.5 11.5h7"/>
    <path d="M9.5 8.5h5l-.5-2.5h-4z"/>
    <path d="M11 6V4.2c0-.4.3-.7.7-.7h.6c.4 0 .7.3.7.7V6"/>
    <path d="M6.5 10c-.6.4-1 .8-1.5 1.5M17.5 10c.6.4 1 .8 1.5 1.5" strokeOpacity=".45"/>
  </Icon>),

  // Wave: more flowing
  Wave: (p)=>(<Icon {...p}>
    <path d="M2.5 14c1.8 0 2.4-2.2 4.7-2.2S9.5 14 12 14s2.5-2.2 4.8-2.2S19 14 21.5 14"/>
    <path d="M2.5 18c1.8 0 2.4-2.2 4.7-2.2S9.5 18 12 18s2.5-2.2 4.8-2.2S19 18 21.5 18" strokeOpacity=".55"/>
  </Icon>),

  // Star with rounded points
  Star: (p)=>(<Icon {...p}>
    <path d="M12 3.5l2.2 5 5.3.6c.6 0 .8.7.4 1.1l-4 3.6 1.1 5.2c.1.6-.5 1-1 .7L12 17l-4.8 2.7c-.5.3-1.1-.1-1-.7l1.1-5.2-4-3.6c-.4-.4-.2-1.1.4-1.1l5.3-.6 2.2-5c.2-.6.9-.6 1.2 0z"/>
  </Icon>),

  // ── COMMS / NAV ──────────────────────────────────────────
  // Chat bubble with a curved tail
  Message: (p)=>(<Icon {...p}>
    <path d="M4 12c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5-3.6 6.5-8 6.5c-1 0-2-.2-2.9-.5l-3.4 1.4a.4.4 0 0 1-.5-.5l.8-2.8C4.7 14.9 4 13.5 4 12z"/>
  </Icon>),

  // Bell with a curved swing
  Bell: (p)=>(<Icon {...p}>
    <path d="M6 16c0-.7.5-1.1.9-1.6.6-.7 1.1-1.5 1.1-2.6V10a4 4 0 1 1 8 0v1.8c0 1.1.5 2 1.1 2.6.4.5.9.9.9 1.6 0 .8-1 1.4-2.2 1.4H8.2C7 17.4 6 16.8 6 16z"/>
    <path d="M10.2 19a2 2 0 0 0 3.6 0"/>
  </Icon>),

  // Calendar — rounded, with a date dot
  Calendar: (p)=>(<Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="3"/>
    <path d="M8.5 3.5v3.5M15.5 3.5v3.5"/>
    <path d="M3.5 10.5h17"/>
    <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>
  </Icon>),

  // Clock — softer hands
  Clock: (p)=>(<Icon {...p}>
    <circle cx="12" cy="12" r="8.2"/>
    <path d="M12 7.5V12l3 2"/>
  </Icon>),

  // Pin — teardrop
  Pin: (p)=>(<Icon {...p}>
    <path d="M12 21c0 0 7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </Icon>),

  Doc: (p)=>(<Icon {...p}>
    <path d="M7 3.5h7.5L18.5 8v11.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z"/>
    <path d="M14 3.5V8h4.5"/>
  </Icon>),

  Check: (p)=>(<Icon {...p}><path d="M4.5 12.5l5 5 10-11"/></Icon>),
  CheckCircle: (p)=>(<Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l3 3 5-6"/></Icon>),
  X: (p)=>(<Icon {...p}><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></Icon>),
  Plus: (p)=>(<Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>),
  ArrowRight: (p)=>(<Icon {...p}><path d="M4.5 12h15M13 6l6 6-6 6"/></Icon>),
  ChevronRight: (p)=>(<Icon {...p}><path d="M9 5l7 7-7 7"/></Icon>),
  ChevronLeft: (p)=>(<Icon {...p}><path d="M15 5l-7 7 7 7"/></Icon>),
  ChevronDown: (p)=>(<Icon {...p}><path d="M5 9l7 7 7-7"/></Icon>),

  // Filter — funnel with rounded base
  Filter: (p)=>(<Icon {...p}>
    <path d="M3.5 5.5h17l-6.4 8c-.4.5-.6 1-.6 1.6V20l-3.5-1.8a1 1 0 0 1-.5-.9V15c0-.6-.2-1.1-.6-1.6L3.5 5.5z"/>
  </Icon>),

  Search: (p)=>(<Icon {...p}>
    <circle cx="11" cy="11" r="6.2"/>
    <path d="M16 16l4 4"/>
  </Icon>),

  User: (p)=>(<Icon {...p}>
    <circle cx="12" cy="8.5" r="3.4"/>
    <path d="M5 20c1-3.6 4-5.4 7-5.4s6 1.8 7 5.4"/>
  </Icon>),

  Phone: (p)=>(<Icon {...p}>
    <path d="M5 4.5h2.7c.5 0 1 .3 1.1.8l1 3a1.2 1.2 0 0 1-.4 1.4l-1.6 1.2a11 11 0 0 0 5.3 5.3l1.2-1.6a1.2 1.2 0 0 1 1.4-.4l3 1c.5.1.8.6.8 1.1V19a2 2 0 0 1-2 2A14.5 14.5 0 0 1 3 6.5a2 2 0 0 1 2-2z"/>
  </Icon>),

  More: (p)=>(<Icon {...p}>
    <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/>
  </Icon>),

  // Grid — 2x2 squares
  Grid: (p)=>(<Icon {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5"/>
    <rect x="13" y="4" width="7" height="7" rx="1.5"/>
    <rect x="4" y="13" width="7" height="7" rx="1.5"/>
    <rect x="13" y="13" width="7" height="7" rx="1.5"/>
  </Icon>),

  // Layout — sidebar layout
  Layout: (p)=>(<Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/>
    <path d="M9.5 4.5v15"/>
  </Icon>),

  // Sparkline — small chart
  Sparkline: (p)=>(<Icon {...p}>
    <path d="M3.5 16l4-5 4 3 4-7 5 9"/>
  </Icon>),

  // Trending up
  TrendUp: (p)=>(<Icon {...p}>
    <path d="M3.5 17l5-6 4 4 7-9"/>
    <path d="M14.5 6h5v5"/>
  </Icon>),

  // Broom — for housekeeping
  Broom: (p)=>(<Icon {...p}>
    <path d="M16 4l-7 7"/>
    <path d="M14 9l3 3"/>
    <path d="M7 13l-2 3c-.5.8-.3 1.8.5 2.4l1.6 1.2c.8.6 1.9.4 2.5-.4l2.2-3"/>
    <path d="M14 12c1.6 1 3 1.5 4.5 1.5l1.5-2L18 8l-2 1c0 1.5.5 2.5 1.5 3z"/>
    <path d="M7 18l3-3"/>
  </Icon>),

  // Sparkles — clean indicator
  Sparkles: (p)=>(<Icon {...p}>
    <path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5z"/>
    <path d="M18 16l.7 1.8L20.5 18.5 18.7 19.2 18 21l-.7-1.8L15.5 18.5 17.3 17.8z"/>
  </Icon>),

  // Dollar
  Dollar: (p)=>(<Icon {...p}>
    <path d="M12 4v16"/>
    <path d="M16 7.5c-.6-1.3-2-2-3.5-2-2.2 0-3.8 1-3.8 2.8s1.4 2.6 4 3 4.3 1.4 4.3 3.4-1.8 3-4 3c-1.7 0-3.3-.7-4-2.2"/>
  </Icon>),

  // Logout
  Logout: (p)=>(<Icon {...p}>
    <path d="M10 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h4"/>
    <path d="M14 8l4 4-4 4"/>
    <path d="M9 12h9"/>
  </Icon>),

  // Eye — view
  Eye: (p)=>(<Icon {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/>
    <circle cx="12" cy="12" r="2.5"/>
  </Icon>),

  // Alert / warning triangle
  Alert: (p)=>(<Icon {...p}>
    <path d="M12 4l9 16H3z"/>
    <path d="M12 10v4"/>
    <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none" strokeWidth="2"/>
  </Icon>),

  // Settings — gear with soft teeth
  Settings: (p)=>(<Icon {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19 12c0 .5-.05 1-.15 1.5l1.8 1.4a.5.5 0 0 1 .1.6l-1.7 3a.5.5 0 0 1-.6.2l-2.1-.8c-.7.6-1.6 1-2.5 1.3l-.3 2.2a.5.5 0 0 1-.5.4h-3.5a.5.5 0 0 1-.5-.4l-.3-2.2c-.9-.3-1.8-.7-2.5-1.3l-2.1.8a.5.5 0 0 1-.6-.2l-1.7-3a.5.5 0 0 1 .1-.6l1.8-1.4A6 6 0 0 1 5 12c0-.5.05-1 .15-1.5l-1.8-1.4a.5.5 0 0 1-.1-.6l1.7-3a.5.5 0 0 1 .6-.2l2.1.8c.7-.6 1.6-1 2.5-1.3l.3-2.2a.5.5 0 0 1 .5-.4h3.5a.5.5 0 0 1 .5.4l.3 2.2c.9.3 1.8.7 2.5 1.3l2.1-.8a.5.5 0 0 1 .6.2l1.7 3a.5.5 0 0 1-.1.6l-1.8 1.4c.1.5.15 1 .15 1.5z"/>
  </Icon>),
};

Object.assign(window, { Icon, Icons });
