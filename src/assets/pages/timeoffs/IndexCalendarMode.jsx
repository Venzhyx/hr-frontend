import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX,
  HiOutlineCalendar, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlineUserGroup, HiOutlineFlag, HiOutlineOfficeBuilding,
  HiOutlinePlus,
} from "react-icons/hi";
import { useTimeOff }       from "../../../redux/hooks/useTimeOff";
import { useCalendarEvent } from "../../../redux/hooks/useCalendarEvent";

const TODAY       = new Date();
const DAYS_AVAIL  = 90;
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const STATUS_PILL = {
  SUBMITTED: { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",   dot: "bg-amber-400",   label: "Pending"  },
  APPROVED:  { bg: "bg-indigo-50",  text: "text-indigo-800",  border: "border-indigo-200",  dot: "bg-indigo-500",  label: "Approved" },
  REJECTED:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     label: "Rejected" },
};

// National Holiday  → orange (beda dari rose/red)
// Collective Leave  → emerald (beda dari teal/indigo)
const EVENT_PILL = {
  NATIONAL_HOLIDAY:     { bg: "bg-orange-50",  text: "text-orange-800",  border: "border-orange-200",  dot: "bg-orange-500",  label: "National Holiday" },
  COLLECTIVE_LEAVE_DAY: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500", label: "Collective Leave" },
};

