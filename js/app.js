// ============================================================
//  APP.JS — Main router + Home + Plan screens
// ============================================================

const MASTERY = 3, REVIEW_AFTER = 8, INIT_POOL = 5, ADD_BATCH = 2;

function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }
function normalize(s) { return s.toLowerCase().replace(/[,.\(\)\-\+]/g,"").replace(/\s+/g," ").trim(); }
function el(tag, attrs, ...ch) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k,v]) => {
    if (k==="style"&&typeof v==="object") Object.assign(e.style,v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(),v);
    else if (k==="class") e.className=v;
    else if (k==="disabled") e.disabled=v;
    else e.setAttribute(k,v);
  });
  ch.flat(9).forEach(c => {
    if (c==null||c===false) return;
    if (typeof c==="string"||typeof c==="number") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

// ============ PROGRESS STORAGE ============
function loadProgress(deckId) {
  try { return JSON.parse(localStorage.getItem("progress_"+deckId)) || null; }
  catch(e) { return null; }
}
function saveProgress(deckId, data) {
  try { localStorage.setItem("progress_"+deckId, JSON.stringify(data)); } catch(e) {}
}

// ============ STATE ============
let APP = {
  screen: "home", // home | plan | settings | learn | done
  deckId: null,
  modes: { flash:true, quiz4:true, write:true, match:true },
  // learn state
  wordState: {},
  pool: [],
  nextUnlocked: INIT_POOL,
  activity: null,
  flipped: false,
  quizAnswer: null,
  writeInput: "",
  writeResult: null,
  matchSelected: null,
  matchMatched: new Set(),
  matchWrong: null,
  combo: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  globalTurn: 0,
  justMastered: null,
  justAdded: null,
};

function getDeck() { return DECKS.find(d => d.id === APP.deckId); }
function getWords() { return getDeck()?.words || []; }
function getMastered() { return Object.values(APP.wordState).filter(s=>s.mastered&&!s.reviewing).length; }
function getReviewing() { return Object.values(APP.wordState).filter(s=>s.reviewing).length; }

// ============ RENDER ROUTER ============
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const wrap = el("div",{class:"app-wrap"});

  // Nav (always visible)
  const nav = renderNav();
  wrap.appendChild(nav);

  switch(APP.screen) {
    case "home": renderHome(wrap); break;
    case "plan": renderPlan(wrap); break;
    case "settings": renderSettings(wrap); break;
    case "learn": renderLearn(wrap); break;
    case "done": renderDone(wrap); break;
  }

  app.appendChild(wrap);
}

// ============ NAV ============
function renderNav() {
  return el("div", {class:"nav"},
    el("div", {class:"nav-brand", onClick:()=>{ APP.screen="home"; render(); }},
      el("div",{class:"logo"},"🇩🇪"),
      el("div",{},
        el("div",{class:"title"},"Deutsch Lernen"),
        el("div",{class:"subtitle"},"Avatar Methode"),
      ),
    ),
  );
}

// ============ HOME ============
function renderHome(wrap) {
  const sec = el("div",{class:"screen fade-up"});

  sec.appendChild(el("div",{class:"home-header"},
    el("h1",{},"Nauka słówek"),
    el("p",{},"Wybierz zestaw i ucz się przez zabawę. Każdy odcinek Avatara to nowe słówka!"),
  ));

  // Deck grid
  sec.appendChild(el("div",{class:"section-label"},"Zestawy słówek"));
  const grid = el("div",{class:"deck-grid"});

  DECKS.forEach(deck => {
    const prog = loadProgress(deck.id);
    const mastered = prog ? Object.values(prog).filter(s=>s.mastered).length : 0;
    const total = deck.words.length;
    const pct = total > 0 ? Math.round(mastered/total*100) : 0;

    const card = el("div",{class:"deck-card", onClick:()=>{
      APP.deckId=deck.id; APP.screen="settings"; render();
    }},
      el("div",{class:"deck-top"},
        el("span",{class:"deck-icon"},deck.icon),
        el("span",{class:"deck-badge",style:{background:deck.color+"18",color:deck.color,border:`1px solid ${deck.color}33`}},total+" słów"),
      ),
      el("div",{class:"deck-title"},deck.title),
      el("div",{class:"deck-subtitle"},deck.subtitle),
      el("div",{class:"deck-progress"},
        el("div",{class:"deck-progress-bar"},
          el("div",{class:"deck-progress-fill",style:{width:pct+"%",background:`linear-gradient(90deg,${deck.color},${deck.color}AA)`}}),
        ),
        el("div",{class:"deck-progress-text"},
          el("span",{},mastered>0?`${mastered}/${total} opanowane`:"Nowy zestaw"),
          pct>0?el("span",{},pct+"%"):null,
        ),
      ),
    );
    card.style.setProperty("--deck-color",deck.color);
    card.querySelector(".deck-card")?.style;
    // Left border color
    card.style.cssText += `border-left: 3px solid ${deck.color}44;`;

    grid.appendChild(card);
  });
  sec.appendChild(grid);

  // Plan card
  sec.appendChild(el("div",{class:"section-label"},"Plan nauki"));
  sec.appendChild(el("div",{class:"plan-card",onClick:()=>{APP.screen="plan";render();}},
    el("div",{class:"plan-card-header"},
      el("div",{class:"plan-icon"},"📋"),
      el("div",{class:"plan-info"},
        el("h3",{},STUDY_PLAN.title),
        el("p",{},STUDY_PLAN.duration+" · 4 fazy · codzienna rutyna"),
      ),
    ),
  ));

  wrap.appendChild(sec);
}

// ============ PLAN ============
function renderPlan(wrap) {
  const sec = el("div",{class:"screen fade-up"});

  sec.appendChild(el("button",{class:"back-btn",onClick:()=>{APP.screen="home";render();}},"← Wróć"));

  sec.appendChild(el("h2",{style:{fontSize:"24px",fontWeight:800,color:"#fff",marginBottom:"6px"}},STUDY_PLAN.title));
  sec.appendChild(el("p",{style:{fontSize:"14px",color:"var(--text-secondary)",marginBottom:"24px"}},STUDY_PLAN.duration+" · Metoda Avatara + gramatyka + fiszki"));

  // Daily routine
  sec.appendChild(el("div",{class:"section-label"},"Codzienna rutyna (~90 min)"));
  const table = el("table",{class:"daily-table"});
  STUDY_PLAN.daily.forEach(d => {
    table.appendChild(el("tr",{},
      el("td",{},d.icon),
      el("td",{},d.time),
      el("td",{style:{color:"var(--text-secondary)"}},d.task),
    ));
  });
  sec.appendChild(table);
  sec.appendChild(el("div",{style:{height:"24px"}}));

  // Phases
  sec.appendChild(el("div",{class:"section-label"},"Fazy nauki"));
  const openPhases = new Set();

  STUDY_PLAN.phases.forEach(phase => {
    const phaseEl = el("div",{class:"plan-phase"});
    const arrow = el("span",{class:"phase-arrow"},"›");
    const body = el("div",{class:"plan-phase-body"});

    const header = el("div",{class:"plan-phase-header",onClick:()=>{
      if(openPhases.has(phase.id)){openPhases.delete(phase.id);arrow.className="phase-arrow";body.className="plan-phase-body";}
      else{openPhases.add(phase.id);arrow.className="phase-arrow open";body.className="plan-phase-body open";}
    }},
      el("div",{class:"phase-left"},
        el("span",{class:"phase-icon"},phase.icon),
        el("div",{},
          el("div",{class:"phase-title"},`Faza ${phase.id}: ${phase.title}`),
          el("div",{class:"phase-weeks"},`${phase.weeks} · ${phase.hours}`),
        ),
      ),
      arrow,
    );

    // Body
    body.appendChild(el("div",{class:"plan-tip"},"💡 "+phase.tip));
    phase.sections.forEach(s => {
      body.appendChild(el("div",{class:"plan-section-title",style:{color:phase.color}},s.title));
      s.items.forEach(item => {
        const li = el("div",{class:"plan-section-item"},item);
        li.style.cssText += `--dot-color:${phase.color};`;
        li.querySelector("::before")?.style;
        // Manually style the dot
        const dot = document.createElement("style");
        body.appendChild(li);
      });
    });

    phaseEl.appendChild(header);
    phaseEl.appendChild(body);
    sec.appendChild(phaseEl);
  });

  wrap.appendChild(sec);
}

// ============ SETTINGS ============
function renderSettings(wrap) {
  const deck = getDeck();
  if(!deck){APP.screen="home";render();return;}

  const sec = el("div",{class:"screen fade-up"});
  sec.appendChild(el("button",{class:"back-btn",onClick:()=>{APP.screen="home";render();}},"← Wróć"));

  sec.appendChild(el("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"6px"}},
    el("span",{style:{fontSize:"32px"}},deck.icon),
    el("h2",{style:{fontSize:"22px",fontWeight:800,color:"#fff"}},deck.title),
  ));
  sec.appendChild(el("p",{style:{fontSize:"14px",color:"var(--text-secondary)",marginBottom:"24px"}},
    deck.subtitle+" · "+deck.words.length+" słówek"
  ));

  sec.appendChild(el("div",{class:"section-label"},"Tryby nauki"));

  const modes = [
    {id:"flash",icon:"🔄",label:"Fiszki",desc:"Odkrywasz odpowiedź i oceniasz",color:"var(--blue)"},
    {id:"quiz4",icon:"🎯",label:"Quiz",desc:"4 odpowiedzi do wyboru",color:"var(--green)"},
    {id:"write",icon:"✍️",label:"Pisanie",desc:"Wpisujesz tłumaczenie sam",color:"var(--orange)"},
    {id:"match",icon:"🧩",label:"Dopasuj",desc:"Łączysz słówka w pary",color:"var(--gold)"},
  ];

  const grid = el("div",{class:"settings-grid"});
  modes.forEach(m => {
    const on = APP.modes[m.id];
    const btn = el("button",{class:"toggle-btn"+(on?" on":""),onClick:()=>{
      const others = Object.entries(APP.modes).filter(([k,v])=>k!==m.id&&v);
      if(on&&others.length===0)return;
      APP.modes[m.id]=!on; render();
    }},
      el("span",{class:"t-icon"},m.icon),
      el("div",{class:"t-body"},
        el("div",{class:"t-label"},m.label),
        el("div",{class:"t-desc"},m.desc),
      ),
      el("div",{class:"t-check"},on?"✓":""),
    );
    grid.appendChild(btn);
  });
  sec.appendChild(grid);

  sec.appendChild(el("div",{class:"info-box"},
    "💡 ", el("strong",{},"Jak działa nauka: "),
    `Zaczynasz od ${INIT_POOL} słówek. Mieszam wybrane tryby. `,
    "Opanowane (3× dobrze) → dodaję nowe. ",
    "Błędne wracają po kilku turach, nie od razu. ",
    "Opanowane sprawdzam ponownie po ~8 turach.",
  ));

  // Check saved progress
  const prog = loadProgress(deck.id);
  const hasProg = prog && Object.keys(prog).length > 0;
  const masteredCount = hasProg ? Object.values(prog).filter(s=>s.mastered).length : 0;

  if(hasProg) {
    sec.appendChild(el("div",{style:{
      padding:"12px 16px",borderRadius:"var(--radius-sm)",
      background:"var(--blue-bg)",border:"1px solid rgba(66,165,245,0.2)",
      fontSize:"13px",color:"var(--blue)",marginBottom:"16px",lineHeight:"1.5",
    }},
      `📊 Masz zapisany postęp: ${masteredCount}/${deck.words.length} opanowane. `,
      el("span",{style:{textDecoration:"underline",cursor:"pointer"},onClick:()=>{
        localStorage.removeItem("progress_"+deck.id); render();
      }},"Resetuj postęp"),
    ));
  }

  sec.appendChild(el("button",{class:"primary-btn",onClick:()=>startLearn(hasProg?prog:null)},
    hasProg ? "Kontynuuj naukę 🚀" : "Zaczynamy! 🚀"
  ));

  wrap.appendChild(sec);
}

// ============ START LEARN ============
function startLearn(savedProg) {
  const words = getWords();
  if(savedProg) {
    APP.wordState = {};
    const maxIdx = Object.keys(savedProg).reduce((m,k)=>Math.max(m,parseInt(k)),0);
    Object.entries(savedProg).forEach(([k,v])=>{
      APP.wordState[parseInt(k)] = {...v, cooldown:0, reviewing:false};
    });
    APP.pool = Object.keys(APP.wordState).map(Number);
    APP.nextUnlocked = Math.max(APP.pool.length, INIT_POOL);
  } else {
    APP.wordState = {};
    for(let i=0;i<Math.min(INIT_POOL,words.length);i++)
      APP.wordState[i]={streak:0,seen:0,lastWrong:false,cooldown:0,mastered:false,masteredAt:null,reviewing:false};
    APP.pool=[...Array(Math.min(INIT_POOL,words.length)).keys()];
    APP.nextUnlocked=Math.min(INIT_POOL,words.length);
  }
  APP.screen="learn";
  APP.combo=0;APP.totalAnswered=0;APP.totalCorrect=0;APP.globalTurn=0;
  pickNext();
}

// ============ PICK NEXT ============
function enabledModes(){
  const m=[];
  if(APP.modes.flash)m.push("flash");
  if(APP.modes.quiz4)m.push("quiz4");
  if(APP.modes.write)m.push("write");
  if(APP.modes.match)m.push("match");
  return m.length?m:["flash"];
}

function pickActivityType(streak){
  const avail=enabledModes();
  if(avail.length===1)return avail[0];
  let cands;
  if(streak===0)cands=avail.filter(m=>m==="flash"||m==="quiz4");
  else if(streak===1)cands=avail.filter(m=>m==="quiz4"||m==="flash");
  else if(streak===2)cands=avail.filter(m=>m==="write"||m==="quiz4");
  else cands=avail.filter(m=>m!=="flash");
  if(!cands.length)cands=avail;
  return shuffle(cands)[0];
}

function pickNext(){
  APP.flipped=false;APP.quizAnswer=null;APP.writeInput="";APP.writeResult=null;
  APP.matchSelected=null;APP.matchMatched=new Set();APP.matchWrong=null;
  APP.justMastered=null;APP.justAdded=null;
  APP.globalTurn++;
  const words=getWords();

  APP.pool.forEach(i=>{if(APP.wordState[i]&&APP.wordState[i].cooldown>0)APP.wordState[i].cooldown--;});

  // Review candidate
  let reviewCand=null;
  APP.pool.forEach(i=>{
    const ws=APP.wordState[i];
    if(ws&&ws.mastered&&!ws.reviewing&&ws.masteredAt&&(APP.globalTurn-ws.masteredAt)>=REVIEW_AFTER){
      if(!reviewCand||(APP.globalTurn-ws.masteredAt)>(APP.globalTurn-(APP.wordState[reviewCand]?.masteredAt||0)))
        reviewCand=i;
    }
  });

  const active=APP.pool.filter(i=>{
    const ws=APP.wordState[i];
    if(!ws)return false;
    if(ws.mastered&&!ws.reviewing)return false;
    if(ws.cooldown>0)return false;
    if(ws.streak>=MASTERY&&!ws.reviewing)return false;
    return true;
  });

  if(reviewCand!==null&&(Math.random()<0.2||active.length===0)){
    APP.wordState[reviewCand].reviewing=true;
    APP.wordState[reviewCand].streak=MASTERY-1;
    APP.wordState[reviewCand].mastered=false;
    setActivity(reviewCand);render();return;
  }

  if(active.length===0){
    const allM=APP.pool.every(i=>APP.wordState[i]?.mastered);
    if(allM&&APP.nextUnlocked>=words.length){
      saveCurrentProgress();APP.screen="done";render();return;
    }
    const cdCards=APP.pool.filter(i=>{const ws=APP.wordState[i];return ws&&!ws.mastered&&ws.cooldown>0;});
    if(cdCards.length>0){
      cdCards.sort((a,b)=>(APP.wordState[a].cooldown||0)-(APP.wordState[b].cooldown||0));
      APP.wordState[cdCards[0]].cooldown=0;
      setActivity(cdCards[0]);render();return;
    }
    saveCurrentProgress();APP.screen="done";render();return;
  }

  const weighted=active.map(i=>{
    const s=APP.wordState[i]||{streak:0,seen:0,lastWrong:false};
    let w=10;if(s.lastWrong)w+=20;if(s.seen===0)w+=15;if(s.reviewing)w+=10;w+=(MASTERY-s.streak)*5;
    return{idx:i,weight:w};
  });
  const totalW=weighted.reduce((a,b)=>a+b.weight,0);
  let r=Math.random()*totalW,chosen=weighted[0].idx;
  for(const w of weighted){r-=w.weight;if(r<=0){chosen=w.idx;break;}}

  setActivity(chosen);render();
}

function setActivity(wordIdx){
  const words=getWords();
  const s=APP.wordState[wordIdx]||{streak:0};
  const type=pickActivityType(s.streak);

  if(type==="match"){
    const others=shuffle(APP.pool.filter(i=>i!==wordIdx)).slice(0,3);
    const mw=shuffle([wordIdx,...others]);
    const lefts=shuffle(mw.map((wi,i)=>({id:"l"+i,text:words[wi][0],pairId:wi,side:"left"})));
    const rights=shuffle(mw.map((wi,i)=>({id:"r"+i,text:words[wi][1],pairId:wi,side:"right"})));
    APP.activity={type:"match",wordIdx,matchPairs:[...lefts,...rights],matchWords:mw};
  } else if(type==="quiz4"){
    const otherIdxs=shuffle([...Array(words.length).keys()].filter(i=>i!==wordIdx)).slice(0,3);
    APP.activity={type:"quiz4",wordIdx,options:shuffle([wordIdx,...otherIdxs])};
  } else {
    APP.activity={type,wordIdx};
  }
}

function saveCurrentProgress(){
  if(!APP.deckId)return;
  const toSave={};
  Object.entries(APP.wordState).forEach(([k,v])=>{
    toSave[k]={streak:v.streak,seen:v.seen,mastered:v.mastered,masteredAt:v.masteredAt};
  });
  saveProgress(APP.deckId,toSave);
}

// ============ HANDLE ANSWER ============
function handleAnswer(wordIdx,correct){
  const words=getWords();
  APP.totalAnswered++;if(correct)APP.totalCorrect++;
  const prev=APP.wordState[wordIdx]||{streak:0,seen:0,lastWrong:false,cooldown:0};

  if(correct){
    APP.wordState[wordIdx]={...prev,streak:prev.streak+1,seen:prev.seen+1,lastWrong:false,cooldown:0};
    APP.combo++;
  } else {
    const cd=3+Math.floor(Math.random()*3);
    APP.wordState[wordIdx]={...prev,streak:Math.max(0,prev.streak-1),seen:prev.seen+1,lastWrong:true,cooldown:cd};
    APP.combo=0;
  }

  const ws=APP.wordState[wordIdx];
  if(correct&&ws.streak>=MASTERY&&!ws.mastered){
    ws.mastered=true;ws.masteredAt=APP.globalTurn;ws.reviewing=false;
    APP.justMastered=wordIdx;
    if(APP.nextUnlocked<words.length){
      const toAdd=Math.min(ADD_BATCH,words.length-APP.nextUnlocked);
      for(let i=0;i<toAdd;i++){
        const ni=APP.nextUnlocked+i;
        APP.pool.push(ni);
        APP.wordState[ni]={streak:0,seen:0,lastWrong:false,cooldown:0,mastered:false,masteredAt:null,reviewing:false};
      }
      APP.justAdded=toAdd;APP.nextUnlocked+=toAdd;
    }
    saveCurrentProgress();render();setTimeout(()=>pickNext(),1800);
  } else if(correct&&ws.reviewing&&ws.streak>=MASTERY){
    ws.mastered=true;ws.masteredAt=APP.globalTurn;ws.reviewing=false;
    APP.justMastered=wordIdx;
    saveCurrentProgress();render();setTimeout(()=>pickNext(),1800);
  } else {
    saveCurrentProgress();render();setTimeout(()=>pickNext(),correct?600:1500);
  }
}

// ============ RENDER LEARN ============
function renderLearn(wrap) {
  const act=APP.activity;
  if(!act){pickNext();return;}
  const words=getWords();
  const deck=getDeck();
  const mastered=getMastered();
  const reviewing=getReviewing();
  const inProg=APP.pool.filter(i=>{const ws=APP.wordState[i];return ws&&!ws.mastered;}).length;
  const ws=APP.wordState[act.wordIdx]||{streak:0};
  const card=words[act.wordIdx];

  const sec = el("div",{class:"screen"});

  // Header
  const hdr=el("div",{class:"learn-header"});
  hdr.appendChild(el("div",{class:"learn-stats"},
    el("div",{},
      el("span",{class:"learn-count"},""+mastered),
      el("span",{class:"learn-count"}," "),
      el("span",{class:"learn-count",style:{fontSize:"12px",color:"var(--text-dim)",fontWeight:500}},`/ ${words.length}`),
    ),
    el("div",{class:"learn-pills"},
      APP.combo>=3?el("span",{class:"pill",style:{background:"var(--gold-bg)",color:"var(--gold)",border:"1px solid rgba(255,215,64,0.2)"}},"🔥 "+APP.combo):null,
      reviewing>0?el("span",{class:"pill",style:{background:"var(--blue-bg)",color:"var(--blue)",border:"1px solid rgba(66,165,245,0.2)"}},"🔍 "+reviewing):null,
      el("span",{class:"pill",style:{background:"var(--orange-bg)",color:"var(--orange)",border:"1px solid rgba(255,183,77,0.2)"}},"📖 "+inProg),
    ),
  ));

  hdr.appendChild(el("div",{class:"progress-bar"},
    el("div",{class:"progress-fill",style:{width:(mastered/words.length*100)+"%"}}),
  ));

  const pips=el("div",{class:"pips"});
  APP.pool.slice(0,35).forEach(i=>{
    const s=APP.wordState[i]||{streak:0};
    const done=s.mastered&&!s.reviewing;
    const rev=s.reviewing;
    const cur=act.wordIdx===i||(act.matchWords&&act.matchWords.includes(i));
    const cd=s.cooldown>0;
    let bg="var(--border)";
    if(done)bg="var(--green)";else if(rev)bg="var(--blue)";else if(cur)bg="#fff";
    else if(cd)bg="rgba(255,82,82,0.5)";else if(s.streak>0)bg="var(--orange)";
    pips.appendChild(el("div",{class:"pip",style:{background:bg,opacity:done?"0.5":"1"}}));
  });
  if(APP.pool.length>35)pips.appendChild(el("span",{style:{fontSize:"10px",color:"var(--text-dim)",alignSelf:"center",marginLeft:"4px"}},`+${APP.pool.length-35}`));
  hdr.appendChild(pips);
  sec.appendChild(hdr);

  // Badge
  const colors={flash:"var(--blue)",quiz4:"var(--green)",write:"var(--orange)",match:"var(--gold)"};
  const bgcolors={flash:"var(--blue-bg)",quiz4:"var(--green-bg)",write:"var(--orange-bg)",match:"var(--gold-bg)"};
  const labels={flash:"🔄 Fiszka",quiz4:"🎯 Quiz",write:"✍️ Napisz",match:"🧩 Dopasuj"};

  let dots="";for(let i=0;i<MASTERY;i++) dots+=(i<ws.streak?'<span style="color:var(--green)">●</span>':'<span style="color:var(--border)">●</span>');

  const badge=el("div",{class:"activity-badge fade-in"},
    el("span",{class:"badge",style:{background:bgcolors[act.type],color:colors[act.type],border:`1px solid ${colors[act.type]}33`.replace("var(","").replace(")","")+"33"}},labels[act.type]),
    ws.reviewing?el("span",{class:"badge",style:{background:"var(--blue-bg)",color:"var(--blue)",border:"1px solid rgba(66,165,245,0.2)"}},"🔍 Powtórka"):null,
  );
  const dotsEl=el("span",{class:"streak-dots"});dotsEl.innerHTML=dots;
  badge.appendChild(dotsEl);
  sec.appendChild(badge);

  // Activity content
  const content=el("div",{class:"fade-in",style:{width:"100%"}});

  if(act.type==="flash") renderFlashCard(content,act,card,words);
  else if(act.type==="quiz4") renderQuizCard(content,act,card,words);
  else if(act.type==="write") renderWriteCard(content,act,card,words);
  else if(act.type==="match") renderMatchCard(content,act,words);

  sec.appendChild(content);

  // Overlay
  if(APP.justMastered!==null){
    const w=words[APP.justMastered];
    sec.appendChild(el("div",{class:"overlay"},
      el("div",{class:"star"},"⭐"),
      el("div",{style:{fontSize:"22px",fontWeight:800,color:"var(--green)",marginBottom:"4px"}},"Słówko opanowane!"),
      el("div",{style:{fontSize:"18px",fontWeight:600,color:"#fff",marginBottom:"8px"}},w[0]+" = "+w[1]),
      APP.justAdded?el("div",{style:{fontSize:"14px",color:"var(--orange)",fontWeight:600}},"+"+APP.justAdded+" nowe słówka w puli"):null,
    ));
  }

  // Quit button
  sec.appendChild(el("div",{style:{textAlign:"center",marginTop:"32px"}},
    el("button",{class:"back-btn",style:{margin:"0 auto"},onClick:()=>{saveCurrentProgress();APP.screen="home";render();}},"← Zakończ naukę"),
  ));

  wrap.appendChild(sec);
}

// ============ FLASH ============
function renderFlashCard(wrap,act,card){
  const fc=el("div",{class:"flash-card",style:{
    background:APP.flipped?`linear-gradient(145deg,rgba(0,199,100,0.06),var(--card))`:"var(--card)",
    border:`1px solid ${APP.flipped?"var(--green-border)":"var(--border)"}`,
  },onClick:()=>{APP.flipped=!APP.flipped;render();}},
    el("div",{class:"card-label"},APP.flipped?"PO POLSKU":"AUF DEUTSCH"),
    el("div",{class:"card-word",style:{fontSize:APP.flipped?"24px":"28px",color:APP.flipped?"var(--green)":"#fff"}},APP.flipped?card[1]:card[0]),
    el("div",{class:"card-hint"},APP.flipped?"Kliknij żeby wrócić":"Kliknij żeby odkryć"),
  );
  wrap.appendChild(fc);

  if(APP.flipped){
    wrap.appendChild(el("div",{class:"answer-buttons"},
      el("button",{class:"answer-btn",style:{border:`1px solid var(--red-border)`,background:"var(--red-bg)",color:"var(--red)"},onClick:()=>handleAnswer(act.wordIdx,false)},"Nie wiem 😕"),
      el("button",{class:"answer-btn",style:{border:`1px solid var(--green-border)`,background:"var(--green-bg)",color:"var(--green)"},onClick:()=>handleAnswer(act.wordIdx,true)},"Wiem! ✓"),
    ));
  }
}

// ============ QUIZ ============
function renderQuizCard(wrap,act,card,words){
  wrap.appendChild(el("div",{class:"question-box"},
    el("div",{class:"q-label"},"Co znaczy:"),
    el("div",{class:"q-word"},card[0]),
  ));
  const opts=el("div",{class:"quiz-options"});
  act.options.forEach((optIdx,i)=>{
    const opt=words[optIdx];
    const isCorrect=optIdx===act.wordIdx;
    const isSel=APP.quizAnswer===i;
    const show=APP.quizAnswer!==null;
    let bg="var(--card)",bc="var(--border)",tc="var(--text)",op="1";
    if(show&&isCorrect){bg="var(--green-bg)";bc="var(--green-border)";tc="var(--green)";}
    if(show&&isSel&&!isCorrect){bg="var(--red-bg)";bc="var(--red-border)";tc="var(--red)";}
    if(show&&!isCorrect&&!isSel)op="0.35";
    const btn=el("button",{class:"quiz-opt",style:{border:`1px solid ${bc}`,background:bg,color:tc,opacity:op,cursor:show?"default":"pointer"}},opt[1]);
    if(!show)btn.addEventListener("click",()=>{APP.quizAnswer=i;render();handleAnswer(act.wordIdx,isCorrect);});
    opts.appendChild(btn);
  });
  wrap.appendChild(opts);
}

// ============ WRITE ============
function renderWriteCard(wrap,act,card){
  wrap.appendChild(el("div",{class:"question-box"},
    el("div",{class:"q-label"},"Przetłumacz:"),
    el("div",{class:"q-word"},card[0]),
  ));
  const bc=APP.writeResult==="correct"?"var(--green)":APP.writeResult==="wrong"?"var(--red)":"var(--border)";
  const input=el("input",{class:"write-input",style:{borderColor:bc},placeholder:"Wpisz tłumaczenie...",value:APP.writeInput,disabled:!!APP.writeResult});
  input.addEventListener("input",e=>{APP.writeInput=e.target.value;});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!APP.writeResult)doCheck();});
  wrap.appendChild(input);
  setTimeout(()=>input.focus(),50);

  function doCheck(){
    const answers=card[1].split(",").map(s=>normalize(s));
    const inp=normalize(APP.writeInput);
    const ok=answers.some(a=>{if(inp===a)return true;if(a.includes(inp)&&inp.length>3)return true;return false;});
    APP.writeResult=ok?"correct":"wrong";
    render();
    setTimeout(()=>handleAnswer(act.wordIdx,ok),ok?800:2000);
  }

  if(!APP.writeResult){
    wrap.appendChild(el("button",{class:"primary-btn",style:{marginTop:"10px"},onClick:doCheck},"Sprawdź"));
  } else {
    wrap.appendChild(el("div",{class:"result-box",style:{
      background:APP.writeResult==="correct"?"var(--green-bg)":"var(--red-bg)",
      border:`1px solid ${APP.writeResult==="correct"?"var(--green-border)":"var(--red-border)"}`,
    }},
      el("div",{class:"result-label",style:{color:APP.writeResult==="correct"?"var(--green)":"var(--red)"}},APP.writeResult==="correct"?"Dobrze! ✓":"Poprawna odpowiedź:"),
      el("div",{class:"result-word"},card[1]),
    ));
  }
}

