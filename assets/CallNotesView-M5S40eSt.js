import{r as m,j as e,s as b}from"./index-DbRImb4o.js";function w(a){return new Date(a).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/Chicago",timeZoneName:"short"})}function f({md:a}){return e.jsx("div",{className:"space-y-1",children:a.split(`
`).map((n,i)=>{const t=n.trim();if(!t)return e.jsx("div",{className:"h-2"},i);if(t.startsWith("### "))return e.jsx("h3",{className:"text-xs font-bold text-[#224057] mt-3 mb-1",children:t.replace(/^### /,"")},i);if(t.startsWith("## "))return e.jsx("h2",{className:"text-sm font-bold text-[#224057] mt-4 mb-1",children:t.replace(/^## /,"")},i);if(t.startsWith("# "))return e.jsx("h1",{className:"text-sm font-bold text-[#224057] mt-4 mb-1",children:t.replace(/^# /,"")},i);if(t.startsWith("- ")||t.startsWith("* ")||t.match(/^-{3,}\s*$/)){if(t.match(/^-{3,}\s*$/))return e.jsx("hr",{className:"border-gray-100 my-3"},i);const l=(n.match(/^(\s+)/)||["",""])[1].length;return e.jsxs("div",{className:"flex gap-2 text-xs text-gray-600",style:{paddingLeft:l*8+8},children:[e.jsx("span",{className:"text-gray-400 mt-0.5 flex-shrink-0",children:"•"}),e.jsx("span",{children:t.replace(/^[-*] /,"").replace(/\*\*(.*?)\*\*/g,"$1")})]},i)}if(t.match(/^\d+\.\s/)){const l=(n.match(/^(\s+)/)||["",""])[1].length;return e.jsxs("div",{className:"flex gap-2 text-xs text-gray-600",style:{paddingLeft:l*8+8},children:[e.jsxs("span",{className:"text-gray-400 mt-0.5 flex-shrink-0 w-4",children:[t.match(/^(\d+)\./)?.[1],"."]}),e.jsx("span",{children:t.replace(/^\d+\.\s+/,"")})]},i)}return t.startsWith("Chat with meeting transcript:")?null:e.jsx("p",{className:"text-xs text-gray-600",children:t},i)})})}function u({note:a,expanded:n,onToggle:i}){const t=!!a.summary_markdown;return e.jsxs("div",{className:"rounded-xl border border-gray-200 bg-white shadow-sm transition-all",children:[e.jsxs("button",{onClick:i,className:"w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50/50 rounded-xl transition-colors",children:[e.jsxs("div",{className:"flex-shrink-0 w-20 text-center",children:[e.jsx("div",{className:"text-xs font-semibold text-gray-400 uppercase tracking-wide",children:new Date(a.meeting_date).toLocaleDateString("en-US",{weekday:"short",timeZone:"America/Chicago"})}),e.jsx("div",{className:"text-2xl font-bold text-[#224057] leading-none mt-0.5",children:new Date(a.meeting_date).toLocaleDateString("en-US",{day:"numeric",timeZone:"America/Chicago"})}),e.jsx("div",{className:"text-xs text-gray-400 mt-0.5",children:new Date(a.meeting_date).toLocaleDateString("en-US",{month:"short",timeZone:"America/Chicago"})})]}),e.jsx("div",{className:"w-px self-stretch bg-gray-100 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mb-1",children:[e.jsx("span",{className:"font-semibold text-[#224057] text-sm",children:a.subject}),a.is_8am&&e.jsx("span",{className:"rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700",children:"8 AM"}),!t&&e.jsx("span",{className:"rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400",children:"No notes"})]}),e.jsx("div",{className:"text-xs text-gray-400",children:w(a.meeting_date)}),!n&&t&&e.jsxs("p",{className:"text-xs text-gray-500 mt-1.5 line-clamp-2",children:[a.summary_markdown?.replace(/[#*\-`]/g,"").substring(0,160),"..."]})]}),t&&e.jsx("div",{className:`flex-shrink-0 text-gray-300 transition-transform mt-1 ${n?"rotate-180":""}`,children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 16 16",fill:"none",children:e.jsx("path",{d:"M4 6l4 4 4-4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})})]}),n&&t&&e.jsxs("div",{className:"px-5 pb-5",children:[e.jsx("div",{className:"w-full h-px bg-gray-100 mb-4"}),e.jsx(f,{md:a.summary_markdown||""})]})]})}const v=`### Strategic Context: V9 to V10 Shift

- Data production pipeline now largely mature; diminishing returns on further optimization
  - Networks, hospital NERFs, source files essentially stable
- Priority shifts to methodology: imputation and data coverage definition
- Broader ambition: move beyond rate comparisons into analytics and intelligence
  - MMA competitors beginning to enter this space
  - Goal is to leapfrog with more sophisticated data use cases

### V9 State of the State

- Data started flowing last week; overall quality trends positive at high level
- Institutional HCP codes showed quality decline for Cigna and UHC (outpatient, HICC codes)
  - Flagged as likely a data characteristic issue, not a pipeline issue
  - Percent-of-Medicare normalization attempted to detect rate shifts; inconclusive so far
- Kaiser excluded from version-to-version comparison (no prior full-process baseline)

### Tier Shift and Quality Summary Tool

- New tool compares percent of green/yellow records by billing class and building type across versions
- Shows MSA-level distribution via box plots plus count of improved vs. declined MSAs
- Example: institutional MSDRG, 263 MSAs improved, 67 declined (out of 364 total)

### Data Size and Credit for V9 Work

- Current data coverage proxy measure understates actual data gain
  - Binary flag logic: if utilization-weighted coverage clears a threshold, the whole category shows green
- Rough ingestion numbers: ~53% more rate records coming in vs. V8; networks roughly doubled
- Pipeline tracker being built (Chris Kalvig) to show record counts at each processing stage
  - Ingestion, analytic filters, post-processing, and final production output
  - Will enable a clear before/after story from V8 to V9

### Carrier Ranking and Network Coverage Tracker

- Carrier ranking table now in tracker; shows spend-based rank (lowest cost = 1)
  - Rank inflation noted because more networks added; need a re-rank limited to the four core BUCA networks
- Hospital coverage table updated with room-line data, including facility and APC/AIS detail
- Percent-of-charge rates new to V9; separate view comparing quality with and without them

### Imputation: Current State Problems

- Current imputation operates at carrier/plan/MSA/billing-code level, not NPI level
- Methodology was built for a sparse North Carolina dataset; anchored relativity toward 1.0
  - In markets with low transparency data, imputation compresses everything to near-parity
  - Field sees 1% gaps in Network Navigator where external sources show 9% gaps
  - Training wheels are doing all the work; dynamic market differences get flattened

### Imputation: Future State Direction

- Goal: NPI and rate-level imputation, fully integrated into the rate dataset
- Komodo data as the imputation basis where available
- New confidence classification needed to flag imputed rates
- Key unlock: rate-level imputation eliminates the normalization problem as a byproduct
- Handle (front-end) will need schema changes

### Methodology Workplan and Timing

- Three months until V10 delivery to field and MMA clients
- Alignment on methodological changes needed within the next few weeks
- Schema must be delivered to Handle shortly after
- Other method areas flagged:
  - Conversion rate by reimbursement type and geography
  - Modifier handling edge cases
  - Zero-percent inpatient in low-population MSAs

### Next Steps

- Finalize pipeline tracker with all processing stages (Chris Kalvig, target: following day)
- Produce schema outline for rate-level imputation to share with Handle/Brian
- Add population filter to carrier coverage tracker page
- Add rank view limited to four core BUCA networks
- Investigate Cigna and UHC outpatient quality decline
- Summarize conversion rates by reimbursement type and geography (Bobby/Chris)`,N=`### Year-in-Review: Pipeline Maturity

- Consensus: pipeline has reached yield ceiling; focus shifts to methods, imputation, and tooling
- V9 production run processed ~2.07 trillion data elements; retaining ~200 billion
- Added 49 new carriers and 78 new networks (v9), up from 59 carriers / 108 networks
- Aetna V2 schema remains unresolved
  - First attempt in February nearly broke the system; Google processing costs hit $80K that month vs. ~$30K normal
  - V8 Aetna data still flowing but aging out; actively working a fix

### Strategic Priorities Confirmed

- Three workstreams for next 60–90 days:
  - 1.1: Hotspotting and lineage investigation (Tanner leads)
  - 1.2: Hospital directory, bot automation (Chris Kalvig as exec sponsor)
  - 1.3: Aetna v2 schema pull-through; ingestion redesign targeting July 20th data orders
  - 1.4: Kaiser network (lower priority than Aetna)
- Hospital processor redesign complete and production-ready; carrier processor next

### Imputation Deep Dive

- Current state: MSA/carrier/billing-code level — too coarse
- Future state: NPI-level, rate-embedded imputation with utilization weighting
- Komodo as primary imputation basis; Cigna x Beaumont in Michigan as proof-of-concept
- Handle (IRIS) claims to already do rate-level imputation; schema wiring may be partially in place
- New confidence tier needed beyond green/yellow/red/blue

### Network Navigator v2 Discussion

- v2 targeting early 2027 (per Schedule F)
- Key capability additions discussed:
  - Hotspot mapping — identify cost outlier providers at NPI level
  - Predictive cost modeling for employer clients
  - Direct-to-employer analytics layer

### MMA Field Feedback

- Producers see 1% gaps where other tools show 9% — credibility problem in the field
- Request: simple, memorable stat for field use ("X% more rates, Y% more networks")
- Carrier ranking improvement noted as high visibility with producers`,j=`The June 18th full-day strategy session marked a pivot point in the THS–MMA engagement. After two years of pipeline buildout, both teams aligned that data ingestion has reached a yield ceiling and that the next competitive advantage lies in methodology — specifically NPI-level imputation and data coverage intelligence.

Key outcomes: (1) Three concurrent workstreams confirmed for Q3 through V10 delivery, led by Tanner (hotspotting/lineage), Chris Kalvig (hospital directory automation), and the core data team (Aetna V2 schema fix). (2) The imputation architecture was directionally approved — moving from MSA/plan-level relativities to rate-embedded, utilization-weighted NPI-level imputation using Komodo as the primary data source. (3) Network Navigator v2 scoping was previewed, with a target of early 2027 per Schedule F.

The session also surfaced a field credibility gap: MMA producers are seeing 1% cost differentials in the tool where competitor sources show 9%, a direct consequence of over-smoothed imputation. Closing that gap is the methodological north star heading into V10.`,k=`The June 15th methods and imputation discussion was a working session to align THS and MMA on the technical direction ahead of V10. The conversation confirmed that the data production pipeline is largely mature and that the next layer of value comes from improving imputation precision and expanding data coverage intelligence.

The most significant alignment reached: current imputation methodology — built for a sparse North Carolina dataset — systematically compresses market differences, causing the tool to understate gaps that producers observe in the field. The agreed path forward is NPI-level, rate-embedded imputation using Komodo utilization data as the foundation, replacing the current reference table approach.

Chris Kalvig's pipeline tracker and the carrier ranking refinement were identified as near-term deliverables before the June 18th full-day strategy session.`,S=[{id:"jun15",date:"2026-06-15",title:"Methods + Imputation Discussion",subtitle:"MMA & Third Horizon Strategies",attendees:"Peter Schultz, Chris Kalvig, Jeremy Matson, David Smith, Bobby, Andy",summary:k,notes:v,recordingUrl:null,timestamps:[]},{id:"jun18",date:"2026-06-18",title:"Full Day Strategy Meeting",subtitle:"MMA & Third Horizon Strategies",attendees:"Peter Schultz, Chris Kalvig, Jeremy Matson, Chris Hart, David Smith, Tanner Johnson",summary:j,notes:N,recordingUrl:"https://mma-video-proxy.vercel.app/mma-june-18.mp4",timestamps:[{time:"0:10:31",label:"Meeting kickoff with Rick"},{time:"0:40:43",label:"AI and machine capabilities discussion"},{time:"0:48:54",label:"Data schemas and carrier updates"},{time:"0:52:56",label:"GitHub repository and database architecture"},{time:"0:57:05",label:"Carrier networks and BCBS demo"},{time:"1:11:32",label:"Back office tooling and UI discussion"},{time:"1:36:02",label:"Strategic narrative and platform evolution"},{time:"1:52:27",label:"RAG architecture whiteboard session"},{time:"1:58:35",label:"LendWork platform demo"},{time:"3:07:17",label:"Data flows and imputation discussion"},{time:"3:37:00",label:"Provider analytics and episode review"},{time:"3:53:32",label:"Future design and benefits strategy"},{time:"4:44:01",label:"IT infrastructure and compute decisions"},{time:"5:55:29",label:"Wrap-up and next steps planning"}]}];function A(){const[a,n]=m.useState([]),[i,t]=m.useState(!0),[l,x]=m.useState("regular"),[g,s]=m.useState(null),[o,d]=m.useState(null);if(m.useEffect(()=>{async function r(){t(!0);const{data:c,error:y}=await b.from("call_notes").select("*").order("meeting_date",{ascending:!1}).limit(60);c&&!y&&(n(c),c.length>0&&d(c[0].synced_at)),t(!1)}r()},[]),l==="quarterly")return e.jsxs("div",{className:"flex h-screen flex-col bg-[#f5f6f8]",children:[e.jsxs("div",{className:"border-b border-gray-200 bg-white px-6 py-4",children:[e.jsx("h1",{className:"text-lg font-bold text-[#224057]",children:"Meeting Notes"}),e.jsx("p",{className:"text-xs text-gray-400 mt-0.5",children:"Quarterly Strategy · THS–MMA engagement"})]}),e.jsx("div",{className:"border-b border-gray-200 bg-[#f5f6f8] px-6 py-3",children:e.jsx("nav",{className:"flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit",children:[["regular","Regular Meetings"],["quarterly","Quarterly Strategy"]].map(([r,c])=>e.jsx("button",{onClick:()=>{x(r),s(null)},className:`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${l===r?"bg-white text-[#224057] shadow-sm":"text-[#224057]/60 hover:text-[#224057]"}`,children:c},r))})}),e.jsx(M,{})]});const p=a.filter(r=>r.summary_markdown),h=a.filter(r=>!r.summary_markdown);return e.jsxs("div",{className:"flex h-screen flex-col bg-[#f5f6f8]",children:[e.jsxs("div",{className:"border-b border-gray-200 bg-white px-6 py-4",children:[e.jsx("h1",{className:"text-lg font-bold text-[#224057]",children:"Meeting Notes"}),e.jsxs("p",{className:"text-xs text-gray-400 mt-0.5",children:["Granola-powered · MMA meetings",o&&e.jsxs(e.Fragment,{children:[" · Synced ",new Date(o).toLocaleDateString()]})]})]}),e.jsx("div",{className:"border-b border-gray-200 bg-[#f5f6f8] px-6 py-3",children:e.jsx("nav",{className:"flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit",children:[["regular","Regular Meetings"],["quarterly","Quarterly Strategy"]].map(([r,c])=>e.jsx("button",{onClick:()=>{x(r),s(null)},className:`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${l===r?"bg-white text-[#224057] shadow-sm":"text-[#224057]/60 hover:text-[#224057]"}`,children:c},r))})}),e.jsx("div",{className:"flex-1 overflow-y-auto px-6 py-6",children:i?e.jsx("div",{className:"flex items-center justify-center h-40 text-gray-400 text-sm",children:"Loading meeting notes..."}):a.length===0?e.jsx("div",{className:"flex items-center justify-center h-40 text-gray-400 text-sm",children:"No meetings found."}):e.jsxs("div",{className:"space-y-3 max-w-4xl",children:[p.map(r=>e.jsx(u,{note:r,expanded:g===r.id,onToggle:()=>s(g===r.id?null:r.id)},r.id)),h.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"pt-4 pb-1",children:e.jsxs("p",{className:"text-xs font-semibold text-gray-400 uppercase tracking-wide",children:["Meetings without Granola notes (",h.length,")"]})}),h.map(r=>e.jsx(u,{note:r,expanded:!1,onToggle:()=>{}},r.id))]})]})})]})}function M(){const[a,n]=m.useState(null),[i,t]=m.useState("summary");if(!a)return e.jsx("div",{className:"flex-1 overflow-y-auto px-6 py-6",children:e.jsx("div",{className:"max-w-4xl space-y-3",children:S.map(s=>{const o=new Date(s.date+"T12:00:00Z");return e.jsxs("button",{onClick:()=>{n(s),t("summary")},className:"w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#224057]/20 transition-all px-5 py-4 flex items-start gap-4",children:[e.jsxs("div",{className:"flex-shrink-0 w-20 text-center",children:[e.jsx("div",{className:"text-xs font-semibold text-gray-400 uppercase tracking-wide",children:o.toLocaleDateString("en-US",{weekday:"short"})}),e.jsx("div",{className:"text-2xl font-bold text-[#224057] leading-none mt-0.5",children:o.toLocaleDateString("en-US",{day:"numeric"})}),e.jsx("div",{className:"text-xs text-gray-400 mt-0.5",children:o.toLocaleDateString("en-US",{month:"short"})})]}),e.jsx("div",{className:"w-px self-stretch bg-gray-100 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mb-1",children:[e.jsx("span",{className:"font-semibold text-[#224057] text-sm",children:s.title}),e.jsx("span",{className:"rounded-full bg-[#224057]/10 border border-[#224057]/20 px-2 py-0.5 text-[10px] font-semibold text-[#224057]",children:"Quarterly"})]}),e.jsx("div",{className:"text-xs text-gray-400 mb-1",children:s.subtitle}),e.jsxs("p",{className:"text-xs text-gray-500 line-clamp-2",children:[s.summary.substring(0,180),"..."]})]}),e.jsx("div",{className:"flex-shrink-0 text-gray-300 mt-1",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 16 16",fill:"none",children:e.jsx("path",{d:"M6 4l4 4-4 4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})})]},s.id)})})});const l=[{id:"summary",label:"Executive Summary"},{id:"recording",label:"Recording(s)"},{id:"notes",label:"Detailed Notes"},{id:"materials",label:"Companion Materials"}],g=new Date(a.date+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"border-b border-gray-200 bg-[#f5f6f8] px-6 py-3 flex items-center gap-3",children:[e.jsxs("button",{onClick:()=>n(null),className:"flex items-center gap-1.5 text-xs text-[#224057]/60 hover:text-[#224057] transition-colors",children:[e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:e.jsx("path",{d:"M9 11L5 7l4-4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})}),"All Quarterly Meetings"]}),e.jsx("span",{className:"text-gray-300",children:"·"}),e.jsx("span",{className:"text-xs text-[#224057] font-medium",children:a.title}),e.jsxs("span",{className:"text-xs text-gray-400",children:["· ",g]})]}),e.jsx("div",{className:"border-b border-gray-200 bg-[#f5f6f8] px-6 py-3",children:e.jsx("nav",{className:"flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit",children:l.map(s=>e.jsx("button",{onClick:()=>t(s.id),className:`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${i===s.id?"bg-white text-[#224057] shadow-sm":"text-[#224057]/60 hover:text-[#224057]"}`,children:s.label},s.id))})}),e.jsx("div",{className:"flex-1 overflow-y-auto px-6 py-6",children:e.jsxs("div",{className:"max-w-4xl",children:[i==="summary"&&e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm p-6",children:[e.jsx("h2",{className:"text-sm font-bold text-[#224057] mb-4",children:"Executive Summary"}),a.summary.split(`

`).map((s,o)=>e.jsx("p",{className:"text-sm text-gray-700 leading-relaxed mb-3",children:s},o))]}),i==="recording"&&(a.recordingUrl?e.jsxs("div",{className:"flex gap-6 items-start",children:[e.jsx("div",{className:"flex-1 bg-black rounded-xl overflow-hidden shadow-sm",children:e.jsx("video",{ref:s=>{s&&(window._mmaVideo=s)},controls:!0,className:"w-full",src:a.recordingUrl})}),a.timestamps.length>0&&e.jsxs("div",{className:"w-64 flex-shrink-0 pt-1",children:[e.jsx("p",{className:"text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3",children:"Key Moments"}),e.jsx("div",{className:"space-y-3",children:a.timestamps.map((s,o)=>{const d=s.time.split(":").map(Number),p=d.length===3?d[0]*3600+d[1]*60+d[2]:d[0]*60+d[1];return e.jsxs("button",{onClick:()=>{const h=window._mmaVideo;h&&(h.currentTime=p,h.play())},className:"flex gap-3 items-start w-full text-left hover:bg-gray-50 rounded px-1 py-0.5 group transition-colors",children:[e.jsx("span",{className:"text-xs font-mono text-[#224057] font-semibold flex-shrink-0 w-14 text-right tabular-nums group-hover:text-blue-600",children:s.time}),e.jsx("span",{className:"text-xs text-gray-600 leading-snug group-hover:text-gray-900",children:s.label})]},o)})})]})]}):e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center",children:[e.jsx("div",{className:"w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3",children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",children:e.jsx("path",{d:"M6 4l10 6-10 6V4z",fill:"#cbd5e1"})})}),e.jsx("p",{className:"text-sm font-medium text-gray-500",children:"Recording pending"}),e.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Provide the Zoom recording URL to embed here"})]})),i==="notes"&&e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm p-6",children:[e.jsx("h2",{className:"text-sm font-bold text-[#224057] mb-4",children:"Detailed Notes"}),e.jsx(f,{md:a.notes})]}),i==="materials"&&e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center",children:[e.jsx("div",{className:"w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",children:[e.jsx("path",{d:"M4 4h8l4 4v8H4V4z",stroke:"#cbd5e1",strokeWidth:"1.5",strokeLinejoin:"round"}),e.jsx("path",{d:"M12 4v4h4",stroke:"#cbd5e1",strokeWidth:"1.5",strokeLinejoin:"round"})]})}),e.jsx("p",{className:"text-sm font-medium text-gray-500",children:"No materials attached"}),e.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Decks, briefs, and working docs will appear here"})]})]})})]})}export{A as CallNotesView};