// Legend — 5 warna semua berbeda
const LEGEND_ITEMS = [
  { dot: "bg-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-100",  text: "text-indigo-700",  label: "Approved"         },
  { dot: "bg-amber-400",   bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-700",   label: "Pending"          },
  { dot: "bg-red-500",     bg: "bg-red-50",      border: "border-red-100",     text: "text-red-700",     label: "Rejected"         },
  { dot: "bg-orange-500",  bg: "bg-orange-50",   border: "border-orange-100",  text: "text-orange-700",  label: "National Holiday" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50",  border: "border-emerald-100", text: "text-emerald-700", label: "Collective Leave" },
];

const SIDE_CARDS = [
  { key:"available",  Icon: HiOutlineCalendar,   iconBg: "bg-indigo-100",  iconColor: "text-indigo-600",  cardBg: "bg-indigo-50/60",  border: "border-indigo-100"  },
  { key:"pending",    Icon: HiOutlineClock,       iconBg: "bg-amber-100",   iconColor: "text-amber-600",   cardBg: "bg-amber-50/60",   border: "border-amber-100"   },
  { key:"booked",     Icon: HiOutlineCheckCircle, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", cardBg: "bg-emerald-50/60", border: "border-emerald-100" },
  { key:"collective", Icon: HiOutlineUserGroup,   iconBg: "bg-orange-100",  iconColor: "text-orange-600",  cardBg: "bg-orange-50/60",  border: "border-orange-100"  },
  { key:"national",   Icon: HiOutlineFlag,        iconBg: "bg-red-100",     iconColor: "text-red-600",     cardBg: "bg-red-50/60",     border: "border-red-100"     },
];

const isoDate = (d) => {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), dd=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
};
const dateRange = (start, end) => {
  const dates=[], cur=new Date(start+"T00:00:00"), fin=new Date(end+"T00:00:00");
  while(cur<=fin){dates.push(isoDate(cur));cur.setDate(cur.getDate()+1);}
  return dates;
};
const fmtFull  = (d) => d ? new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : "—";
const fmtShort = (d) => d ? new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) : "—";

/* ─────────────────────────────────────────
   DAY POPUP
───────────────────────────────────────── */
const DayPopup = ({ date, items, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden" onClick={e=>e.stopPropagation()}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-sm font-bold text-gray-800">{fmtFull(date)}</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors">
          <HiOutlineX className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
        {items.map((item, i) => {
          const isEvent = item._type==="event";
          const cfg     = isEvent ? EVENT_PILL[item.eventType] : STATUS_PILL[item.status];
          const name    = isEvent ? item.eventName : item.employeeName;
          const sub     = isEvent ? cfg?.label : `${item.timeOffTypeName||"Time Off"} · ${cfg?.label}`;
          if (!cfg) return null;
          return (
            <div key={i} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${cfg.text}`}>{name}</p>
                <p className={`text-xs mt-0.5 opacity-60 ${cfg.text}`}>{sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MONTH VIEW
───────────────────────────────────────── */
const MonthView = ({ year, month, eventMap, onDayClick }) => {
  const firstDayRaw = new Date(year,month,1).getDay();
  const firstDay    = firstDayRaw===0?6:firstDayRaw-1;
  const daysInMonth = new Date(year,month+1,0).getDate();
  const prevDays    = new Date(year,month,0).getDate();
  const todayStr    = isoDate(TODAY);
  const cells       = [];
  for(let i=firstDay-1;i>=0;i--) cells.push({day:prevDays-i,cur:false,dateStr:null});
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({day:d,cur:true,dateStr});
  }
  while(cells.length%7!==0) cells.push({day:cells.length-firstDay-daysInMonth+1,cur:false,dateStr:null});

  const groupItems = (items) => {
    const g={};
    items.forEach(item=>{
      const key=item._type==="event"?(EVENT_PILL[item.eventType]?.label||item.eventName):(item.timeOffTypeName||"Time Off");
      const statusKey=item._type==="event"?item.eventType:item.status;
      const mapKey=`${key}__${statusKey}`;
      if(!g[mapKey]) g[mapKey]={key,statusKey,items:[],sample:item};
      g[mapKey].items.push(item);
    });
    return Object.values(g);
  };

  const totalRows = cells.length / 7;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm h-full flex flex-col">
      {/* Day name header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        {DAY_NAMES.map((d,i)=>(
          <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wide ${i>=5?"text-gray-300":"text-gray-500"}`}>{d}</div>
        ))}
      </div>
      {/* Cells — flex-grow agar mengisi sisa tinggi */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${totalRows}, 1fr)` }}>
        {cells.map((cell,idx)=>{
          const items=cell.dateStr?(eventMap[cell.dateStr]||[]):[];
          const groups=groupItems(items);
          const isToday=cell.dateStr===todayStr;
          const weekend=idx%7>=5;
          const clickable=cell.cur&&items.length>0;
          return (
            <div key={idx} onClick={()=>clickable&&onDayClick(cell.dateStr,items)}
              className={`border-b border-r border-gray-100 p-1.5 transition-colors flex flex-col
                ${!cell.cur?"bg-gray-50/60":weekend?"bg-gray-50/20":"bg-white"}
                ${isToday?"ring-1 ring-inset ring-indigo-300 bg-indigo-50/20":""}
                ${clickable?"cursor-pointer hover:bg-indigo-50/30":""}`}>
              <div className="mb-1 flex-shrink-0">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-medium
                  ${isToday?"bg-indigo-600 text-white font-bold":cell.cur?(weekend?"text-gray-300":"text-gray-600"):"text-gray-200"}`}>
                  {cell.day}
                </span>
              </div>
              <div className="space-y-0.5 flex-1 overflow-hidden">
                {groups.slice(0,2).map((g,gi)=>{
                  const cfg=g.sample._type==="event"?EVENT_PILL[g.sample.eventType]:STATUS_PILL[g.sample.status];
                  if(!cfg) return null;
                  return (
                    <div key={gi} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="truncate leading-tight">{g.key}</span>
                      {g.items.length>1&&<span className="ml-auto flex-shrink-0 font-bold opacity-50">{g.items.length}</span>}
                    </div>
                  );
                })}
                {groups.length>2&&<p className="text-[9px] text-gray-400 px-1.5">+{groups.length-2} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   WEEK VIEW
───────────────────────────────────────── */
const WeekView = ({ curDate, eventMap, onDayClick, onDayNav }) => {
  const dow=curDate.getDay();
  const monday=new Date(curDate);
  monday.setDate(curDate.getDate()-(dow===0?6:dow-1));
  const todayStr=isoDate(TODAY);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm h-full flex flex-col">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        {days.map((d,i)=>{
          const ds=isoDate(d);const isToday=ds===todayStr;const weekend=i>=5;
          return (
            <div key={i} onClick={()=>onDayNav(d)} className={`py-3 text-center cursor-pointer hover:bg-indigo-50/40 transition-colors ${weekend?"opacity-40":""}`}>
              <p className={`text-xs font-semibold mb-1 ${isToday?"text-indigo-600":"text-gray-400"}`}>{DAY_NAMES[i]}</p>
              <span className={`inline-flex items-center justify-center w-8 h-8 text-sm rounded-full font-bold mx-auto ${isToday?"bg-indigo-600 text-white shadow-md":"text-gray-700 hover:bg-indigo-100"}`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 divide-x divide-gray-100 flex-1">
        {days.map((d,i)=>{
          const ds=isoDate(d);const items=eventMap[ds]||[];const isToday=ds===todayStr;const weekend=i>=5;
          return (
            <div key={i} onClick={()=>items.length>0&&onDayClick(ds,items)}
              className={`p-2 transition-colors ${isToday?"bg-indigo-50/20":weekend?"bg-gray-50/40":"bg-white"} ${items.length>0?"cursor-pointer hover:bg-indigo-50/30":""}`}>
              {items.length===0?<p className="text-[10px] text-gray-200 text-center mt-6">—</p>:(
                <div className="space-y-1">
                  {items.map((item,ii)=>{
                    const isEv=item._type==="event";
                    const cfg=isEv?EVENT_PILL[item.eventType]:STATUS_PILL[item.status];
                    if(!cfg) return null;
                    return (
                      <div key={ii} className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <div className="flex items-center gap-1 mb-0.5"><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} /><span className="truncate">{isEv?item.eventName:item.employeeName}</span></div>
                        <p className="text-[9px] opacity-60 truncate pl-2.5">{isEv?cfg.label:item.timeOffTypeName||"Time Off"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   DAY VIEW
───────────────────────────────────────── */
const DayView = ({ curDate, eventMap }) => {
  const ds=isoDate(curDate);const items=eventMap[ds]||[];const isToday=ds===isoDate(TODAY);
  const dayName=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][curDate.getDay()];
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm h-full flex flex-col">
      <div className={`px-6 py-5 border-b border-gray-100 flex items-center gap-4 flex-shrink-0 ${isToday?"bg-indigo-50/40":"bg-gray-50"}`}>
        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl shadow-sm ${isToday?"bg-indigo-600 text-white":"bg-white border border-gray-200 text-gray-700"}`}>
          <span className="text-xs font-semibold uppercase opacity-70">{dayName.slice(0,3)}</span>
          <span className="text-2xl font-bold leading-none">{curDate.getDate()}</span>
        </div>
        <div>
          <p className="text-base font-bold text-gray-800">{dayName}, {curDate.getDate()} {MONTH_NAMES[curDate.getMonth()]} {curDate.getFullYear()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{items.length===0?"No events today":`${items.length} event${items.length>1?"s":""}`}</p>
        </div>
      </div>
      <div className="px-6 py-4 flex-1 overflow-y-auto">
        {items.length===0?(
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <HiOutlineCalendar className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">No events on this day</p>
          </div>
        ):(
          <div className="space-y-2">
            {items.map((item,i)=>{
              const isEv=item._type==="event";
              const cfg=isEv?EVENT_PILL[item.eventType]:STATUS_PILL[item.status];
              if(!cfg) return null;
              return (
                <div key={i} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${cfg.text}`}>{isEv?item.eventName:item.employeeName}</p>
                    <p className={`text-xs mt-0.5 opacity-60 ${cfg.text}`}>{isEv?cfg.label:`${item.timeOffTypeName||"Time Off"} · ${cfg.label}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SIDE CARD
───────────────────────────────────────── */
const SideCard = ({ Icon, iconBg, iconColor, cardBg, border, value, label, desc, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl border ${cardBg} ${border} ${onClick?"cursor-pointer hover:shadow-sm transition-all":""}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-gray-800 leading-snug">
        <span className="text-lg font-bold">{value}</span>{" "}
        <span className="font-semibold text-gray-700 text-xs">{label}</span>
      </p>
      <p className="text-[10px] text-gray-400 truncate">{desc}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const TimeOffCalendarPage = () => {
  const navigate = useNavigate();
  const { timeOffRequests, fetchTimeOffRequests } = useTimeOff();
  const { events: calEvents, fetchEvents }        = useCalendarEvent();

  const [view,     setView]     = useState("Month");
  const [curDate,  setCurDate]  = useState(new Date(TODAY));
  const [curMonth, setCurMonth] = useState(TODAY.getMonth());
  const [curYear,  setCurYear]  = useState(TODAY.getFullYear());
  const [popup,    setPopup]    = useState(null);

  // Refs untuk mengukur tinggi sidebar agar kalender menyamakan
  const sidebarRef  = useRef(null);
  const [calHeight, setCalHeight] = useState(null);

  useEffect(() => { fetchTimeOffRequests(); fetchEvents(); }, []);

  // Setelah render, ukur tinggi sidebar → pakai untuk tinggi kalender
  useEffect(() => {
    const measure = () => {
      if (sidebarRef.current) {
        setCalHeight(sidebarRef.current.scrollHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const todayStr       = isoDate(TODAY);
  const pending        = (timeOffRequests||[]).filter(r=>r.status==="SUBMITTED").length;
  const booked         = (timeOffRequests||[]).filter(r=>r.status==="APPROVED").reduce((s,r)=>s+(r.requested||0),0);
  const collective     = (calEvents||[]).filter(e=>e.eventType==="COLLECTIVE_LEAVE_DAY");
  const national       = (calEvents||[]).filter(e=>e.eventType==="NATIONAL_HOLIDAY");
  const collectiveLeft = collective.filter(e=>e.eventDate>=todayStr).length;

  const eventMap={};
  const add=(d,item)=>{if(!eventMap[d])eventMap[d]=[];eventMap[d].push(item);};
  (timeOffRequests||[]).forEach(r=>{if(r.startDate&&r.endDate)dateRange(r.startDate,r.endDate).forEach(d=>add(d,{...r,_type:"timeoff"}));});
  (calEvents||[]).forEach(e=>{if(e.eventDate)add(e.eventDate,{...e,_type:"event"});});

  const goToday=()=>{const t=new Date(TODAY);setCurDate(t);setCurMonth(t.getMonth());setCurYear(t.getFullYear());};
  const prev=()=>{
    if(view==="Month"){if(curMonth===0){setCurMonth(11);setCurYear(y=>y-1);}else setCurMonth(m=>m-1);}
    else if(view==="Week"){const d=new Date(curDate);d.setDate(d.getDate()-7);setCurDate(d);setCurMonth(d.getMonth());setCurYear(d.getFullYear());}
    else{const d=new Date(curDate);d.setDate(d.getDate()-1);setCurDate(d);setCurMonth(d.getMonth());setCurYear(d.getFullYear());}
  };
  const next=()=>{
    if(view==="Month"){if(curMonth===11){setCurMonth(0);setCurYear(y=>y+1);}else setCurMonth(m=>m+1);}
    else if(view==="Week"){const d=new Date(curDate);d.setDate(d.getDate()+7);setCurDate(d);setCurMonth(d.getMonth());setCurYear(d.getFullYear());}
    else{const d=new Date(curDate);d.setDate(d.getDate()+1);setCurDate(d);setCurMonth(d.getMonth());setCurYear(d.getFullYear());}
  };
  const headerTitle=()=>{
    if(view==="Month") return `${MONTH_NAMES[curMonth]} ${curYear}`;
    if(view==="Day")   return `${curDate.getDate()} ${MONTH_NAMES[curDate.getMonth()]} ${curDate.getFullYear()}`;
    const dow=curDate.getDay();const monday=new Date(curDate);monday.setDate(curDate.getDate()-(dow===0?6:dow-1));
    const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
    if(monday.getMonth()===sunday.getMonth()) return `${monday.getDate()}–${sunday.getDate()} ${MONTH_NAMES[monday.getMonth()]} ${monday.getFullYear()}`;
    return `${monday.getDate()} ${MONTH_NAMES[monday.getMonth()]} – ${sunday.getDate()} ${MONTH_NAMES[sunday.getMonth()]} ${sunday.getFullYear()}`;
  };

  const upcomingHolidays=[
    ...national.map(e=>({...e,_eType:"national"})),
    ...collective.map(e=>({...e,_eType:"collective"})),
  ].filter(e=>e.eventDate>=todayStr).sort((a,b)=>a.eventDate.localeCompare(b.eventDate)).slice(0,5);

  const cardData=[
    {...SIDE_CARDS[0], value:DAYS_AVAIL,     label:"days available",    desc:"Paid time off to book",                              onClick:undefined},
    {...SIDE_CARDS[1], value:pending,         label:"pending approval",  desc:"Awaiting manager review",                            onClick:pending>0?()=>navigate("/approvals/timeoff"):undefined},
    {...SIDE_CARDS[2], value:booked,          label:"days booked",       desc:"Total approved leave",                               onClick:undefined},
    {...SIDE_CARDS[3], value:collectiveLeft,  label:"collective leave",  desc:`${collective.length-collectiveLeft} already passed`, onClick:undefined},
    {...SIDE_CARDS[4], value:national.length, label:"national holidays", desc:"This year",                                         onClick:undefined},
  ];

  return (
    <div className="w-full px-4 md:px-5 py-3">
      {/*
        Wrapper utama: flex row, tidak lagi full-viewport-height.
        Sidebar menentukan tinggi alami, kalender menyesuaikan.
      */}
      <div className="flex gap-4 items-start">

        {/* ── SIDEBAR ── */}
        <div ref={sidebarRef} className="w-56 flex-shrink-0 flex flex-col gap-2 pb-2 pr-0.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your time off</p>

          <div className="space-y-1.5">
            {cardData.map((c,i)=><SideCard key={i} {...c} />)}
          </div>

          {/* Upcoming holidays */}
          {upcomingHolidays.length>0&&(
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <HiOutlineOfficeBuilding className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upcoming</p>
              </div>
              <div className="space-y-2">
                {upcomingHolidays.map(e=>(
                  <div key={e.id} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${e._eType==="national"?"bg-orange-500":"bg-emerald-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-700 leading-snug truncate">{e.eventName}</p>
                      <p className="text-[10px] text-gray-400">{fmtShort(e.eventDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend card — 5 warna semua beda */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-3 h-3 rounded-sm bg-indigo-200" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Legend</p>
            </div>
            <div className="space-y-1.5">
              {LEGEND_ITEMS.map(l=>(
                <div key={l.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${l.bg} ${l.border}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
                  <span className={`text-[11px] font-semibold ${l.text}`}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CALENDAR AREA ── */}
        {/*
          Tinggi kalender = tinggi sidebar yang sudah diukur via ref.
          Kalender tidak akan berubah ukuran — ia fixed ke tinggi sidebar.
        */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={calHeight ? { height: calHeight } : { minHeight: 600 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button onClick={goToday}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 bg-white shadow-sm">
                Today
              </button>
              <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <HiOutlineChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <HiOutlineChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <h2 className="text-sm font-bold text-gray-800">{headerTitle()}</h2>

            <div className="flex items-center gap-2">
              {/* ── TOMBOL ADD — diperbesar & lebih bold ── */}
              <button
                onClick={()=>navigate("/time-off/add")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add Time Off
              </button>

              {/* View switcher */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {["Day","Week","Month"].map(v=>(
                  <button key={v} onClick={()=>setView(v)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${view===v?"bg-white shadow-sm text-indigo-600":"text-gray-400 hover:text-gray-600"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View content — flex-1 agar mengisi sisa tinggi calendar area */}
          <div className="flex-1 min-h-0">
            {view==="Month"&&(
              <MonthView
                year={curYear}
                month={curMonth}
                eventMap={eventMap}
                onDayClick={(date,items)=>setPopup({date,items})}
              />
            )}
            {view==="Week"&&(
              <WeekView
                curDate={curDate}
                eventMap={eventMap}
                onDayClick={(date,items)=>setPopup({date,items})}
                onDayNav={d=>{setCurDate(d);setView("Day");}}
              />
            )}
            {view==="Day"&&(
              <DayView
                curDate={curDate}
                eventMap={eventMap}
              />
            )}
          </div>
        </div>
      </div>

      {popup&&<DayPopup date={popup.date} items={popup.items} onClose={()=>setPopup(null)} />}
    </div>
  );
};

export default TimeOffCalendarPage;