// ============ MATCH ============
function renderMatchCard(wrap,act,words){
  const pairs=act.matchPairs||[];
  const lefts=pairs.filter(p=>p.side==="left");
  const rights=pairs.filter(p=>p.side==="right");
  const grid=el("div",{class:"match-grid"});

  [lefts,rights].forEach(side=>{
    const col=el("div",{class:"match-col"});
    side.forEach(item=>{
      const isM=APP.matchMatched.has(item.pairId+item.side);
      const isSel=APP.matchSelected?.id===item.id;
      const isW=APP.matchWrong?.includes(item.id);
      let bg="var(--card)",bc="var(--border)",tc="var(--text)",op="1",td="none";
      if(isM){bg="var(--green-bg)";bc="var(--green-border)";tc="rgba(0,230,118,0.5)";op="0.45";td="line-through";}
      if(isW){bg="var(--red-bg)";bc="var(--red-border)";tc="var(--red)";}
      if(isSel){bg="var(--green-bg)";bc="var(--green-border)";}
      const btn=el("button",{class:"match-btn",style:{border:`2px solid ${bc}`,background:bg,color:tc,opacity:op,textDecoration:td}},item.text);
      if(!isM)btn.addEventListener("click",()=>{
        if(!APP.matchSelected){APP.matchSelected=item;APP.matchWrong=null;render();return;}
        if(APP.matchSelected.id===item.id){APP.matchSelected=null;render();return;}
        if(APP.matchSelected.side===item.side){APP.matchSelected=item;render();return;}
        if(APP.matchSelected.pairId===item.pairId){
          APP.matchMatched.add(item.pairId+"left");APP.matchMatched.add(item.pairId+"right");
          APP.matchSelected=null;
          const total=(act.matchWords?.length||4)*2;
          if(APP.matchMatched.size>=total){
            APP.totalAnswered++;APP.totalCorrect++;APP.combo++;
            act.matchWords.forEach(wi=>{
              const prev=APP.wordState[wi]||{streak:0,seen:0,lastWrong:false,cooldown:0};
              APP.wordState[wi]={...prev,streak:prev.streak+1,seen:prev.seen+1,lastWrong:false};
            });
            saveCurrentProgress();render();setTimeout(()=>pickNext(),1000);
          } else render();
        } else {
          APP.matchWrong=[APP.matchSelected.id,item.id];APP.combo=0;render();
          setTimeout(()=>{APP.matchWrong=null;APP.matchSelected=null;render();},500);
        }
      });
      col.appendChild(btn);
    });
    grid.appendChild(col);
  });
  wrap.appendChild(grid);
}

