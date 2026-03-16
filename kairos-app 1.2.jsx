import React, { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
const SC = {}; // Removed demo data

// No fixed session playlist — journeys drive what’s read

function getPassKey(b){ return b.toLowerCase().replace(/\s+/g,''); }
function jBook(b){ return b === "Song of Solomon" ? "Solomon's Song" : b; }

const OT=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"];
const NTB=["Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
const BIBLE_BOOKS = [...OT, ...NTB];
const BIBLE_CHAPS = {
  "Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,"Joshua":24,"Judges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,"1 Chronicles":29,"2 Chronicles":36,"Ezra":10,"Nehemiah":13,"Esther":10,"Job":42,"Psalms":150,"Proverbs":31,"Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,"Jeremiah":52,"Lamentations":5,"Ezekiel":48,"Daniel":12,"Hosea":14,"Joel":3,"Amos":9,"Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,"Habakkuk":3,"Zephaniah":3,"Haggai":2,"Zechariah":14,"Malachi":4,
  "Matthew":28,"Mark":16,"Luke":24,"John":21,"Acts":28,"Romans":16,"1 Corinthians":16,"2 Corinthians":13,"Galatians":6,"Ephesians":6,"Philippians":4,"Colossians":4,"1 Thessalonians":5,"2 Thessalonians":3,"1 Timothy":6,"2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,"James":5,"1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,"Jude":1,"Revelation":22
};

function calculateJourneyProgress(aj, liveBook, liveChapter) {
  if (!aj) return 0;
  const books = journeyBooks(aj.id);
  if (!books.length) return 0;
  let totalChaps = 0;
  let completedChaps = 0;

  const currentB = liveBook || aj.currentBook;
  const currentC = liveChapter !== undefined ? liveChapter : aj.currentChapter;

  const bIdx = books.indexOf(currentB);

  books.forEach(b => {
    const chaps = BIBLE_CHAPS[b] || 1;
    totalChaps += chaps;
    const thisBIdx = books.indexOf(b);
    if (thisBIdx < bIdx) {
      completedChaps += chaps;
    } else if (thisBIdx === bIdx) {
      completedChaps += (currentC - 1);
    }
  });
  return Math.min(Math.round((completedChaps / totalChaps) * 100), 100);
}

// ── JOURNEYS — the reading paths users can take ──
const JOURNEYS = [
  { id:"full-bible",     name:"From the Very Beginning",      sub:"Genesis to Revelation",  desc:"The complete story of God and humanity, from creation to new creation.",              cat:"Full Bible",    bookCount:66 },
  { id:"old-testament", name:"The Ancient Story",             sub:"Old Testament",           desc:"Law, history, poetry, and prophecy — the foundation of faith.",                    cat:"Testament",     bookCount:39 },
  { id:"new-testament", name:"The Fulfillment",               sub:"New Testament",           desc:"The life of Jesus and the birth of the Church.",                                   cat:"Testament",     bookCount:27 },
  { id:"pauls-letters", name:"Letters from the Road",         sub:"Paul's Letters",          desc:"Theology, correction, and encouragement from Paul’s missionary journey.",          cat:"Letters",       bookCount:13 },
  { id:"major-prophets",name:"The Great Voices",              sub:"Major Prophets",          desc:"Isaiah, Jeremiah, Lamentations, Ezekiel, and Daniel speak to a nation.",           cat:"Prophets",      bookCount:5  },
  { id:"minor-prophets",name:"Small Books, Big Words",        sub:"Minor Prophets",          desc:"Twelve prophets, one message: return to the Lord.",                                cat:"Prophets",      bookCount:12 },
  { id:"1-john",        name:"Walking in the Light",          sub:"1 John",                  desc:"Love, assurance, and abiding in Christ — five chapters that transform.",           cat:"Single Book",   bookCount:1  },
  { id:"ephesians",     name:"Seated in Heavenly Places",     sub:"Ephesians",               desc:"Grace, unity, spiritual warfare, and the armor of God.",                          cat:"Single Book",   bookCount:1  },
];

function journeyBooks(jId) {
  const PAUL = ["Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon"];
  const MAJ  = ["Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel"];
  const MIN  = ["Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"];
  switch(jId){
    case "full-bible":     return [...OT,...NTB];
    case "old-testament":  return [...OT];
    case "new-testament":  return [...NTB];
    case "pauls-letters":  return PAUL;
    case "major-prophets": return MAJ;
    case "minor-prophets": return MIN;
    case "1-john":         return ["1 John"];
    case "ephesians":      return ["Ephesians"];
    default:               return [...NTB];
  }
}
const READ_BK=new Set(["Genesis","Psalms","Proverbs","John","Romans","Ephesians","James","1 Peter"]);
const MILES=[
  {name:"First Kairos",desc:"Completed your first session",sym:"\u2726"},
  {name:"7 Days of Faithfulness",desc:"Seven sessions completed",sym:"\u25C8"},
  {name:"One Hour in the Word",desc:"60 cumulative minutes",sym:"\u25C7"},
  {name:"A Full Month",desc:"20+ sessions in a month",sym:"\u25A3"},
  {name:"Whole New Testament",desc:"All 27 books encountered",sym:"\u25B3"},
];
const WDAYS=["M","T","W","T","F","S","S"];
const HL_C={gold:"rgba(201,168,76,0.25)",blue:"rgba(120,160,190,0.25)",green:"rgba(130,170,130,0.25)",rose:"rgba(180,130,130,0.25)"};

// Map book names to available Scripture keys for Bible reader
const BOOK_TO_SC = {};
Object.values(SC).forEach(s => { if(!BOOK_TO_SC[s.book]) BOOK_TO_SC[s.book]=[]; BOOK_TO_SC[s.book].push(s.key); });

function formatRelativeTime(iso) {
  if (!iso) return "Not read yet";
  const sec = Math.floor((new Date() - new Date(iso)) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  if (sec < 172800) return "Yesterday";
  return new Date(iso).toLocaleDateString();
}

function greet(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}

// Icons
const IcoSun=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>;
const IcoBook=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
const IcoPath=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19l4-4 4 4 8-8"/><path d="M15 7h5v5"/></svg>;
const IcoMenu=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcoPlay=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1E"><path d="M8 5v14l11-7z"/></svg>;
const IcoPause=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1E"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
const IcoBack=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>;
const IcoPlaySm=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const IcoPauseSm=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
const IcoSkip=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 4l10 8-10 8z"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;
const IcoX=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevR=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;
const IcoChevL=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>;
const IcoNote=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>;
const IcoDice=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg>;

const S=`
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
:root{--bg:#131316;--bg2:#1C1C20;--bg3:#212126;--bg3h:#28282E;--bg4:#2A2A30;--t1:#F0EBE1;--t2:#8A8275;--t3:#5C5850;--gold:#C9A84C;--gd:rgba(201,168,76,0.15);--gg:rgba(201,168,76,0.08);--ser:'Lora', Georgia, serif;--san:'DM Sans',-apple-system,sans-serif;--r:14px;--rs:10px}
body{background:var(--bg);overflow-x:hidden}
.K{width:100%;max-width:430px;min-height:100vh;margin:0 auto;background:var(--bg);color:var(--t1);font-family:var(--san);display:flex;flex-direction:column;position:relative;overflow-x:hidden;padding-bottom:70px;scrollbar-width:none;-ms-overflow-style:none;}
.K ::-webkit-scrollbar{width:0;height:0}
.nav{position:fixed;bottom:0;left:0;right:0;max-width:430px;margin:0 auto;z-index:100;background:var(--bg2);border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-around;padding:8px 0 max(8px,env(safe-area-inset-bottom))}
.ni{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;color:var(--t3);font-family:var(--san);font-size:10px;font-weight:500;padding:4px 16px;cursor:pointer;transition:color .25s;letter-spacing:.3px}
.ni.a{color:var(--gold)}
.pg-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.pg{flex:1;padding:0 24px 24px;overflow-y:auto}
.pg.animate{animation:fu .35s ease}
@keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pop{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}

/* Onboarding */
.ob{position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;animation:fi .6s ease}
.ob-t{font-family:var(--ser);font-size:52px;font-weight:600;color:var(--t1);letter-spacing:-.5px}
.ob-s{font-family:var(--ser);font-size:19px;font-style:italic;color:var(--gold);margin-top:10px}
.ob-b{font-size:15px;color:var(--t2);line-height:1.7;text-align:center;max-width:320px;margin-top:24px}
.bg{background:var(--gold);color:#1A1A1E;border:none;border-radius:50px;padding:15px 48px;font-family:var(--san);font-size:16px;font-weight:600;cursor:pointer;margin-top:40px;letter-spacing:.3px}
.bg:active{transform:scale(.97)}
.bo{background:none;border:1px solid var(--t3);color:var(--t2);border-radius:50px;padding:13px 36px;font-family:var(--san);font-size:14px;font-weight:500;cursor:pointer;margin-top:12px}
.tp{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px}
.tp button{background:var(--bg3);border:1.5px solid var(--t3);border-radius:50px;padding:10px 22px;font-family:var(--san);font-size:15px;font-weight:500;color:var(--t2);cursor:pointer;transition:all .25s}
.tp button.sel{background:var(--gd);border-color:var(--gold);color:var(--gold)}
.mc{display:flex;flex-direction:column;gap:10px;width:100%;max-width:300px;margin-top:24px}
.mc>div{background:var(--bg3);border:1.5px solid transparent;border-radius:var(--rs);padding:16px 20px;cursor:pointer;text-align:left;transition:all .25s}
.mc>div.sel{border-color:var(--gold);background:var(--gd)}

/* Home */
.hg{font-family:var(--ser);font-size:22px;font-style:italic;color:var(--gold);padding-top:52px;margin-bottom:24px;opacity:0;animation:fu .6s ease .1s forwards}
.kc{background:var(--bg3);border-radius:20px;padding:32px 24px 24px;margin-top:20px;position:relative;overflow:hidden;opacity:0;animation:fu .5s ease .2s forwards;transition:transform .2s}
.kc:active{transform:scale(.97)}
.kc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gd),transparent)}
.kl{font-size:11px;font-weight:500;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase}
.kt{font-family:var(--ser);font-size:48px;font-weight:600;color:var(--t1);margin-top:2px;line-height:1.1;display:flex;align-items:baseline;gap:6px}
.kt span{font-size:20px;font-weight:400;color:var(--t2)}
.kp{font-size:13px;color:var(--t2);margin-top:8px;font-style:italic}
.kprog{height:3px;background:var(--bg);border-radius:3px;margin-top:14px;overflow:hidden}
.kprogf{height:100%;background:var(--gold);border-radius:3px;transition:width .5s}
.krem{font-size:12px;color:var(--t3);margin-top:6px;display:flex;align-items:center;gap:6px}
.kb{display:block;width:100%;background:var(--gold);color:#1A1A1E;border:none;border-radius:50px;padding:15px;font-family:var(--san);font-size:16px;font-weight:600;cursor:pointer;margin-top:16px;letter-spacing:.4px}
.kb:active{transform:scale(.97)}
.kb.dn{background:transparent;border:1.5px solid var(--gold);color:var(--gold)}
.rr{display:flex;justify-content:center;gap:12px;margin-top:24px;opacity:0;animation:fu .5s ease .35s forwards}
.rc{display:flex;flex-direction:column;align-items:center}
.rd{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--t3)}
.rd.f{background:var(--gold);border-color:var(--gold);box-shadow:0 0 8px rgba(201,168,76,.3)}
.rd.td{border-color:var(--gold)}
.rl{font-size:9px;color:var(--t3);margin-top:4px;letter-spacing:.5px}
.vd{margin-top:24px;padding:18px 20px;background:var(--gg);border-radius:var(--r);border-left:2px solid var(--gold);opacity:0;animation:fu .5s ease .5s forwards}
.vdt{font-family:var(--ser);font-size:15px;font-style:italic;color:var(--t1);line-height:1.6}
.vdr{font-size:11px;color:var(--gold);margin-top:6px;font-weight:500}

/* Session */
.ss{background:var(--bg);height:100vh;min-height:100vh;display:flex;flex-direction:column;animation:fi .4s ease;position:relative;overflow:hidden}
.sh{padding:48px 20px 8px;display:flex;align-items:center;justify-content:space-between}
.sba{background:none;border:none;color:var(--t2);font-size:14px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:var(--san)}
.sti{font-family:var(--ser);font-size:17px;font-weight:600;color:var(--t1)}
  .pdx{background:none;border:none;color:var(--t3);font-size:13px;font-family:var(--san);cursor:pointer;margin-top:10px;width:100%;padding:6px}
  
  /* Reader Top Bar */
  .rtb{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:180;background:var(--bg)}
  .rtb-row{padding:44px 18px 10px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.04)}
  .rtb-back{background:none;border:none;color:var(--t2);cursor:pointer;padding:6px;display:flex;align-items:center;border-radius:50%;transition:background .2s;flex-shrink:0}
  .rtb-back:active{background:var(--bg3)}
  .rtb-timer-label{font-size:9px;font-weight:700;letter-spacing:1.8px;color:var(--t3);text-transform:uppercase;margin-bottom:1px}
  .rtb-timer{font-family:var(--ser);font-size:21px;font-weight:600;color:var(--t1);line-height:1;letter-spacing:-.3px}
  .rtb-timer.bonus{color:var(--gold)}
  .rtb-goal{font-size:13px;color:var(--t3);margin-left:4px;font-family:var(--san)}
  .rtb-icon-btn{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);background:var(--bg3);color:var(--t2);font-size:18px;font-weight:300;flex-shrink:0;transition:all .2s}
  .rtb-icon-btn:active{transform:scale(0.93)}
  .rtb-icon-btn.plus{color:var(--gold);border-color:rgba(201,168,76,0.3);font-size:22px}
  /* Caret strip */
  .rtb-caret{height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);transition:background .2s}
  .rtb-caret:active{background:var(--bg3)}
  /* Slide-down settings panel */
  .rtb-panel{overflow:hidden;border-bottom:1px solid rgba(255,255,255,0.06);background:var(--bg2);padding:16px 20px 20px;animation:fu .2s ease}
  /* Add-time overlay */
  .add-time-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.6);animation:fi .2s ease}
  .add-time-popup{background:var(--bg2);border-radius:20px;padding:28px;width:100%;max-width:320px;border:1px solid rgba(255,255,255,0.08);animation:pop .25s ease;text-align:center}
  /* Kairos complete modal */
  .kc-modal-overlay{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.75);animation:fi .3s ease}
  .kc-modal{background:var(--bg2);border-radius:24px;padding:36px 28px 28px;width:100%;max-width:340px;border:1px solid rgba(201,168,76,0.18);box-shadow:0 0 80px rgba(201,168,76,0.08);animation:pop .3s ease;text-align:center}

.scr{flex:1;padding:100px 48px 140px;overflow-y:auto;position:relative}
.nav-arrow{position:absolute;top:50%;transform:translateY(-50%);background:var(--bg3);border:1px solid rgba(255,255,255,0.08);border-radius:50%;width:38px;height:38px;color:var(--t2);opacity:0.8;cursor:pointer;z-index:190;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.nav-arrow:active{transform:translateY(-50%) scale(0.95)}
.nav-arrow.left{left:5px}
.nav-arrow.right{right:5px}
.sv{margin-bottom:14px;line-height:1.85;cursor:pointer;border-radius:6px;padding:4px 6px;transition:background .2s;position:relative}
.sv:active{background:rgba(255,255,255,.03)}
.vn{font-family:var(--san);font-size:10px;font-weight:600;color:var(--t3);vertical-align:super;margin-right:3px}
.vt{font-family:var(--ser);font-size:20px;color:var(--t1);font-weight:400}
.sv.va .vt{color:var(--gold);transition:color .4s}
.v-note-dot{position:absolute;right:2px;top:6px;width:6px;height:6px;border-radius:50%;background:var(--gold);opacity:.5}

/* Audio bar */
.ac{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--bg2);border-top:1px solid rgba(255,255,255,.05);padding:14px 20px max(14px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:14px;backdrop-filter:blur(20px)}
.ppb{width:46px;height:46px;border-radius:50%;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ppb:active{transform:scale(.93)}
.aif{flex:1;min-width:0}
.ain{font-size:13px;color:var(--t1);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ais{font-size:11px;color:var(--t3)}
.spb{background:var(--bg3);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:5px 12px;font-family:var(--san);font-size:12px;font-weight:600;color:var(--t2);cursor:pointer;flex-shrink:0}
.apt{font-size:12px;color:var(--t3);font-variant-numeric:tabular-nums;flex-shrink:0}

/* Highlight + note toolbar */
.hlb{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:var(--r);padding:10px 14px;display:flex;gap:8px;align-items:center;z-index:150;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:fu .2s ease}
.hlc{width:26px;height:26px;border-radius:50%;border:2px solid transparent;cursor:pointer}
.hlc:active{transform:scale(1.15)}
.hldiv{width:1px;height:20px;background:rgba(255,255,255,.08)}
.hlnb{background:none;border:1px solid var(--t3);color:var(--t2);font-size:11px;font-family:var(--san);border-radius:50px;padding:5px 12px;cursor:pointer;display:flex;align-items:center;gap:4px}
.hlx{background:none;border:none;color:var(--t3);cursor:pointer;padding:2px;display:flex;align-items:center}

/* Note popup */
.note-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.note-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:calc(100% - 48px);max-width:380px;background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;z-index:201;animation:pop .25s ease;box-shadow:0 12px 40px rgba(0,0,0,.5)}
.note-popup h3{font-family:var(--ser);font-size:17px;font-weight:600;color:var(--t1);margin-bottom:4px}
.note-popup .np-ref{font-size:12px;color:var(--gold);margin-bottom:12px}
.note-popup textarea{width:100%;background:var(--bg3);border:1px solid rgba(255,255,255,.06);border-radius:var(--rs);padding:12px;font-family:var(--san);font-size:14px;color:var(--t1);resize:vertical;min-height:100px;outline:none}
.note-popup textarea:focus{border-color:var(--gold)}
.note-popup textarea::placeholder{color:var(--t3)}
.np-actions{display:flex;gap:8px;margin-top:12px;justify-content:flex-end}
.np-save{background:var(--gold);color:#1A1A1E;border:none;border-radius:50px;padding:8px 20px;font-family:var(--san);font-size:13px;font-weight:600;cursor:pointer}
.np-cancel{background:none;border:1px solid var(--t3);color:var(--t2);border-radius:50px;padding:8px 20px;font-family:var(--san);font-size:13px;cursor:pointer}
.np-close{position:absolute;top:12px;right:12px;background:none;border:none;color:var(--t3);cursor:pointer}
/* Journey completion modals */
.kc-modal-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fi 0.3s ease}
.kc-modal{width:calc(100% - 40px);max-width:380px;background:var(--bg2);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.6);animation:pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)}

/* Completion */
.cp{position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;animation:fi .6s ease;text-align:center}
.cpt{font-family:var(--ser);font-size:48px;font-weight:600;color:var(--t1)}
.cpu{font-family:var(--ser);font-size:18px;color:var(--t2);margin-top:2px}
.cpp{font-size:14px;color:var(--t2);margin-top:20px;font-style:italic}
.cpm{font-family:var(--ser);font-size:18px;font-style:italic;color:var(--gold);margin-top:28px;line-height:1.5}

/* Plans */
.pac{background:var(--gd);border:1px solid rgba(201,168,76,.2);border-radius:var(--r);padding:20px;margin-top:20px}
.pan{font-family:var(--ser);font-size:18px;font-weight:600;color:var(--t1)}
.pap{font-size:12px;color:var(--gold);margin-top:4px}
.prb{height:3px;background:var(--bg);border-radius:3px;margin-top:10px;overflow:hidden}
.prf{height:100%;background:var(--gold);border-radius:3px}
.pcs{display:flex;gap:8px;margin-top:24px;overflow-x:auto;padding-bottom:4px}
.pcb{white-space:nowrap;background:var(--bg3);border:1px solid rgba(255,255,255,.05);border-radius:50px;padding:8px 18px;font-size:13px;color:var(--t2);cursor:pointer;font-family:var(--san)}
.pcb.a{background:var(--gd);border-color:var(--gold);color:var(--gold)}
.plc{background:var(--bg3);border-radius:var(--r);padding:18px;margin-top:12px;cursor:pointer;border:1px solid transparent}
.plc:active{background:var(--bg3h)}
.pln{font-family:var(--ser);font-size:17px;font-weight:600;color:var(--t1)}
.pld{font-size:13px;color:var(--t2);margin-top:4px;line-height:1.5}
.plm{display:flex;gap:16px;margin-top:8px}
.plm span{font-size:11px;color:var(--t3)}
.pdo{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;animation:fi .2s}
.pds{width:100%;max-width:430px;background:var(--bg2);border-radius:20px 20px 0 0;padding:24px 24px max(24px,env(safe-area-inset-bottom));animation:su .3s ease}
.pds h2{font-family:var(--ser);font-size:22px;font-weight:600;color:var(--t1)}
.pds p{font-size:14px;color:var(--t2);margin-top:8px;line-height:1.6}
.pdm{display:flex;gap:20px;margin-top:16px}
.pdm span{font-size:12px;color:var(--t3)}
.pdbb{display:block;width:100%;background:var(--gold);color:#1A1A1E;border:none;border-radius:50px;padding:15px;font-family:var(--san);font-size:15px;font-weight:600;cursor:pointer;margin-top:20px}
.pdx{background:none;border:none;color:var(--t3);font-size:13px;font-family:var(--san);cursor:pointer;margin-top:10px;width:100%;padding:6px}

/* Bible */
.bsi{width:100%;background:var(--bg3);border:1px solid rgba(255,255,255,.05);border-radius:var(--rs);padding:12px 16px;font-family:var(--san);font-size:14px;color:var(--t1);margin-top:16px;outline:none}
.bsi:focus{border-color:var(--gold)}
.bsi::placeholder{color:var(--t3)}
.bst{font-size:11px;font-weight:600;color:var(--t3);letter-spacing:1.2px;text-transform:uppercase;margin-top:20px;margin-bottom:6px}
.bbk{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:15px;color:var(--t1);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:color .2s}
.bbk:active{color:var(--gold)}
.bbd{width:6px;height:6px;border-radius:50%;background:var(--gold);opacity:.6}
/* Bible reader header */
.br-hdr{display:flex;align-items:center;gap:10px;padding-top:48px;padding-bottom:12px}
.br-back{background:none;border:none;color:var(--t2);cursor:pointer;display:flex;align-items:center;font-family:var(--san);font-size:14px;gap:4px}
.br-title{font-family:var(--ser);font-size:20px;font-weight:600;color:var(--t1);flex:1}
.br-change{background:none;border:1px solid rgba(255,255,255,.08);border-radius:50px;padding:6px 14px;font-size:12px;color:var(--t2);cursor:pointer;font-family:var(--san)}

/* Menu */
.menu-item{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.03);cursor:pointer}
.menu-item:active{opacity:.7}
.mi-left{display:flex;flex-direction:column;gap:2px}
.mi-name{font-size:15px;font-weight:500;color:var(--t1)}
.mi-desc{font-size:12px;color:var(--t3)}

/* Journey */
.jsb{text-align:center;padding:28px 0 12px}
.jsn{font-family:var(--ser);font-size:44px;font-weight:600;color:var(--t1)}
.jsl{font-size:13px;color:var(--t3);margin-top:2px}
.jsr{display:flex;gap:12px;margin-top:16px}
.jsc{flex:1;background:var(--bg3);border-radius:var(--rs);padding:16px 12px;text-align:center}
.jscn{font-family:var(--ser);font-size:24px;font-weight:600;color:var(--gold)}
.jscl{font-size:11px;color:var(--t3);margin-top:2px}
.cg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:16px}
.cdd{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--t3)}
.cdd.ca{background:var(--gold);color:#1A1A1E;font-weight:600}
.cdd.ct{border:1px solid var(--gold)}
.sct{font-family:var(--ser);font-size:20px;font-weight:600;color:var(--t1);margin-top:28px;margin-bottom:4px}
.scs{font-size:12px;color:var(--t3);margin-bottom:12px}
.mli{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.mic{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.mic.e{background:var(--gd);color:var(--gold)}
.mic.l{background:var(--bg3);color:var(--t3)}
.mnn{font-size:14px;font-weight:600;color:var(--t1)}
.mnd{font-size:12px;color:var(--t2)}
.mel{font-size:10px;color:var(--gold);font-weight:600;letter-spacing:.5px;margin-left:auto;flex-shrink:0}

/* Stats */
.stat-row{display:flex;flex-direction:column;gap:8px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
.stat-info{display:flex;justify-content:space-between;align-items:center}
.stat-label{font-size:14px;color:var(--t1)}
.stat-val{font-family:var(--ser);font-size:16px;font-weight:600;color:var(--gold)}
.stat-bar-track{width:100%;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
.stat-bar-fill{height:100%;background:var(--gold);border-radius:3px;transition:width 0.6s ease-out}
.ptt{font-family:var(--ser);font-size:28px;font-weight:600;color:var(--t1);padding-top:52px}
.sub-back{display:flex;align-items:center;gap:6px;padding-top:52px;margin-bottom:4px;color:var(--t2);font-size:14px;cursor:pointer;background:none;border:none;font-family:var(--san)}
.efo-overlay{position:fixed;inset:0;z-index:210;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;animation:fi .3s ease}
.efo-popup{width:calc(100% - 48px);max-width:340px;background:var(--bg2);border-radius:20px;padding:24px;border:1px solid rgba(255,255,255,0.08);animation:pop .25s ease}
.efo-t{font-family:var(--ser);font-size:20px;font-weight:600;color:var(--t1);margin-bottom:8px;text-align:center}
.efo-s{font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:20px;text-align:center}
.efo-b{width:100%;background:var(--bg3);border:1px solid rgba(255,255,255,0.06);color:var(--t1);padding:14px;border-radius:var(--rs);margin-bottom:8px;font-family:var(--san);font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:all .2s;display:flex;justify-content:space-between;align-items:center}
.efo-b:active{background:var(--bg3h);transform:scale(0.98)}
.efo-b.p{background:var(--gold);color:#1A1A1E;border:none}
@keyframes popUp { 0%{opacity:0;transform:scale(0.9) translateY(20px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
@keyframes glowPulse { 0%{box-shadow:0 0 20px rgba(201,168,76,0.1)} 50%{box-shadow:0 0 50px rgba(201,168,76,0.25)} 100%{box-shadow:0 0 20px rgba(201,168,76,0.1)} }
@keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(400px) rotate(720deg);opacity:0} }
.confetti-bit { position:absolute; width:6px; height:6px; background:var(--gold); border-radius:1px; animation:confettiFall 3s linear forwards; pointer-events:none; z-index:1 }
.kc-modal-inner { position:relative; overflow:hidden; border:1px solid rgba(201,168,76,0.3) !important; animation:popUp 0.5s cubic-bezier(0.16, 1, 0.3, 1), glowPulse 4s infinite alternate !important; }
.kc-celebrate-icon { font-size:48px; margin-bottom:20px; animation:fu 0.8s ease backwards 0.2s; }
.kc-title-reveal { animation:fu 0.8s ease backwards 0.4s; }
.kc-desc-reveal { animation:fu 0.8s ease backwards 0.6s; }
.kc-btn-reveal { animation:fu 0.8s ease backwards 0.8s; }

/* Kairos Daily Card */
.kb-card{background:linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(201,168,76,0.04) 100%);border:1px solid rgba(201,168,76,0.18);border-radius:18px;padding:18px 20px 16px;margin:0 0 4px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;animation:fu .5s ease .15s both}
.kb-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)}
.kb-card:active{transform:scale(0.98)}
.kb-card-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);opacity:0.6;margin-bottom:10px}
.kb-main-row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-bottom:12px}
.kb-time-big{font-family:var(--ser);font-size:36px;font-weight:600;color:var(--t1);line-height:1;letter-spacing:-1px}
.kb-time-big span{font-size:16px;font-weight:400;color:var(--t2);margin-left:3px;letter-spacing:0}
.kb-right-col{text-align:right;padding-bottom:4px}
.kb-goal-line{font-size:12px;color:var(--t3);font-family:var(--san)}
.kb-complete-mark{font-size:13px;color:var(--gold);font-weight:700;letter-spacing:.5px}
.kb-track{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
.kb-fill{height:100%;background:linear-gradient(90deg,rgba(201,168,76,0.7),var(--gold));border-radius:3px;transition:width .8s cubic-bezier(0.4,0,0.2,1)}
.kb-sub{font-size:11px;color:var(--t3);margin-top:8px;font-style:italic}

/* Quick Jump Isolated Styles */
.qj-overlay {
  position: fixed;
  inset: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10,10,12,0.9);
  backdrop-filter: blur(12px);
  animation: fi 0.3s ease;
  padding: 24px;
}
.qj-modal {
  background: linear-gradient(180deg, var(--bg2), #151518);
  border-radius: 28px;
  padding: 36px 24px;
  width: 100%;
  max-width: 360px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05);
  animation: popUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
  position: relative;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.qj-btn {
  background: var(--bg3);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 14px 10px;
  font-family: var(--san);
  font-size: 13px;
  color: var(--t2);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.qj-btn.sel {
  background: var(--gd);
  border-color: var(--gold);
  color: var(--gold);
  font-weight: 700;
}
`;

// ── COMPONENTS ──
const NotePopup = ({ notePopup, setNotePopup, initialDraft, saveNote, p }) => {
  const [draft, setDraft] = useState("");
  useEffect(() => { if (notePopup) setDraft(initialDraft || ""); }, [notePopup, initialDraft]);
  if (!notePopup) return null;
  const vn = notePopup.split("-")[1];
  return (
    <div className="note-overlay" onClick={() => setNotePopup(null)}>
      <div className="note-popup" onClick={(e) => e.stopPropagation()}>
        <button className="np-close" onClick={() => setNotePopup(null)}><IcoX /></button>
        <h3>Add Note</h3>
        <div className="np-ref">{p ? p.title : ""} : {vn}</div>
        <textarea
          placeholder="Write your note..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <div className="np-actions">
          <button className="np-cancel" onClick={() => setNotePopup(null)}>Cancel</button>
          <button className="np-save" onClick={() => saveNote(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
};

const QuickJumpModal = ({ isOpen, onClose, onSelect, books, currentBook, currentChapter }) => {
  const [selB, setSelB] = useState(null);
  useEffect(() => { if (isOpen) setSelB(currentBook); }, [isOpen, currentBook]);

  if (!isOpen) return null;

  const count = BIBLE_CHAPS[selB] || 1;

  const renderBooks = () => (
    <>
      <div style={{ fontFamily: "var(--ser)", fontSize: 22, fontWeight: 600, color: "var(--t1)", marginBottom: 4, textAlign: 'center' }}>Quick Jump</div>
      <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>Select a book</div>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {books.map(b => (
            <button key={b} onClick={() => setSelB(b)} className={"qj-btn" + (b === selB ? " sel" : "")}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderChapters = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => setSelB(null)} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--gold)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px' }}>
          <IcoChevL /> <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Books</span>
        </button>
        <div style={{ fontFamily: "var(--ser)", fontSize: 18, fontWeight: 600, color: "var(--gold)" }}>{selB}</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>Select a chapter</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, paddingRight: 4, scrollbarWidth: 'none' }}>
        {Array.from({ length: count }).map((_, i) => {
          const ch = i + 1;
          const isCurr = selB === currentBook && ch === currentChapter;
          return (
            <button key={ch} onClick={() => onSelect(selB, ch)} className={"qj-btn" + (isCurr ? " sel" : "")} style={{ padding: "10px 0", aspectRatio: "1" }}>
              {ch}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="qj-overlay" onClick={onClose}>
      <div className="qj-modal" onClick={e => e.stopPropagation()}>
        {selB ? renderChapters() : renderBooks()}
      </div>
    </div>
  );
};

// ── NEW: Reader Top Bar (replaces TimerBar) ──
const ReaderTopBar = ({ isSession, elapsed, total, timerOn, toggleTimer, back, onAddTime, bonusMode, topMenuOpen, setTopMenuOpen, bibleVersion, setBibleVersion, esvApiKey, setTab, setMenuSub, isPrimary, progressPct }) => {
  const fmtT = (s) => Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
  return (
    <div className="rtb">
      <div className="rtb-row">
        {/* Back arrow – bigger and more obvious */}
        <button className="rtb-back" onClick={back} title="Back">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {/* Timer / title — only show if session AND (isPrimary OR explicitly turned on) */}
        {(isSession && (isPrimary || timerOn)) ? (
          <div style={{flex:1, display:"flex", alignItems:"baseline", gap:0}}>
            <div style={{display:"flex", flexDirection:"column"}}>
              <div className="rtb-timer-label">{bonusMode ? "BONUS TIME" : "KAIROS TIME"}</div>
              <div style={{display:"flex", alignItems:"baseline", gap:0}}>
                <span className={"rtb-timer"+(bonusMode?" bonus":"")}>{fmtT(elapsed)}</span>
                {!bonusMode && <span className="rtb-goal"> / {fmtT(total)}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{flex:1}}/>
        )}
        {/* Controls – only in session if timer is showing */}
        {isSession && (isPrimary || timerOn) && (
          <div style={{display:"flex", gap:8}}>
            <button className="rtb-icon-btn" onClick={toggleTimer} title={timerOn?"Pause":"Resume"}>
              {timerOn ? <IcoPauseSm/> : <IcoPlaySm/>}
            </button>
            {!bonusMode && (
              <button className="rtb-icon-btn plus" onClick={onAddTime} title="Add time">+</button>
            )}
          </div>
        )}
        {/* Progress % for journeys */}
        {isSession && progressPct !== undefined && (
          <div style={{marginLeft:"auto", paddingLeft:12, fontSize:13, fontWeight:700, color:"var(--t3)", fontFamily:"var(--san)", letterSpacing:0.5, opacity:0.8}}>
            {progressPct}%
          </div>
        )}
      </div>
      {/* Caret strip – tap to open/close the settings drawer */}
      <div className="rtb-caret" onClick={() => setTopMenuOpen(v => !v)}>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="var(--t3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={topMenuOpen ? "M2 8l7-6 7 6" : "M2 2l7 6 7-6"}/>
        </svg>
      </div>
      {/* Slide-down settings panel */}
      {topMenuOpen && (
        <div className="rtb-panel">
          {/* Option to start timer manually in non-primary journey */}
          {isSession && !isPrimary && !timerOn && (
            <button 
              onClick={() => { toggleTimer(); setTopMenuOpen(false); }} 
              style={{width:"100%", background:"var(--gold)", color:"#111", border:"none", borderRadius:"var(--rs)", padding:"12px", fontSize:15, fontWeight:700, marginBottom:16, cursor:"pointer"}}
            >
              Start Kairos Timer
            </button>
          )}
          <div style={{fontSize:10, fontWeight:700, letterSpacing:1.8, color:"var(--t3)", textTransform:"uppercase", marginBottom:10}}>Bible Version</div>
          <div style={{display:"flex", gap:8}}>
            {[{id:"kjv",label:"KJV",sub:"King James"},{id:"esv",label:"ESV",sub:esvApiKey?"English Std":"Key needed"}].map(v => (
              <button
                key={v.id}
                onClick={() => {
                  if (v.id==="esv" && !esvApiKey) { 
                    setBibleVersion(v.id);
                    setTopMenuOpen(false); 
                    return; 
                  }
                  setBibleVersion(v.id);
                  setTopMenuOpen(false);
                }}
                style={{flex:1,padding:"10px 12px",borderRadius:"var(--rs)",border:bibleVersion===v.id?"1.5px solid var(--gold)":"1.5px solid rgba(255,255,255,0.08)",background:bibleVersion===v.id?"var(--gd)":"var(--bg3)",color:bibleVersion===v.id?"var(--gold)":"var(--t2)",fontFamily:"var(--san)",fontWeight:700,fontSize:13,cursor:"pointer",textAlign:"left",transition:"all .2s"}}
              >
                <div>{v.label}</div>
                <div style={{fontSize:10,fontWeight:400,color:bibleVersion===v.id?"rgba(201,168,76,0.7)":"var(--t3)",marginTop:2}}>{v.sub}</div>
              </button>
            ))}
          </div>
          <div style={{marginTop:14,fontSize:11,color:"var(--t3)",fontStyle:"italic",textAlign:"center",opacity:0.5}}>Text size · Theme · more coming soon</div>
        </div>
      )}
    </div>
  );
};

// ── Kairos Daily Card ──
const KairosBanner = ({ elapsed, total, bonusMode, kairosGoalMet, onPress }) => {
  const elapsedMin = Math.floor(elapsed / 60);
  const totalMin = Math.ceil(total / 60);
  const pct = Math.min((elapsed / Math.max(total, 1)) * 100, 100);
  const remainMin = Math.max(0, Math.ceil((total - elapsed) / 60));

  return (
    <div className="kb-card" onClick={onPress}>
      <div className="kb-card-label">Today's Kairos</div>
      <div className="kb-main-row">
        <div className="kb-time-big">
          {elapsedMin}<span>min</span>
        </div>
        <div className="kb-right-col">
          {kairosGoalMet ? (
            <div className="kb-complete-mark">✦ Goal met</div>
          ) : elapsed > 0 ? (
            <div className="kb-goal-line">{remainMin}m remaining</div>
          ) : (
            <div className="kb-goal-line">Goal: {totalMin}m</div>
          )}
        </div>
      </div>
      <div className="kb-track">
        <div className="kb-fill" style={{width: pct + "%"}} />
      </div>
      {!kairosGoalMet && elapsed === 0 && (
        <div className="kb-sub">Open a journey below to begin</div>
      )}
      {kairosGoalMet && (
        <div className="kb-sub">
          {bonusMode ? `${elapsedMin}m in Scripture today` : "Well done — faithful time in God's Word"}
        </div>
      )}
    </div>
  );
};

// ── NEW: Kairos Complete Modal ──
const KairosCompleteModal = ({ onKeepReading, onGoHome }) => (
  <div className="kc-modal-overlay">
    <div className="kc-modal">
      <div style={{fontSize:38,color:"var(--gold)",marginBottom:14}}>✦</div>
      <div style={{fontFamily:"var(--ser)",fontSize:26,fontWeight:600,color:"var(--t1)",marginBottom:8}}>Kairos Complete</div>
      <div style={{fontFamily:"var(--ser)",fontSize:15,color:"var(--t2)",fontStyle:"italic",lineHeight:1.7,marginBottom:28}}>You've spent faithful time in God's Word. Well done.</div>
      <button onClick={onKeepReading} style={{display:"block",width:"100%",background:"var(--gold)",color:"#1A1A1E",border:"none",borderRadius:50,padding:"15px",fontFamily:"var(--san)",fontSize:15,fontWeight:600,cursor:"pointer",marginBottom:10}}>Keep Reading</button>
      <button onClick={onGoHome} style={{display:"block",width:"100%",background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:50,padding:"14px",fontFamily:"var(--san)",fontSize:14,color:"var(--t2)",cursor:"pointer"}}>Return Home</button>
    </div>
  </div>
);

const JourneyCompleteModal = ({ journeyName, onMarkComplete, onKeepReading }) => {
  const [confetti, setConfetti] = useState([]);
  useEffect(() => {
    // Generate some confetti bits on mount
    const bits = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      scale: 0.5 + Math.random(),
      rot: Math.random() * 360
    }));
    setConfetti(bits);
  }, []);

  return (
    <div className="kc-modal-overlay">
      <div className="kc-modal kc-modal-inner">
        {confetti.map(bit => (
          <div 
            key={bit.id} 
            className="confetti-bit" 
            style={{ 
              left: bit.left + "%", 
              top: -20, 
              animationDelay: bit.delay + "s", 
              transform: `rotate(${bit.rot}deg) scale(${bit.scale})`,
              background: bit.id % 2 === 0 ? "var(--gold)" : "#fff" 
            }}
          />
        ))}
        <div className="kc-celebrate-icon">✨</div>
        <div className="kc-title-reveal" style={{fontFamily:"var(--ser)", fontSize:32, fontWeight:700, color:"var(--t1)", marginBottom:12, letterSpacing:"-0.5px"}}>
          Journey Complete
        </div>
        <div className="kc-desc-reveal" style={{fontFamily:"var(--ser)", fontSize:16, color:"var(--t2)", fontStyle:"italic", lineHeight:1.7, marginBottom:32, padding:"0 10px"}}>
          You have reached the end of your path through <br/>
          <span style={{color:"var(--gold)", fontWeight:700, fontStyle:"normal", fontSize:18}}>{journeyName}</span>. <br/>
          May the Word continue to dwell in you richly.
        </div>
        <div className="kc-btn-reveal" style={{display:"flex", flexDirection:"column", gap:12}}>
          <button onClick={onMarkComplete} style={{display:"block", width:"100%", background:"var(--gold)", color:"#1A1A1E", border:"none", borderRadius:16, padding:"18px", fontFamily:"var(--san)", fontSize:16, fontWeight:700, cursor:"pointer", transition:"transform 0.2s", boxShadow:"0 10px 20px rgba(201,168,76,0.2)"}}>
            Mark as Finished
          </button>
          <button onClick={onKeepReading} style={{display:"block", width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"16px", fontFamily:"var(--san)", fontSize:14, color:"var(--t2)", cursor:"pointer", transition:"all 0.2s"}}>
            Keep Reading Final Chapter
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Kairos() {
  // Core state
  const [boarded,setBoarded]=useState(false);
  const [step,setStep]=useState(0);
  const [mins,setMins]=useState(5);
  const [mode,setMode]=useState("both");
  const [tab,setTab]=useState("home");
  const [showQuickJump, setShowQuickJump] = useState(false);

  // Session state
  const [inSess,setInSess]=useState(false);
  const [cmpl,setCmpl]=useState(false);
  const [cmplShown,setCmplShown]=useState(false);
  const [done,setDone]=useState(false);
  const [showJComplete, setShowJComplete] = useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [timerOn,setTimerOn]=useState(false);
  const [aV,setAV]=useState(0);
  const [audioElapsed,setAudioElapsed]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [sessStarted,setSessStarted]=useState(false); 
  const [bonusMode,setBonusMode]=useState(false); // after goal reached, keep reading freely
  const [topMenuOpen,setTopMenuOpen]=useState(false); // slide-down settings drawer in reader
  const [showAddTime,setShowAddTime]=useState(false); // add-time picker

  // Annotations
  const [hl,setHl]=useState({});
  const [hlBar,setHlBar]=useState(null);
  const [notes,setNotes]=useState({});
  const [notePopup,setNotePopup]=useState(null);
  const [noteDraft,setNoteDraft]=useState("");

  // Audio references
  const ttsRef=useRef(null);
  const ttsActive=useRef(false);

  // Stats
  const [stats,setStats]=useState({ totalSecs:0, bookSecs:{}, testamentSecs:{}, dailySecs:{}, history:[], lastSessionSnapshot:null });
  const safeStats = React.useMemo(() => ({
    totalSecs: stats.totalSecs || 0,
    bookSecs: stats.bookSecs || {},
    testamentSecs: stats.testamentSecs || {},
    dailySecs: stats.dailySecs || {},
    history: stats.history || [],
    lastSessionSnapshot: stats.lastSessionSnapshot || null
  }), [stats]);

  // Journeys — active journeys the user has added, with their reading position
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [sessJourneyId, setSessJourneyId] = useState(null); // which journey is open in the current session
  const [expandedJourney, setExpandedJourney] = useState(null); // detail view in Journeys tab
  const [jCat, setJCat] = useState("All"); // category filter in Journeys tab

  // Bible tab
  const [bibleView,setBibleView]=useState("list"); 
  const [biblePassage,setBiblePassage] = useState("John"); 
  const [bibleChapter,setBibleChapter] = useState(1); 
  const [bibleData,setBibleData]=useState({});
  const bibleDataRef = useRef(bibleData);
  useEffect(() => { bibleDataRef.current = bibleData; }, [bibleData]);
  const fetchingRef = useRef({}); // Prevent duplicate fetches
  const [fetching,setFetching]=useState(false);
  const [allVerses, setAllVerses] = useState(null);
  const [bibleSearch, setBibleSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState(null);
  const [selChap, setSelChap] = useState(1);
  const [isEditingChap, setIsEditingChap] = useState(false);
  const [chapInput, setChapInput] = useState("");

  // Bible version: 'kjv' | 'esv'
  const [bibleVersion, setBibleVersion] = useState("kjv");
  const [esvApiKey, setEsvApiKey] = useState("");
  const [esvKeyDraft, setEsvKeyDraft] = useState("");

  useEffect(() => {
    setFetching(true);
    fetch("/data/verses-1769.json")
      .then(res => res.json())
      .then(data => {
        setAllVerses(data);
        setFetching(false);
      })
      .catch(err => {
        console.error("Failed to load local Bible:", err);
        setFetching(false);
      });
  }, []);

  // ESV API fetch helper — routes through Vite proxy /esv-api → https://api.esv.org
  const fetchESVChapter = useCallback(async (bookName, chapter, key) => {
    if (!esvApiKey) return null;
    const query = encodeURIComponent(`${bookName} ${chapter}`);
    const params = new URLSearchParams({
      q: `${bookName} ${chapter}`,
      'include-headings': 'false',
      'include-footnotes': 'false',
      'include-short-copyright': 'false',
      'include-passage-references': 'false',
      'include-verse-numbers': 'true',
      'include-first-verse-numbers': 'true',
    });
    const res = await fetch(`/esv-api/v3/passage/text/?${params}`, {
      headers: { Authorization: `Token ${esvApiKey}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rawText = (json.passages || [])[0] || "";
    // Parse verses from text like: "[1] In the beginning...[2] ..."
    const verseRegex = /\[(\d+)\]\s*([^\[]+)/g;
    const verses = [];
    let m;
    while ((m = verseRegex.exec(rawText)) !== null) {
      verses.push([parseInt(m[1]), m[2].trim()]);
    }
    if (verses.length === 0) return null;
    return {
      key,
      title: `${bookName} ${chapter}`,
      book: bookName,
      ch: chapter,
      verses,
      isESV: true,
    };
  }, [esvApiKey]);

  const getVerse = useCallback((ref) => {
    return allVerses ? allVerses[ref] : null;
  }, [allVerses]);

  // Menu tab
  const [menuSub,setMenuSub]=useState(null); 

  // ── DERIVED STATE & REFS ──
  const readerPassKey = getPassKey(biblePassage) + "-ch" + bibleChapter + "-" + bibleVersion;
  const readerPass = React.useMemo(() => bibleData[readerPassKey] || { 
    title: `${biblePassage} ${bibleChapter}`, 
    verses: [], 
    book: biblePassage, 
    ch: bibleChapter,
    key: readerPassKey,
    version: bibleVersion
  }, [bibleData, readerPassKey, biblePassage, bibleChapter, bibleVersion]);

  const scrollRef=useRef(null);
  const topVerseRef=useRef(0);
  const todayKey = new Date().toISOString().split('T')[0];

  // Animation state to prevent flickering
  const [lastTab, setLastTab] = useState(tab);
  const [animating, setAnimating] = useState(false);

  const fetchBook = useCallback((bookName, chapter = 1) => {
    const key = getPassKey(bookName) + "-ch" + chapter + "-" + bibleVersion;
    if (bibleDataRef.current[key] || fetchingRef.current[key]) return;

    if (bibleVersion === "esv") {
      if (!esvApiKey) return;
      fetchingRef.current[key] = true;
      fetchESVChapter(bookName, chapter, key).then(data => {
        fetchingRef.current[key] = false;
        if (data) {
          setBibleData(prev => {
            if (prev[key]) return prev;
            const n = { ...prev, [key]: data };
            bibleDataRef.current = n;
            return n;
          });
        }
      });
      return;
    }

    if (!allVerses) return;
    const jb = jBook(bookName);
    const prefix = `${jb} ${chapter}:`;
    const verses = Object.entries(allVerses)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => [parseInt(k.split(":")[1]), v])
      .sort((a, b) => a[0] - b[0]);

    if (verses.length > 0) {
      const data = {
        key: key,
        title: `${bookName} ${chapter}`,
        book: bookName,
        ch: chapter,
        verses: verses
      };
      // Important: Use fetchingRef even for KJV to avoid multiple simultaneous calls in one render
      fetchingRef.current[key] = true; 
      setBibleData(prev => {
        fetchingRef.current[key] = false;
        if (prev[key]) return prev;
        const n = { ...prev, [key]: data };
        bibleDataRef.current = n;
        return n;
      });
    }
  }, [allVerses, bibleVersion, esvApiKey, fetchESVChapter]);

  // When version changes, clear cached bible data so it re-fetches in the new version
  const prevVersionRef = useRef(bibleVersion);
  useEffect(() => {
    if (prevVersionRef.current !== bibleVersion) {
      prevVersionRef.current = bibleVersion;
      fetchingRef.current = {}; 
      bibleDataRef.current = {}; 
      setBibleData({});
    }
  }, [bibleVersion]);

  useEffect(() => {
    if (tab === "bible" && bibleView === "reader" && biblePassage && allVerses) {
      fetchBook(biblePassage, bibleChapter);
    }
  }, [tab, bibleView, biblePassage, bibleChapter, allVerses, fetchBook]);

  useEffect(() => {
    if (inSess && allVerses && biblePassage) {
      fetchBook(biblePassage, bibleChapter);
      fetchBook(biblePassage, bibleChapter + 1);
    }
  }, [inSess, allVerses, fetchBook, biblePassage, bibleChapter]);

  useEffect(() => {
    if (tab !== lastTab) {
      setAnimating(true);
      setLastTab(tab);
      const timer = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [tab, lastTab]);

  // Persistence Load
  useEffect(() => {
    const saved = localStorage.getItem("kairos_data");
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.boarded) setBoarded(true);
        if (d.mins) setMins(d.mins);
        if (d.mode) setMode(d.mode);
        if (d.hl) setHl(d.hl);
        if (d.notes) setNotes(d.notes);
        if (d.stats) {
          setStats(prev => ({ ...prev, ...d.stats }));
          if (d.stats.dailySecs && d.stats.dailySecs[todayKey]) setElapsed(d.stats.dailySecs[todayKey]);
        }
        else if (d.history) setStats(prev => ({ ...prev, history: d.history, totalSecs: d.totalSecs || 0, bookSecs: d.bookSecs || {}, testamentSecs: d.testamentSecs || {} }));
        if (d.bibleVersion) setBibleVersion(d.bibleVersion);
        if (d.esvApiKey) { setEsvApiKey(d.esvApiKey); setEsvKeyDraft(d.esvApiKey); }
        if (d.activeJourneys) setActiveJourneys(d.activeJourneys);
        if (d.sessJourneyId) setSessJourneyId(d.sessJourneyId);
        if(d.lastSess && d.lastSess.biblePassage) {
          setBiblePassage(d.lastSess.biblePassage);
          setBibleChapter(d.lastSess.bibleChapter || 1);
          if (d.lastSess.aV !== undefined) setAV(d.lastSess.aV);
          setElapsed(d.lastSess.elapsed || 0);
          setSessStarted(true);
        }
      } catch(e) { console.error("Error loading state", e); }
    }
  }, []);

  // Persistence Save
  useEffect(() => {
    if (!boarded) return;
    const lastSess = (inSess || sessStarted) ? { biblePassage, bibleChapter, aV, elapsed } : null;
    localStorage.setItem("kairos_data", JSON.stringify({ boarded, mins, mode, hl, notes, stats, lastSess, bibleVersion, esvApiKey, activeJourneys, sessJourneyId }));
  }, [boarded, mins, mode, hl, notes, stats, inSess, sessStarted, aV, biblePassage, bibleChapter, elapsed, bibleVersion, esvApiKey, activeJourneys, sessJourneyId]);

  // ── JOURNEY HELPERS ──
  const addJourney = useCallback((jId) => {
    if (activeJourneys.find(j => j.id === jId)) return;
    const books = journeyBooks(jId);
    setActiveJourneys(prev => [...prev, {
      id: jId, addedAt: new Date().toISOString(), lastReadAt: null,
      currentBook: books[0], currentChapter: 1, currentVerse: 0, snapshot: null
    }]);
  }, [activeJourneys]);

  const removeJourney = useCallback((jId) => { 
    setActiveJourneys(prev => prev.filter(j => j.id !== jId)); 
  }, []);

  const saveJourneyPos = useCallback((jId, book, chapter, verse, snap) => {
    setActiveJourneys(prev => prev.map(j =>
      j.id === jId ? {...j, currentBook:book, currentChapter:chapter, currentVerse:verse, snapshot:snap, lastReadAt:new Date().toISOString()} : j
    ));
  }, []);

  // ── SESSION CONTROLS ──
  function startS(journeyId) {
    const jId = journeyId || sessJourneyId || activeJourneys[0]?.id;
    setSessJourneyId(jId);
    setInSess(true);
    setCmpl(false);
    setPlaying(false);

    // If today's Kairos goal is already met, skip into bonus mode immediately
    // so the completion modal never re-shows on a subsequent session
    const currentElapsed = stats.dailySecs?.[todayKey] || elapsed || 0;
    const goalAlreadyMet = currentElapsed >= safeTotal && safeTotal > 0;
    if (goalAlreadyMet) {
      setCmplShown(true);
      setBonusMode(true);
    } else {
      setCmplShown(false);
      setBonusMode(false);
    }

    const progress = jId ? activeJourneys.find(j => j.id === jId) : null;
    if (progress && progress.lastReadAt) {
      // Resume from saved position
      setBiblePassage(progress.currentBook);
      setBibleChapter(progress.currentChapter);
      setAV(progress.currentVerse || 0);
      topVerseRef.current = progress.currentVerse || 0;
      setElapsed(currentElapsed);
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const v = progress.currentVerse || 0;
            if (v === 0) {
              scrollRef.current.scrollTo(0, 0);
            } else {
              const el = scrollRef.current.querySelector('[data-vi="'+v+'"]');
              if (el) scrollRef.current.scrollTo(0, Math.max(0, el.offsetTop - 100));
            }
          }
        });
      }, 200);
    } else if (!sessStarted) {
      // Fresh start — use first book of journey
      const books = jId ? journeyBooks(jId) : [...NTB];
      setBiblePassage(books[0]);
      setBibleChapter(1);
      setAV(0);
      topVerseRef.current = 0;
      setElapsed(currentElapsed);
      setAudioElapsed(0);
    }
    setSessStarted(true);
    setTimerOn(jId === activeJourneys[0]?.id);
  }

  const calculateSnapshot = useCallback(() => {
    const currentVerseIdx = playing ? aV : Math.max(aV, topVerseRef.current || 0);
    if (!playing && currentVerseIdx !== aV) setAV(currentVerseIdx);
    if (inSess && readerPass && readerPass.verses && readerPass.verses[currentVerseIdx]) {
      const snapVerses = readerPass.verses.slice(currentVerseIdx, currentVerseIdx + 5).map(v => v[1].replace(/\[|\]/g, "")).join(" ");
      setStats(p => ({...p, lastSessionSnapshot: snapVerses}));
      return { book: biblePassage, chapter: bibleChapter, verse: currentVerseIdx, snap: snapVerses };
    }
    return { book: biblePassage, chapter: bibleChapter, verse: aV, snap: null };
  }, [playing, aV, inSess, readerPass, biblePassage, bibleChapter]);

  function exitSess(){
    const pos = calculateSnapshot();
    if (sessJourneyId) saveJourneyPos(sessJourneyId, pos.book, pos.chapter, pos.verse, pos.snap);
    setInSess(false); setPlaying(false); setTimerOn(false); setSessStarted(false);
    setTab("home"); // Return to home by default
  }
  function finishS(){
    const pos = calculateSnapshot();
    if (sessJourneyId) saveJourneyPos(sessJourneyId, pos.book, pos.chapter, pos.verse, pos.snap);
    setInSess(false); setCmpl(false); setCmplShown(false); setBonusMode(false); setPlaying(false); setTimerOn(false); setDone(true); setTab("home"); setBibleView("list"); setNotePopup(null); setHlBar(null); setTopMenuOpen(false); setShowAddTime(false); setSessStarted(false);
  }
  function keepG(){ setCmplShown(true); setBonusMode(true); setTimerOn(true); }
  function seekVerse(i){ setAV(i); }
  function onExtend(m){ setMins(prev => prev + m); setShowAddTime(false); }
  function tHl(pk,vn,c){const k=pk+"-"+vn;setHl(p=>{const n={...p};if(n[k]===c)delete n[k];else n[k]=c;return n;});setHlBar(null);}
  function openNote(pk,vn){const k=pk+"-"+vn;setNoteDraft(notes[k]||"");setNotePopup(k);setHlBar(null);}
  function saveNote(val){if(notePopup){setNotes(p=>({...p,[notePopup]:val}));setNotePopup(null);}}
  function toggleTimer(){setTimerOn(v=>!v);if(timerOn)setPlaying(false);}

  const changeChap = useCallback((dir) => {
    const books = sessJourneyId ? journeyBooks(sessJourneyId) : [...NTB];
    const bIdx = books.indexOf(biblePassage);
    if (bIdx === -1) return;

    const maxChaps = BIBLE_CHAPS[biblePassage] || 1;
    let nCh = bibleChapter + dir;

    if (nCh > maxChaps) {
      if (bIdx < books.length - 1) {
        // Move to next book in journey
        const nextBook = books[bIdx + 1];
        setBiblePassage(nextBook);
        setBibleChapter(1);
        setAV(0); topVerseRef.current = 0;
      } else {
        // End of journey reached
        setShowJComplete(true);
      }
    } else if (nCh < 1) {
      if (bIdx > 0) {
        // Move to prev book in journey
        const pBk = books[bIdx - 1];
        const pMax = BIBLE_CHAPS[pBk] || 1;
        setBiblePassage(pBk);
        setBibleChapter(pMax);
        setAV(0); topVerseRef.current = 0;
      } else {
        // Beginning of journey - stay at chapter 1
        setBibleChapter(1);
        setAV(0); topVerseRef.current = 0;
      }
    } else {
      setBibleChapter(nCh);
      setAV(0); topVerseRef.current = 0;
    }
  }, [biblePassage, bibleChapter, sessJourneyId]);

  const handleScroll=useCallback((e)=>{
    if (scrollRef.current && mode === "read" && !playing) {
      const parentRect = scrollRef.current.getBoundingClientRect();
      const verseNodes = scrollRef.current.querySelectorAll('.sv');
      for (let node of verseNodes) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom > parentRect.top + 100) {
          const idx = parseInt(node.getAttribute('data-vi'), 10);
          if (!isNaN(idx)) topVerseRef.current = idx;
          break;
        }
      }
    }
  },[mode,playing]);

  const total = React.useMemo(() => (mins || 5) * 60, [mins]);
  const safeTotal = React.useMemo(() => total > 0 ? total : 300, [total]);
  const dow = new Date().getDay(); // 0 is Sun
  const tI = dow === 0 ? 6 : dow - 1;
  const lastScrollY=useRef(0);

  useEffect(() => {
    if (aV === 0 && !playing && scrollRef.current) {
      // Small delay to ensure render is complete
      const timer = setTimeout(() => {
        if (scrollRef.current && aV === 0 && !playing) scrollRef.current.scrollTo(0, 0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [biblePassage, bibleChapter, readerPassKey, aV, playing]);

  // Auto-scroll active verse
  useEffect(()=>{
    if(!scrollRef.current||(mode==="read"&&!playing)) return;
    const el=scrollRef.current.querySelector('[data-vi="'+aV+'"]');
    if(el) {
      const parent = scrollRef.current;
      const elRect = el.getBoundingClientRect();
      const parRect = parent.getBoundingClientRect();
      const fromTop = elRect.top - parRect.top;
      const fromBottom = parRect.bottom - elRect.bottom;
      
      // Only scroll if the active verse is getting close to the edges of the viewable area
      if ((fromTop < 120 || fromBottom < 220) && (aV !== 0 || playing)) {
        const start = parent.scrollTop;
        // If at verse 0, scroll to very top to show header. Else center the verse.
        const target = aV === 0 ? 0 : parent.scrollTop + elRect.top - parRect.top - (parRect.height / 2) + (elRect.height / 2);
        const duration = 1200; // smooth 1.2 second glide
        const startTime = performance.now();
        function animate(currentTime) {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          parent.scrollTop = start + (target - start) * ease;
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
    }
  },[aV,mode,playing]);

  // Audio timer decoupling
  useEffect(()=>{
    if(!playing||!inSess||cmpl) return;
    const id=setInterval(()=>setAudioElapsed(s=>s+1),1000);
    return()=>clearInterval(id);
  },[playing,inSess,cmpl]);

  useEffect(()=>{
    // Active if in session OR explicitly in reader view
    const isActive = inSess || bibleView === 'reader';
    if(!timerOn || !isActive || cmpl) return;

    const id=setInterval(()=>{
      if (!timerOn) return;
      setElapsed(p => p + 1);
      setStats(prev => {
        const next = {
          totalSecs: (prev.totalSecs || 0) + 1,
          bookSecs: { ...(prev.bookSecs || {}) },
          testamentSecs: { ...(prev.testamentSecs || {}) },
          dailySecs: { ...(prev.dailySecs || {}) },
          history: [...(prev.history || [])]
        };
        next.dailySecs[todayKey] = (next.dailySecs[todayKey] || 0) + 1;
        const book = (inSess || bibleView === 'reader') ? biblePassage : null;
        if (book) {
          next.bookSecs[book] = (next.bookSecs[book] || 0) + 1;
          const testament = OT.includes(book) ? "Old Testament" : "New Testament";
          next.testamentSecs[testament] = (next.testamentSecs[testament] || 0) + 1;
        }
        if (!next.history.includes(todayKey)) next.history.push(todayKey);
        return next;
      });
    }, 1000);
    return()=>clearInterval(id);
  },[timerOn,inSess,bibleView,cmpl,biblePassage,todayKey,bibleData]);

  // Audio verse advance via Web Speech API
  useEffect(() => {
    if (!playing || cmpl) {
      if (ttsActive.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        ttsActive.current = false;
      }
      return;
    }

    if (window.speechSynthesis && !ttsActive.current) {
      if (!readerPass || !readerPass.verses || readerPass.verses.length === 0) return;
      
      const verseText = readerPass.verses[aV] ? readerPass.verses[aV][1] : "";
      if (!verseText) return;

      const cleanText = verseText.replace(/\[|\]/g, ""); 
      const u = new SpeechSynthesisUtterance(cleanText);
      u.rate = speed;
      u.onend = () => {
        ttsActive.current = false;
        setAV(prev => {
          const mx = readerPass.verses.length - 1;
          if (prev >= mx) {
            // End of chapter -> auto advance if playing
            setTimeout(() => {
              changeChap(1);
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
            }, 50);
            return prev;
          }
          return prev + 1;
        });
      };
      
      ttsActive.current = true;
      window.speechSynthesis.speak(u);
      ttsRef.current = u;
    }
  }, [playing, aV, readerPass.title, readerPass.verses.length, speed, changeChap]);

  // Clean up TTS on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);





  const remainSecs=Math.max(0,total-elapsed);
  const remainMin=Math.ceil(remainSecs/60);


  // ── ONBOARDING ──
  if(!boarded) return(
    <div className="K"><style>{S}</style>
      <div className="ob">
        {step===0&&<><div className="ob-t">Kairos</div><div className="ob-s">The right time for God's Word</div><button className="bg" onClick={()=>setStep(1)}>Get Started</button></>}
        {step===1&&<><div style={{fontSize:40,marginBottom:8,color:"var(--gold)"}}>{"\u2726"}</div><div className="ob-s" style={{fontSize:17,textAlign:"center",lineHeight:1.7,maxWidth:300,fontStyle:"normal"}}>Kairos helps you spend time in Scripture every day</div><div className="ob-b">Starting small, staying steady, growing naturally. No pressure. No perfection. Just progress.</div><button className="bg" onClick={()=>setStep(2)}>Continue</button></>}
        {step===2&&<><div className="ob-s" style={{fontSize:17,fontStyle:"normal"}}>How many minutes to start?</div><div className="tp">{[1,3,5,8,10,15].map(t=><button key={t} className={mins===t?"sel":""} onClick={()=>setMins(t)}>{t} min</button>)}</div><div className="ob-b" style={{marginTop:16,fontSize:13}}>You can always change this. Any time in God's Word is a good start.</div><button className="bg" onClick={()=>setStep(3)}>Continue</button></>}
        {step===3&&<><div className="ob-s" style={{fontSize:17,fontStyle:"normal"}}>How do you prefer Scripture?</div><div className="mc">{[["read","Read","Text only"],["listen","Listen","Audio narration"],["both","Read + Listen","Text with synced audio"]].map(([id,t,d])=><div key={id} className={mode===id?"sel":""} onClick={()=>setMode(id)}><div style={{fontWeight:600,fontSize:15,color:"var(--t1)"}}>{t}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:3}}>{d}</div></div>)}</div><button className="bg" onClick={()=>setBoarded(true)}>Begin Your First Kairos</button><button className="bo" onClick={()=>setBoarded(true)}>Skip for Now</button></>}
      </div>
    </div>
  );



  // Completion: show modal when timer hits goal (and not in bonus mode)
  const showCompleteModal = inSess && timerOn && safeTotal > 0 && elapsed >= safeTotal && !bonusMode && !cmplShown;

  // ── SESSION View (Shared Reader Layout) ──
  const renderReaderLayout = ({ passage, pk, isSession }) => {
    const isOfflineESV = bibleVersion === 'esv' && !esvApiKey;

    // Height of fixed top bar changes when panel is open
    const topBarH = topMenuOpen ? 178 : 96;
    
    if (isOfflineESV) {
      return (
        <div className="ss">
          <ReaderTopBar
            isSession={isSession}
            elapsed={elapsed}
            total={isSession ? safeTotal : 0}
            timerOn={timerOn}
            toggleTimer={toggleTimer}
            back={() => { if(isSession) exitSess(); else setBibleView("list"); }}
            onAddTime={() => setShowAddTime(true)}
            bonusMode={bonusMode}
            topMenuOpen={topMenuOpen}
            setTopMenuOpen={setTopMenuOpen}
            bibleVersion={bibleVersion}
            setBibleVersion={setBibleVersion}
            esvApiKey={esvApiKey}
            setTab={setTab}
            setMenuSub={setMenuSub}
            isPrimary={sessJourneyId === activeJourneys[0]?.id}
            progressPct={isSession && sessJourneyId ? calculateJourneyProgress(activeJourneys.find(j => j.id === sessJourneyId), biblePassage, bibleChapter) : undefined}
          />
          <div style={{color:"var(--t2)",marginTop:140,padding:"0 32px",textAlign:"center",fontFamily:"var(--ser)",fontSize:18,fontStyle:"italic",lineHeight:1.6}}>
            <span style={{color:"var(--gold)", fontWeight:700}}>ESV Offline</span><br/><br/>
            You need an ESV API key to read this version. You can add it in Settings.
            <button className="bg" style={{marginTop:24, width:"100%"}} onClick={() => { if(isSession) exitSess(); setMenuSub("settings"); setTab("menu"); }}>Go to Settings</button>
          </div>
          <div style={{padding:"0 32px", marginTop:16}}>
            <button className="bo" style={{width:"100%"}} onClick={() => { if(isSession) exitSess(); else setBibleView("list"); }}>Browse Other Books</button>
          </div>
        </div>
      );
    }

    return (
    <div className="ss">
      <ReaderTopBar
        isSession={isSession}
        elapsed={elapsed}
        total={isSession ? safeTotal : 0}
        timerOn={timerOn}
        toggleTimer={toggleTimer}
        back={() => { if(isSession) exitSess(); else setBibleView("list"); }}
        onAddTime={() => setShowAddTime(true)}
        bonusMode={bonusMode}
        topMenuOpen={topMenuOpen}
        setTopMenuOpen={setTopMenuOpen}
        bibleVersion={bibleVersion}
        setBibleVersion={setBibleVersion}
        esvApiKey={esvApiKey}
        setTab={setTab}
        setMenuSub={setMenuSub}
        isPrimary={sessJourneyId === activeJourneys[0]?.id}
        progressPct={isSession && sessJourneyId ? calculateJourneyProgress(activeJourneys.find(j => j.id === sessJourneyId), biblePassage, bibleChapter) : undefined}
      />
      <button className="nav-arrow left" onClick={() => { changeChap(-1); if(scrollRef.current)scrollRef.current.scrollTop=0; }}><IcoChevL/></button>
      <button className="nav-arrow right" onClick={() => { changeChap(1); if(scrollRef.current)scrollRef.current.scrollTop=0; }}><IcoChevR/></button>
      <div className="scr" ref={scrollRef} onScroll={handleScroll} style={{paddingTop: topBarH + 16}}>
        <div style={{marginBottom:48, marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", position:"relative"}}>
          <div style={{textAlign:"center", cursor:"pointer"}} onClick={() => setShowQuickJump(true)}>
            <div style={{fontFamily:"var(--san)", fontSize:14, textTransform:"uppercase", letterSpacing:2, color:"var(--gold)", marginBottom:8}}>{passage.book}</div>
            <div style={{fontFamily:"var(--ser)", fontSize:56, fontWeight:600, color:"var(--t1)", lineHeight:1}}>{passage.ch}</div>
            <div style={{marginTop:8, display:"inline-flex", alignItems:"center", gap:6, background:"var(--bg3)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:50, padding:"3px 10px"}}>
              <span style={{fontSize:10, fontWeight:700, letterSpacing:1.2, color: bibleVersion==="esv" ? "var(--gold)" : "var(--t3)", textTransform:"uppercase"}}>{bibleVersion === "esv" ? "ESV" : "KJV"}</span>
            </div>
          </div>
        </div>
        {/* Reader Verses */}
        {(passage.verses.length === 0 && !isOfflineESV) ? (
          <div style={{color:"var(--t2)",marginTop:40,padding:"0 32px",textAlign:"center",fontFamily:"var(--ser)",fontSize:18,fontStyle:"italic",lineHeight:1.6}}>
            Gathering Scripture...
          </div>
        ) : (
          passage.verses.map(([num,text], idx) => {
            const hk = pk + "-" + num;
            const hc = hl[hk];
            const hasNote = !!notes[hk];
            const vs = hc ? {background:HL_C[hc],borderRadius:3,padding:"1px 0"} : {};
            return (
              <div key={num} data-vi={idx} className={"sv"+(idx===aV&&playing?" va":"")} onClick={() => { seekVerse(idx); setHlBar(hlBar===num?null:num); if(playing && window.speechSynthesis){window.speechSynthesis.cancel();ttsActive.current=false;} }}>
                <span className="vn">{num}</span><span className="vt" style={vs}>{text}</span>
                {hasNote && <span className="v-note-dot"/>}
              </div>
            );
          })
        )}
        <div style={{display:"flex", justifyContent:"center", padding:"40px 0 16px", gap:12}}>
          <button className="bo" style={{marginTop:0, padding:"12px 24px"}} onClick={() => { changeChap(-1); if(scrollRef.current) scrollRef.current.scrollTop=0; }}>
            Prev Chapter
          </button>
          <button className="bo" style={{marginTop:0, padding:"12px 24px"}} onClick={() => { changeChap(1); if(scrollRef.current) scrollRef.current.scrollTop=0; }}>
            Next Chapter
          </button>
        </div>

        {passage.isESV && (
          <div style={{padding:"10px 0 40px", textAlign:"center", fontSize:11, color:"var(--t3)", fontStyle:"italic", lineHeight:1.6}}>
            Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
          </div>
        )}

        {isSession && timerOn && (
          <div style={{display:"flex", justifyContent:"center", padding:"0 0 40px"}}>
            <button className="bg" style={{marginTop:0, padding:"12px 24px"}} onClick={finishS}>
              Complete Kairos
            </button>
          </div>
        )}
      </div>

      {hlBar !== null && (
        <div className="hlb">
          {Object.keys(HL_C).map(c => <div key={c} className="hlc" style={{background:HL_C[c].replace("0.25","0.6")}} onClick={() => tHl(pk, hlBar, c)}/>)}
          <div className="hldiv"/>
          <button className="hlnb" onClick={() => openNote(pk, hlBar)}><IcoNote/> Note</button>
          <button className="hlx" onClick={() => setHlBar(null)}><IcoX/></button>
        </div>
      )}

      <div className="ac" style={{ bottom: isSession ? 0 : 70, zIndex: 110 }}>
        <button className="ppb" onClick={() => setPlaying(!playing)}>{playing ? <IcoPause/> : <IcoPlay/>}</button>
        <div className="aif" style={{flex:"none", minWidth:60}}><div className="ain">{passage.title}</div><div className="ais">{playing ? "Playing" : "Paused"}</div></div>
        <div style={{flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, margin:"0 4px", overflow:"hidden", display:"flex"}}>
          <div style={{height:"100%", background:"var(--gold)", width:`${passage.verses && passage.verses.length > 0 ? (aV / passage.verses.length) * 100 : 0}%`, transition:"width 0.3s"}}/>
        </div>
        <button className="spb" onClick={() => {
          const sps=[0.75,1,1.25,1.5];
          const newSpeed = sps[(sps.indexOf(speed)+1)%4];
          setSpeed(newSpeed);
          if(playing && window.speechSynthesis) {
             window.speechSynthesis.cancel();
             ttsActive.current=false;
          }
        }}>{speed}x</button>
      </div>

      {/* Kairos completion modal */}
      {isSession && showCompleteModal && (
        <KairosCompleteModal onKeepReading={keepG} onGoHome={finishS} />
      )}

      {/* Add-time picker */}
      {isSession && showAddTime && (
        <div className="add-time-overlay" onClick={() => setShowAddTime(false)}>
          <div className="add-time-popup" onClick={e => e.stopPropagation()}>
            <div style={{fontFamily:"var(--ser)",fontSize:18,fontWeight:600,color:"var(--t1)",marginBottom:6}}>Add More Time</div>
            <div style={{fontSize:13,color:"var(--t2)",marginBottom:20}}>Extend your Kairos goal</div>
            <div style={{display:"flex",gap:8}}>
              {[5,10,15].map(m => (
                <button key={m} onClick={() => onExtend(m)} style={{flex:1,padding:"14px 0",background:"var(--bg3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"var(--rs)",color:"var(--gold)",fontFamily:"var(--san)",fontWeight:700,fontSize:15,cursor:"pointer",transition:"all .2s"}}>
                  +{m}m
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddTime(false)} style={{marginTop:14,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer",width:"100%",padding:"6px"}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
  };

  // ── HOME TAB ──
  const renderTabHome = () => {
    // Primary journey: the first active journey, or a default prompt
    const primary = activeJourneys[0];
    const primaryMeta = primary ? JOURNEYS.find(j => j.id === primary.id) : null;
    const pct = sessStarted && !done ? Math.min((elapsed/safeTotal)*100,100) : 0;

    // Journey progress % for any active journey
    function journeyPct(aj) {
      const books = journeyBooks(aj.id);
      const bIdx = books.indexOf(aj.currentBook);
      return books.length > 0 ? Math.round((bIdx / books.length) * 100) : 0;
    }

    // Preview text for a journey card
    function journeyPreview(aj) {
      if (aj.snapshot) return aj.snapshot;
      const jb = jBook(aj.currentBook);
      if (allVerses) {
        const lines = [1,2,3,4,5].map(v => allVerses[`${jb} ${aj.currentChapter}:${v}`] || "").filter(Boolean);
        return lines.join(" ") || "";
      }
      return "";
    }

    const JourneyCard = ({ aj, isPrimary }) => {
      const meta = JOURNEYS.find(j => j.id === aj.id);
      const pctJ = calculateJourneyProgress(aj);
      const preview = journeyPreview(aj);
      return (
        <div onClick={() => { setDone(false); startS(aj.id); }} style={{cursor:"pointer", padding:0, position:"relative", overflow:"hidden", marginTop:isPrimary?16:12, minHeight:isPrimary?240:180, display:"flex", flexDirection:"column", background:"var(--bg3)", borderRadius:20, border: isPrimary ? "1px solid rgba(201,168,76,0.18)" : "1px solid rgba(255,255,255,0.04)"}}>
          {/* Top Banner */}
          <div style={{background:isPrimary?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:2, position:"relative", borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:isPrimary?"var(--gold)":"var(--t3)", fontFamily:"var(--san)"}}>
              {meta ? meta.sub + " Journey" : aj.id}
            </div>
            <div style={{fontSize:11, fontWeight:700, color:isPrimary?"var(--gold)":"var(--t3)", fontFamily:"var(--san)", opacity:0.85, letterSpacing:0.5}}>
              {pctJ}%
            </div>
          </div>
          {/* Last read info */}
          <div style={{position:"absolute", top:46, right:20, fontSize:10, color:"var(--t3)", fontStyle:"italic", zIndex:2}}>
            {formatRelativeTime(aj.lastReadAt)}
          </div>
          {/* Background text preview */}
          <div style={{position:"absolute", top:36, left:0, right:0, bottom:0, opacity:0.12, zIndex:0, padding:"20px 24px", pointerEvents:"none"}}>
            <div style={{fontFamily:"var(--ser)", fontSize:16, color:"var(--gold)", fontStyle:"italic", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:9, WebkitBoxOrient:"vertical"}}>
              {preview}
            </div>
          </div>
          {/* Content — centered play icon + last chapter */}
          <div style={{padding:"16px 20px", position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column"}}>
            <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10}}>
              <div style={{color: isPrimary ? "var(--gold)" : "#fff", transform:`scale(${isPrimary?5:4})`, filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.6))", display:"flex", opacity:0.9}}>
                <IcoPlaySm/>
              </div>
            </div>
            <div style={{marginTop:20}}>
              <div style={{fontFamily:"var(--ser)", fontSize:isPrimary?22:18, fontWeight:600, color:"var(--t1)", lineHeight:1.2}}>
                {aj.currentBook} {aj.currentChapter}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{position:"absolute", bottom:0, left:0, right:0, height:3, background:"rgba(255,255,255,0.05)", zIndex:2}}>
            <div style={{height:"100%", background:"var(--gold)", width:pctJ+"%", transition:"width 0.5s"}}/>
          </div>
        </div>
      );
    };

    return (
      <div className="pg">
        <div className="hg">{greet()}.</div>
        <KairosBanner
          elapsed={elapsed}
          total={safeTotal}
          bonusMode={bonusMode}
          kairosGoalMet={elapsed >= safeTotal}
          onPress={() => { setTab("menu"); setMenuSub("stats"); }}
        />
        {activeJourneys.length === 0 ? (
          <div style={{marginTop:40, textAlign:"center"}}>
            <div style={{fontFamily:"var(--ser)", fontSize:20, color:"var(--t2)", fontStyle:"italic", marginBottom:16}}>No journeys yet</div>
            <div style={{fontSize:14, color:"var(--t3)", marginBottom:24}}>Add a journey from the Journeys tab to begin your Kairos.</div>
            <button className="bg" style={{padding:"12px 32px"}} onClick={() => setTab("journeys")}>Browse Journeys</button>
          </div>
        ) : (
          activeJourneys.map((aj, i) => <JourneyCard key={aj.id} aj={aj} isPrimary={i===0} />)
        )}
      </div>
    );
  };

  // Bible tab
  const renderTabBible = () => {
    const allBooks = [...OT, ...NTB];
    const filtered = bibleSearch ? allBooks.filter(b => b.toLowerCase().includes(bibleSearch.toLowerCase())) : null;

    const getChapCount = (b) => {
      let c = 150;
      const jb = jBook(b);
      while (c > 0 && !(allVerses && allVerses[`${jb} ${c}:1`])) c--;
      return c > 0 ? c : 1;
    };

    const renderBookRow = (b) => {
      const isExpanded = expandedBook === b;
      const count = getChapCount(b);
      return (
        <div key={b}>
          <div className={"bbk"+(READ_BK.has(b)?"":" empty")} onClick={() => {
            if (isExpanded) {
              setExpandedBook(null);
            } else {
              setExpandedBook(b);
              setSelChap(1);
              setIsEditingChap(false);
              setChapInput("1");
            }
          }}>
            <span>{b}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {READ_BK.has(b) && <span className="bbd"/>}
              <div style={{transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", display:"flex"}}><IcoChevR/></div>
            </div>
          </div>
          {isExpanded && (
            <div style={{background:"var(--bg3)", padding:"16px", borderRadius:"12px", marginBottom:"12px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px"}}>
                <div style={{display:"flex", alignItems:"center", gap: 8}}>
                  <div style={{fontSize:14, color:"var(--t2)"}}>Chapter</div>
                  <button 
                    onClick={() => {
                      const rc = Math.floor(Math.random() * count) + 1;
                      setSelChap(rc);
                      setChapInput(rc.toString());
                      setIsEditingChap(false);
                    }}
                    style={{background:"transparent", border:"none", color:"var(--gold)", cursor:"pointer", display:"flex", alignItems:"center", padding:4, borderRadius:4, opacity:0.8}}
                  >
                    <IcoDice/>
                  </button>
                </div>
                {isEditingChap ? (
                  <form onSubmit={(e) => { e.preventDefault(); e.target.elements[0].blur(); }} style={{margin:0}}>
                    <input 
                      type="number" 
                      value={chapInput} 
                      onChange={e => setChapInput(e.target.value)}
                      onBlur={() => {
                        const v = parseInt(chapInput);
                        if (!isNaN(v) && v >= 1 && v <= count) setSelChap(v);
                        else setChapInput(selChap.toString());
                        setIsEditingChap(false);
                      }}
                      autoFocus
                      style={{background:"transparent", border:"1px solid var(--gold)", color:"var(--gold)", width:"50px", textAlign:"center", fontSize:16, fontFamily:"var(--san)", outline:"none", borderRadius:"4px", padding:"4px"}}
                    />
                  </form>
                ) : (
                  <div 
                    onClick={() => { setIsEditingChap(true); setChapInput(selChap.toString()); }}
                    style={{fontSize:18, color:"var(--gold)", fontWeight:600, cursor:"pointer", padding:"2px 8px"}}
                  >
                    {selChap}
                  </div>
                )}
              </div>
              <input 
                type="range" 
                min={1} 
                max={count} 
                value={selChap} 
                onChange={e => {
                  setSelChap(parseInt(e.target.value));
                  setIsEditingChap(false);
                }}
                style={{width:"100%", accentColor:"var(--gold)", marginBottom:"16px"}}
              />
              <button 
                className="bg" 
                style={{width:"100%", marginTop:0, padding:"12px"}}
                onClick={() => {
                  setBiblePassage(b);
                  setBibleChapter(selChap);
                  setBibleView("reader");
                  setExpandedBook(null);
                }}
              >
                Go to {b} {selChap}
              </button>
            </div>
          )}
        </div>
      );
    };

    if (bibleView === "list") {
      return (
        <div className="pg">
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:52}}>
            <div className="ptt" style={{paddingTop:0}}>Bible</div>
            {/* Version Switcher */}
            <div style={{display:"flex", background:"var(--bg3)", borderRadius:50, padding:"3px", border:"1px solid rgba(255,255,255,0.06)", gap:2}}>
              {["kjv","esv"].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    if (v === "esv" && !esvApiKey) {
                      setMenuSub("settings");
                      setTab("menu");
                      return;
                    }
                    setBibleVersion(v);
                  }}
                  style={{
                    background: bibleVersion === v ? "var(--gold)" : "transparent",
                    color: bibleVersion === v ? "#1A1A1E" : "var(--t3)",
                    border: "none",
                    borderRadius: 50,
                    padding: "5px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--san)",
                    transition: "all .2s",
                  }}
                >{v}</button>
              ))}
            </div>
          </div>
          {bibleVersion === "esv" && !esvApiKey && (
            <div style={{background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:"var(--rs)", padding:"12px 16px", marginTop:12, fontSize:13, color:"var(--t2)", lineHeight:1.6}}>
              ⚠️ No ESV API key saved.{" "}
              <span style={{color:"var(--gold)", cursor:"pointer", textDecoration:"underline"}} onClick={() => { setMenuSub("settings"); setTab("menu"); }}>Add it in Settings →</span>
            </div>
          )}
          <input className="bsi" placeholder="Search books..." value={bibleSearch} onChange={e => setBibleSearch(e.target.value)}/>
          {(filtered || null) ? (
            <>
              <div className="bst">Results</div>
              {filtered.length === 0 && <div style={{fontSize:14,color:"var(--t3)",padding:"12px 0"}}>No books found</div>}
              {filtered.map(b => renderBookRow(b))}
            </>
          ) : (
            <>
              {[["Old Testament", OT], ["New Testament", NTB]].map(([l, bks]) => (
                <div key={l}>
                  <div className="bst">{l}</div>
                  {bks.map(b => renderBookRow(b))}
                </div>
              ))}
            </>
          )}
        </div>
      );
    }

    if (!biblePassage || !readerPass) return (
      <div className="pg">
        <div className="rtb" style={{background:"var(--bg)"}}>
          <div className="rtb-row" style={{border:"none"}}>
            <button className="rtb-back" onClick={() => { if(isSession) exitSess(); else setBibleView("list"); }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div style={{flex:1, fontFamily:"var(--ser)", fontSize:19, fontWeight:600, color:"var(--t1)", marginLeft:10}}>{biblePassage} {bibleChapter}</div>
          </div>
        </div>
        <div style={{color:"var(--t2)",marginTop:140,padding:"0 32px",textAlign:"center",fontFamily:"var(--ser)",fontSize:18,fontStyle:"italic",lineHeight:1.6}}>
           {fetching ? "Gathering Scripture..." : "Scripture text for this book will be available soon."}
        </div>
        {!isSession && (
          <div style={{padding:"0 32px", marginTop:16}}>
            <button className="bo" style={{width:"100%"}} onClick={() => { if(isSession) exitSess(); else setBibleView("list"); }}>Browse Other Books</button>
          </div>
        )}
      </div>
    );

    return renderReaderLayout({passage:readerPass, pk:biblePassage, isSession:false});
  };

  // ── JOURNEYS TAB ──
  const renderTabJourneys = () => {
    const cats = ["All", "Full Bible", "Testament", "Letters", "Prophets", "Single Book"];
    const filtered = jCat === "All" ? JOURNEYS : JOURNEYS.filter(j => j.cat === jCat);
    return (
      <div className="pg">
        <div className="ptt">Journeys</div>
        {activeJourneys.length > 0 && (
          <div style={{background:"var(--gd)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:"var(--r)", padding:"16px 20px", marginTop:20}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:1.5, color:"var(--gold)", textTransform:"uppercase", marginBottom:10}}>Your Active Journeys</div>
            {activeJourneys.map(aj => {
              const meta = JOURNEYS.find(j => j.id === aj.id);
              const books = journeyBooks(aj.id);
              const bIdx = books.indexOf(aj.currentBook);
              const pct = books.length > 0 ? Math.round((bIdx / books.length) * 100) : 0;
              return (
                <div key={aj.id} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14, fontWeight:600, color:"var(--t1)", fontFamily:"var(--san)"}}>{meta?.name}</div>
                    <div style={{fontSize:11, color:"var(--t3)", marginTop:2}}>{aj.currentBook} {aj.currentChapter} • {pct}% through</div>
                    <div style={{height:3, background:"rgba(255,255,255,0.06)", borderRadius:3, marginTop:6, overflow:"hidden"}}>
                      <div style={{width:pct+"%", height:"100%", background:"var(--gold)", borderRadius:3}}/>
                    </div>
                  </div>
                  <button onClick={() => removeJourney(aj.id)} style={{background:"none", border:"1px solid rgba(255,255,255,0.08)", borderRadius:50, padding:"5px 12px", fontSize:11, color:"var(--t3)", cursor:"pointer", fontFamily:"var(--san)"}}>Remove</button>
                </div>
              );
            })}
          </div>
        )}
        <div className="pcs" style={{marginTop:20}}>{cats.map(c => <button key={c} className={"pcb"+(jCat===c?" a":"")} onClick={() => setJCat(c)}>{c}</button>)}</div>
        <div style={{marginTop:12}}>
          {filtered.map(j => {
            const isActive = !!activeJourneys.find(aj => aj.id === j.id);
            const isExpanded = expandedJourney === j.id;
            return (
              <div key={j.id} className="plc" style={{border: isActive ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent"}}>
                <div onClick={() => setExpandedJourney(isExpanded ? null : j.id)} style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div className="pln">{j.name}</div>
                    <div style={{fontSize:11, color:"var(--gold)", fontWeight:600, letterSpacing:0.5, marginTop:2, marginBottom:4}}>{j.sub}</div>
                    <div className="pld">{j.desc}</div>
                    <div className="plm"><span>{j.bookCount} book{j.bookCount>1?"s":""}</span><span>{j.cat}</span></div>
                  </div>
                  {isActive && <div style={{fontSize:10, fontWeight:700, color:"var(--gold)", letterSpacing:1, marginLeft:12, flexShrink:0, paddingTop:2}}>ACTIVE</div>}
                </div>
                {isExpanded && (
                  <div style={{marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                    {isActive ? (
                      <div style={{display:"flex", gap:8}}>
                        <button className="bg" style={{flex:1, marginTop:0, padding:"11px"}} onClick={() => { setExpandedJourney(null); setDone(false); startS(j.id); }}>Continue Reading</button>
                        <button className="bo" style={{marginTop:0, padding:"10px 16px"}} onClick={() => { removeJourney(j.id); setExpandedJourney(null); }}>Remove</button>
                      </div>
                    ) : (
                      <button className="bg" style={{width:"100%", marginTop:0, padding:"12px"}} onClick={() => { addJourney(j.id); setExpandedJourney(null); }}>Add to Home</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Menu + sub-pages
  const td=new Date().getDate();

  const renderTabMenu=()=>{
    if(menuSub==="journey") return(<div className="pg">
      <button className="sub-back" onClick={()=>setMenuSub(null)}><IcoBack/> Menu</button>
      <div style={{fontFamily:"var(--ser)",fontSize:24,fontWeight:600,color:"var(--t1)",marginTop:8}}>Journey</div>
      <div className="jsb"><div className="jsn">{fmt(safeStats.totalSecs)}</div><div className="jsl">Total time in God's Word</div></div>
      <div className="jsr"><div className="jsc"><div className="jscn">{safeStats.history.length}</div><div className="jscl">Days</div></div><div className="jsc"><div className="jscn">{Object.keys(safeStats.bookSecs).length}</div><div className="jscl">Books</div></div><div className="jsc"><div className="jscn">{(safeStats.totalSecs/(safeStats.history.length||1)/60).toFixed(1)}</div><div className="jscl">Avg min</div></div></div>
      <div className="sct">Activity</div><div className="scs">Your rhythm</div>
      <div className="cg">
        {WDAYS.map((d,i)=><div key={"h"+i} className="cdd" style={{fontWeight:600}}>{d}</div>)}
        {Array.from({length:6},(_,i)=><div key={"e"+i} className="cdd"/>)}
        {Array.from({length:31},(_,i)=>{
          const date = new Date();
          date.setDate(date.getDate() - (td - (i+1)));
          const key = date.toISOString().split('T')[0];
          const on = safeStats.history.includes(key);
          return<div key={i+1} className={"cdd"+(on?" ca":"")+(i+1===td?" ct":"")}>{i+1}</div>;
        })}
      </div>
      <div className="sct">Milestones</div><div className="scs">Faithfulness, celebrated gently</div>
      {MILES.map((m,i)=>{
        const earned = (m.name.includes("First") && safeStats.totalSecs > 0) || (m.name.includes("7 Days") && safeStats.history.length >= 7) || (m.name.includes("One Hour") && safeStats.totalSecs >= 3600);
        return <div key={i} className="mli"><div className={"mic "+(earned?"e":"l")}>{m.sym}</div><div><div className="mnn">{m.name}</div><div className="mnd">{m.desc}</div></div>{earned&&<div className="mel">EARNED</div>}</div>
      })}
    </div>);

    if(menuSub==="stats") return(<div className="pg">
      <button className="sub-back" onClick={()=>setMenuSub(null)}><IcoBack/> Menu</button>
      <div style={{fontFamily:"var(--ser)",fontSize:24,fontWeight:600,color:"var(--t1)",marginTop:8}}>Stats</div>
      <div className="jsb"><div className="jsn">{fmt(safeStats.totalSecs)}</div><div className="jsl">Total time recorded</div></div>
      <div className="jsr"><div className="jsc"><div className="jscn">{safeStats.history.length}</div><div className="jscl">Days</div></div><div className="jsc"><div className="jscn">{Object.keys(safeStats.bookSecs).length}</div><div className="jscl">Books</div></div></div>

      <div className="sct">By Testament</div><div className="scs">Minutes spent</div>
      {Object.entries(safeStats.testamentSecs).map(([t,s])=><div key={t} className="stat-row">
        <div className="stat-info"><div className="stat-label">{t}</div><div className="stat-val">{(s/60).toFixed(1)}m</div></div>
        <div className="stat-bar-track"><div className="stat-bar-fill" style={{width:Math.round(s/Math.max(1, safeStats.totalSecs)*100)+"%"}}/></div>
      </div>)}

      <div className="sct">By Book</div><div className="scs">Minutes per book</div>
      {Object.entries(safeStats.bookSecs).sort((a,b)=>b[1]-a[1]).map(([b,s])=><div key={b} className="stat-row">
        <div className="stat-info"><div className="stat-label">{b}</div><div className="stat-val">{(s/60).toFixed(1)}m</div></div>
        <div className="stat-bar-track"><div className="stat-bar-fill" style={{width:Math.round(s/Math.max(1, ...Object.values(safeStats.bookSecs))*100)+"%"}}/></div>
      </div>)}
    </div>);

    if (menuSub === "settings") return (
      <div className="pg">
        <button className="sub-back" onClick={() => setMenuSub(null)}><IcoBack/> Menu</button>
        <div style={{fontFamily:"var(--ser)", fontSize:24, fontWeight:600, color:"var(--t1)", marginTop:8}}>Settings</div>

        {/* Bible Version */}
        <div style={{marginTop:28}}>
          <div style={{fontSize:12, fontWeight:700, letterSpacing:1.5, color:"var(--t3)", textTransform:"uppercase", marginBottom:12}}>Bible Version</div>
          <div style={{display:"flex", gap:8}}>
            {[{id:"kjv",label:"KJV",sub:"King James Version"},{id:"esv",label:"ESV",sub:"English Standard Version"}].map(v => (
              <div
                key={v.id}
                onClick={() => setBibleVersion(v.id)}
                style={{
                  flex:1, padding:"14px 16px", borderRadius:"var(--r)", cursor:"pointer", border: bibleVersion===v.id ? "1.5px solid var(--gold)" : "1.5px solid rgba(255,255,255,0.06)",
                  background: bibleVersion===v.id ? "var(--gd)" : "var(--bg3)", transition:"all .2s"
                }}
              >
                <div style={{fontSize:16, fontWeight:700, color: bibleVersion===v.id ? "var(--gold)" : "var(--t1)", fontFamily:"var(--san)"}}>{v.label}</div>
                <div style={{fontSize:12, color:"var(--t2)", marginTop:2}}>{v.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ESV API Key */}
        {bibleVersion === "esv" && (
          <div style={{marginTop:24}}>
            <div style={{fontSize:12, fontWeight:700, letterSpacing:1.5, color:"var(--t3)", textTransform:"uppercase", marginBottom:8}}>ESV API Key</div>
            <div style={{fontSize:13, color:"var(--t2)", marginBottom:12, lineHeight:1.6}}>
              Get a free key at{" "}
              <a href="https://api.esv.org/account/create-application/" target="_blank" rel="noreferrer" style={{color:"var(--gold)"}}>api.esv.org</a>.
              Paste it below to unlock the ESV translation.
            </div>
            <input
              className="bsi"
              type="password"
              placeholder="Paste your ESV API token here..."
              value={esvKeyDraft}
              onChange={e => setEsvKeyDraft(e.target.value)}
              style={{marginTop:0}}
            />
            <button
              className="bg"
              style={{width:"100%", marginTop:12, padding:"12px"}}
              onClick={() => { setEsvApiKey(esvKeyDraft); }}
            >
              {esvApiKey ? "Update Key" : "Save Key"}
            </button>
            {esvApiKey && (
              <button
                className="bo"
                style={{width:"100%", marginTop:8, padding:"10px"}}
                onClick={() => { setEsvApiKey(""); setEsvKeyDraft(""); setBibleVersion("kjv"); }}
              >
                Remove Key & Switch to KJV
              </button>
            )}
            {esvApiKey && (
              <div style={{marginTop:8, fontSize:12, color:"var(--gold)", textAlign:"center"}}>✓ API key saved</div>
            )}
          </div>
        )}

        {/* Reading Mode */}
        <div style={{marginTop:28}}>
          <div style={{fontSize:12, fontWeight:700, letterSpacing:1.5, color:"var(--t3)", textTransform:"uppercase", marginBottom:12}}>Reading Mode</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {[["read","Read","Text only"],["listen","Listen","Audio narration"],["both","Read + Listen","Text with synced audio"]].map(([id,t,d])=>
              <div key={id} onClick={() => setMode(id)} style={{padding:"14px 16px", borderRadius:"var(--r)", cursor:"pointer", border: mode===id ? "1.5px solid var(--gold)" : "1.5px solid rgba(255,255,255,0.06)", background: mode===id ? "var(--gd)" : "var(--bg3)", transition:"all .2s"}}>
                <div style={{fontSize:15, fontWeight:600, color: mode===id ? "var(--gold)" : "var(--t1)", fontFamily:"var(--san)"}}>{t}</div>
                <div style={{fontSize:12, color:"var(--t2)", marginTop:2}}>{d}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    );

    // Main menu
    return(<div className="pg">
      <div className="ptt">Menu</div>
      <div style={{marginTop:20}}>
        {[
          {id:"journey",name:"Journey",desc:"Your reading history and milestones"},
          {id:"stats",name:"Stats",desc:"Time breakdown by book and testament"},
          {id:"settings",name:"Settings",desc:"Bible version, reading mode, API key"},
        ].map(item=><div key={item.id} className="menu-item" onClick={()=>setMenuSub(item.id)}>
          <div className="mi-left"><div className="mi-name">{item.name}</div><div className="mi-desc">{item.desc}</div></div>
          <IcoChevR/>
        </div>)}
        {[
          {name:"About Kairos",desc:"Version, feedback, support"},
        ].map(item=><div key={item.name} className="menu-item">
          <div className="mi-left"><div className="mi-name">{item.name}</div><div className="mi-desc">{item.desc}</div></div>
          <IcoChevR/>
        </div>)}
      </div>
    </div>);
  };

  return(
    <div className="K"><style>{S}</style>
      <div className="pg-wrap" style={{position:'relative',flex:1,display:'flex',flexDirection:'column'}}>
        {inSess ? (
          renderReaderLayout({passage: readerPass, pk: biblePassage, isSession: true})
        ) : (
          <>
            {tab==="home"&&<div className={animating?"animate":""} key="home" style={{display:"flex",flexDirection:"column",flex:1}}>{renderTabHome()}</div>}
            {tab==="bible"&&<div className={animating?"animate":""} key="bible" style={{display:"flex",flexDirection:"column",flex:1}}>{renderTabBible()}</div>}
            {tab==="journeys"&&<div className={animating?"animate":""} key="journeys" style={{display:"flex",flexDirection:"column",flex:1}}>{renderTabJourneys()}</div>}
            {tab==="menu"&&<div className={animating?"animate":""} key="menu" style={{display:"flex",flexDirection:"column",flex:1}}>{renderTabMenu()}</div>}
          </>
        )}
      </div>
      {!inSess && (
        <div className="nav">
          {[["home","Today",IcoSun],["bible","Bible",IcoBook],["journeys","Journeys",IcoPath],["menu","Menu",IcoMenu]].map(([id,label,Ico])=><button key={id} className={"ni"+(tab===id?" a":"")} onClick={()=>{setTab(id);if(id==="menu")setMenuSub(null);}}><Ico/>{label}</button>)}
        </div>
      )}
      {/* Modal overlays */}
      <NotePopup key={notePopup||"none"} notePopup={notePopup} setNotePopup={setNotePopup} initialDraft={noteDraft} saveNote={saveNote} p={readerPass}/>
      <QuickJumpModal
        isOpen={showQuickJump}
        onClose={() => setShowQuickJump(false)}
        onSelect={(b, ch) => {
          setBiblePassage(b);
          setBibleChapter(ch);
          setShowQuickJump(false);
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
        }}
        books={inSess && sessJourneyId ? activeJourneys.find(j => j.id === sessJourneyId)?.books || BIBLE_BOOKS : BIBLE_BOOKS}
        currentBook={biblePassage}
        currentChapter={bibleChapter}
      />
      
      {showJComplete && (
        <JourneyCompleteModal 
          journeyName={JOURNEYS.find(j => j.id === sessJourneyId)?.name || "your journey"}
          onKeepReading={() => setShowJComplete(false)}
          onMarkComplete={() => {
            removeJourney(sessJourneyId);
            setShowJComplete(false);
            exitSess();
          }}
        />
      )}
    </div>
  );
}