// ============ DONE ============
function renderDone(wrap){
  const words=getWords();
  const pct=APP.totalAnswered>0?Math.round(APP.totalCorrect/APP.totalAnswered*100):0;
  wrap.appendChild(el("div",{class:"done-screen fade-up"},
    el("div",{class:"trophy"},"🏆"),
    el("h2",{style:{fontSize:"28px",fontWeight:800,color:"#fff",marginBottom:"8px"}},"Wszystko opanowane!"),
    el("p",{style:{fontSize:"15px",color:"var(--text-dim)",marginBottom:"24px"}},`${words.length} / ${words.length} słówek`),
    el("div",{class:"done-stats"},
      el("div",{},el("div",{class:"done-stat-value",style:{color:"var(--green)"}},""+APP.totalCorrect),el("div",{class:"done-stat-label"},"dobrze")),
      el("div",{},el("div",{class:"done-stat-value"},""+pct+"%"),el("div",{class:"done-stat-label"},"celność")),
    ),
    el("div",{class:"done-actions"},
      el("button",{class:"primary-btn",style:{width:"auto",padding:"14px 32px"},onClick:()=>{APP.screen="settings";render();}},"Jeszcze raz"),
      el("button",{class:"secondary-btn",onClick:()=>{APP.screen="home";render();}},"Menu"),
    ),
  ));
}

// ============ INIT ============
render();
