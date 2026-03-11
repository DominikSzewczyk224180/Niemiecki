// ============================================================
//  APP.JS — with Text-to-Speech for learning
// ============================================================
var MASTERY=3,REVIEW_AFTER=8,INIT_POOL=5,ADD_BATCH=2;
function shuffle(a){var b=[...a];for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function normalize(s){return s.toLowerCase().replace(/[,.\(\)\-\+]/g,"").replace(/\s+/g," ").trim();}
function el(tag,attrs){var e=document.createElement(tag);if(attrs)Object.entries(attrs).forEach(function(kv){var k=kv[0],v=kv[1];if(k==="style"&&typeof v==="object")Object.assign(e.style,v);else if(k.startsWith("on"))e.addEventListener(k.slice(2).toLowerCase(),v);else if(k==="class")e.className=v;else if(k==="disabled")e.disabled=v;else e.setAttribute(k,v);});var ch=Array.prototype.slice.call(arguments,2);ch.flat(9).forEach(function(c){if(c==null||c===false)return;if(typeof c==="string"||typeof c==="number")e.appendChild(document.createTextNode(c));else e.appendChild(c);});return e;}

// ============ TTS ============
function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text.replace(/[,.\(\)\-]/g," ").replace(/\s+/g," ").trim());
  u.lang = lang === "pl" ? "pl-PL" : "de-DE";
  u.rate = 0.85;
  u.pitch = 1;
  // Try to find a good voice
  var voices = window.speechSynthesis.getVoices();
  var match = voices.find(function(v){ return v.lang.startsWith(lang === "pl" ? "pl" : "de"); });
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}
// Preload voices
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = function(){ window.speechSynthesis.getVoices(); };
}

// ============ STORAGE ============
function loadProgress(id){try{return JSON.parse(localStorage.getItem("progress_"+id))||null;}catch(e){return null;}}
function saveProgress(id,d){try{localStorage.setItem("progress_"+id,JSON.stringify(d));}catch(e){}}

// ============ STATE ============
var APP={screen:"home",deckId:null,modes:{flash:true,quiz4:true,write:true,match:true},wordState:{},pool:[],nextUnlocked:INIT_POOL,activity:null,flipped:false,quizAnswer:null,writeInput:"",writeResult:null,matchSelected:null,matchMatched:new Set(),matchWrong:null,combo:0,totalAnswered:0,totalCorrect:0,globalTurn:0,justMastered:null,justAdded:null};

function getDeck(){return DECKS.find(function(d){return d.id===APP.deckId;});}
function getWords(){var d=getDeck();return d?d.words:[];}
function getMastered(){return Object.values(APP.wordState).filter(function(s){return s.mastered&&!s.reviewing;}).length;}
function getReviewing(){return Object.values(APP.wordState).filter(function(s){return s.reviewing;}).length;}

// ============ RENDER ============
function render(){
  var app=document.getElementById("app");app.innerHTML="";
  var wrap=el("div",{class:"app-wrap"});
  wrap.appendChild(renderNav());
  switch(APP.screen){
    case"home":renderHome(wrap);break;case"plan":renderPlan(wrap);break;
    case"settings":renderSettings(wrap);break;case"learn":renderLearn(wrap);break;
    case"done":renderDone(wrap);break;
  }
  app.appendChild(wrap);
}

function renderNav(){
  return el("div",{class:"nav"},
    el("div",{class:"nav-brand",onClick:function(){APP.screen="home";render();}},
      el("div",{class:"logo"},"🇩🇪"),
      el("div",{},el("div",{class:"title"},"Deutsch Lernen"),el("div",{class:"subtitle"},"Avatar Methode"))
    )
  );
}

// ============ HOME ============
function renderHome(wrap){
  var sec=el("div",{class:"screen fade-up"});
  sec.appendChild(el("div",{class:"home-header"},el("h1",{},"Nauka słówek"),el("p",{},"Wybierz zestaw i ucz się przez zabawę!")));
  sec.appendChild(el("div",{class:"section-label"},"Zestawy słówek"));
  var grid=el("div",{class:"deck-grid"});
  DECKS.forEach(function(deck){
    var prog=loadProgress(deck.id);
    var mastered=prog?Object.values(prog).filter(function(s){return s.mastered;}).length:0;
    var total=deck.words.length;
    var pct=total>0?Math.round(mastered/total*100):0;
    var card=el("div",{class:"deck-card",style:{borderLeft:"4px solid "+deck.color+"66"},onClick:function(){APP.deckId=deck.id;APP.screen="settings";render();}},
      el("div",{class:"deck-top"},el("span",{class:"deck-icon"},deck.icon),el("span",{class:"deck-badge",style:{background:deck.color+"14",color:deck.color,border:"1px solid "+deck.color+"33"}},total+" słów")),
      el("div",{class:"deck-title"},deck.title),el("div",{class:"deck-subtitle"},deck.subtitle),
      el("div",{class:"deck-progress"},el("div",{class:"deck-progress-bar"},el("div",{class:"deck-progress-fill",style:{width:pct+"%",background:"linear-gradient(90deg,"+deck.color+","+deck.color+"AA)"}})),
        el("div",{class:"deck-progress-text"},el("span",{},mastered>0?mastered+"/"+total+" opanowane":"Nowy zestaw"),pct>0?el("span",{},pct+"%"):null))
    );
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  sec.appendChild(el("div",{class:"section-label"},"Plan nauki"));
  sec.appendChild(el("div",{class:"plan-card",onClick:function(){APP.screen="plan";render();}},
    el("div",{class:"plan-card-header"},el("div",{class:"plan-icon"},"📋"),el("div",{class:"plan-info"},el("h3",{},STUDY_PLAN.title),el("p",{},STUDY_PLAN.duration+" · 4 fazy · codzienna rutyna")))
  ));
  wrap.appendChild(sec);
}

// ============ PLAN ============
function renderPlan(wrap){
  var sec=el("div",{class:"screen fade-up"});
  sec.appendChild(el("button",{class:"back-btn",onClick:function(){APP.screen="home";render();}},"← Wróć"));
  sec.appendChild(el("h2",{style:{fontSize:"24px",fontWeight:800,marginBottom:"6px"}},STUDY_PLAN.title));
  sec.appendChild(el("p",{style:{fontSize:"14px",color:"var(--text-secondary)",marginBottom:"24px"}},STUDY_PLAN.duration+" · Metoda Avatara + gramatyka + fiszki"));
  sec.appendChild(el("div",{class:"section-label"},"Codzienna rutyna (~90 min)"));
  var table=el("table",{class:"daily-table"});
  STUDY_PLAN.daily.forEach(function(d){table.appendChild(el("tr",{},el("td",{},d.icon),el("td",{},d.time),el("td",{style:{color:"var(--text-secondary)"}},d.task)));});
  sec.appendChild(table);
  sec.appendChild(el("div",{style:{height:"24px"}}));
  sec.appendChild(el("div",{class:"section-label"},"Fazy nauki"));
  var openPhases={};
  STUDY_PLAN.phases.forEach(function(phase){
    var phaseEl=el("div",{class:"plan-phase"});
    var arrow=el("span",{class:"phase-arrow"},"›");
    var body=el("div",{class:"plan-phase-body"});
    phaseEl.appendChild(el("div",{class:"plan-phase-header",onClick:function(){
      if(openPhases[phase.id]){delete openPhases[phase.id];arrow.className="phase-arrow";body.className="plan-phase-body";}
      else{openPhases[phase.id]=true;arrow.className="phase-arrow open";body.className="plan-phase-body open";}
    }},el("div",{class:"phase-left"},el("span",{class:"phase-icon"},phase.icon),el("div",{},el("div",{class:"phase-title"},"Faza "+phase.id+": "+phase.title),el("div",{class:"phase-weeks"},phase.weeks+" · "+phase.hours))),arrow));
    body.appendChild(el("div",{class:"plan-tip"},"💡 "+phase.tip));
    phase.sections.forEach(function(s){
      body.appendChild(el("div",{class:"plan-section-title",style:{color:phase.color}},s.title));
      s.items.forEach(function(item){body.appendChild(el("div",{class:"plan-section-item"},item));});
    });
    phaseEl.appendChild(body);sec.appendChild(phaseEl);
  });
  wrap.appendChild(sec);
}

// ============ SETTINGS ============
function renderSettings(wrap){
  var deck=getDeck();if(!deck){APP.screen="home";render();return;}
  var sec=el("div",{class:"screen fade-up"});
  sec.appendChild(el("button",{class:"back-btn",onClick:function(){APP.screen="home";render();}},"← Wróć"));
  sec.appendChild(el("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"6px"}},el("span",{style:{fontSize:"32px"}},deck.icon),el("h2",{style:{fontSize:"22px",fontWeight:800}},deck.title)));
  sec.appendChild(el("p",{style:{fontSize:"14px",color:"var(--text-secondary)",marginBottom:"24px"}},deck.subtitle+" · "+deck.words.length+" słówek"));
  sec.appendChild(el("div",{class:"section-label"},"Tryby nauki"));
  var modes=[{id:"flash",icon:"🔄",label:"Fiszki",desc:"Odkrywasz odpowiedź i oceniasz",color:"var(--blue)"},{id:"quiz4",icon:"🎯",label:"Quiz",desc:"4 odpowiedzi do wyboru",color:"var(--green)"},{id:"write",icon:"✍️",label:"Pisanie",desc:"Wpisujesz tłumaczenie sam",color:"var(--orange)"},{id:"match",icon:"🧩",label:"Dopasuj",desc:"Łączysz słówka w pary",color:"var(--gold)"}];
  var grid=el("div",{class:"settings-grid"});
  modes.forEach(function(m){
    var on=APP.modes[m.id];
    grid.appendChild(el("button",{class:"toggle-btn"+(on?" on":""),onClick:function(){var others=Object.entries(APP.modes).filter(function(kv){return kv[0]!==m.id&&kv[1];});if(on&&others.length===0)return;APP.modes[m.id]=!on;render();}},
      el("span",{class:"t-icon"},m.icon),el("div",{class:"t-body"},el("div",{class:"t-label"},m.label),el("div",{class:"t-desc"},m.desc)),el("div",{class:"t-check"},on?"✓":"")
    ));
  });
  sec.appendChild(grid);
  sec.appendChild(el("div",{class:"info-box"},"💡 ",el("strong",{},"Jak działa: "),"Zaczynasz od "+INIT_POOL+" słówek. Mieszam tryby. Opanowane (3× dobrze) → dodaję nowe. Błędne wracają po kilku turach. Opanowane sprawdzam po ~8 turach. ","🔊 ",el("strong",{},"Lektor "),"czyta słówka automatycznie!"));
  var prog=loadProgress(deck.id);var hasProg=prog&&Object.keys(prog).length>0;
  var masteredCount=hasProg?Object.values(prog).filter(function(s){return s.mastered;}).length:0;
  if(hasProg){
    sec.appendChild(el("div",{style:{padding:"12px 16px",borderRadius:"var(--radius-sm)",background:"var(--blue-bg)",border:"1px solid var(--blue-border)",fontSize:"13px",color:"var(--blue)",marginBottom:"16px",lineHeight:"1.5"}},
      "📊 Postęp: "+masteredCount+"/"+deck.words.length+" opanowane. ",el("span",{style:{textDecoration:"underline",cursor:"pointer"},onClick:function(){localStorage.removeItem("progress_"+deck.id);render();}},"Resetuj")
    ));
  }
  sec.appendChild(el("button",{class:"primary-btn",onClick:function(){startLearn(hasProg?prog:null);}},hasProg?"Kontynuuj naukę 🚀":"Zaczynamy! 🚀"));
  wrap.appendChild(sec);
}

// ============ START LEARN ============
function startLearn(saved){
  var words=getWords();
  if(saved){
    APP.wordState={};
    Object.entries(saved).forEach(function(kv){APP.wordState[parseInt(kv[0])]={streak:kv[1].streak||0,seen:kv[1].seen||0,lastWrong:false,cooldown:0,mastered:!!kv[1].mastered,masteredAt:kv[1].masteredAt||null,reviewing:false};});
    APP.pool=Object.keys(APP.wordState).map(Number);
    APP.nextUnlocked=Math.max(APP.pool.length,INIT_POOL);
  } else {
    APP.wordState={};
    for(var i=0;i<Math.min(INIT_POOL,words.length);i++)APP.wordState[i]={streak:0,seen:0,lastWrong:false,cooldown:0,mastered:false,masteredAt:null,reviewing:false};
    APP.pool=[];for(var i=0;i<Math.min(INIT_POOL,words.length);i++)APP.pool.push(i);
    APP.nextUnlocked=Math.min(INIT_POOL,words.length);
  }
  APP.screen="learn";APP.combo=0;APP.totalAnswered=0;APP.totalCorrect=0;APP.globalTurn=0;
  pickNext();
}

function enabledModes(){var m=[];if(APP.modes.flash)m.push("flash");if(APP.modes.quiz4)m.push("quiz4");if(APP.modes.write)m.push("write");if(APP.modes.match)m.push("match");return m.length?m:["flash"];}
function pickActivityType(streak){
  var avail=enabledModes();if(avail.length===1)return avail[0];
  var c;if(streak===0)c=avail.filter(function(m){return m==="flash"||m==="quiz4";});
  else if(streak===1)c=avail.filter(function(m){return m==="quiz4"||m==="flash";});
  else if(streak===2)c=avail.filter(function(m){return m==="write"||m==="quiz4";});
  else c=avail.filter(function(m){return m!=="flash";});
  if(!c.length)c=avail;return shuffle(c)[0];
}

function pickNext(){
  APP.flipped=false;APP.quizAnswer=null;APP.writeInput="";APP.writeResult=null;
  APP.matchSelected=null;APP.matchMatched=new Set();APP.matchWrong=null;
  APP.justMastered=null;APP.justAdded=null;APP.globalTurn++;
  var words=getWords();
  APP.pool.forEach(function(i){if(APP.wordState[i]&&APP.wordState[i].cooldown>0)APP.wordState[i].cooldown--;});

  var reviewCand=null;
  APP.pool.forEach(function(i){var ws=APP.wordState[i];if(ws&&ws.mastered&&!ws.reviewing&&ws.masteredAt&&(APP.globalTurn-ws.masteredAt)>=REVIEW_AFTER){if(!reviewCand||(APP.globalTurn-ws.masteredAt)>(APP.globalTurn-(APP.wordState[reviewCand]&&APP.wordState[reviewCand].masteredAt||0)))reviewCand=i;}});

  var active=APP.pool.filter(function(i){var ws=APP.wordState[i];if(!ws)return false;if(ws.mastered&&!ws.reviewing)return false;if(ws.cooldown>0)return false;if(ws.streak>=MASTERY&&!ws.reviewing)return false;return true;});

  if(reviewCand!==null&&(Math.random()<0.2||active.length===0)){
    APP.wordState[reviewCand].reviewing=true;APP.wordState[reviewCand].streak=MASTERY-1;APP.wordState[reviewCand].mastered=false;
    setActivity(reviewCand);render();speakCurrent();return;
  }
  if(active.length===0){
    var allM=APP.pool.every(function(i){return APP.wordState[i]&&APP.wordState[i].mastered;});
    if(allM&&APP.nextUnlocked>=words.length){saveProg();APP.screen="done";render();return;}
    var cdCards=APP.pool.filter(function(i){var ws=APP.wordState[i];return ws&&!ws.mastered&&ws.cooldown>0;});
    if(cdCards.length>0){cdCards.sort(function(a,b){return(APP.wordState[a].cooldown||0)-(APP.wordState[b].cooldown||0);});APP.wordState[cdCards[0]].cooldown=0;setActivity(cdCards[0]);render();speakCurrent();return;}
    saveProg();APP.screen="done";render();return;
  }

  var weighted=active.map(function(i){var s=APP.wordState[i]||{streak:0,seen:0,lastWrong:false};var w=10;if(s.lastWrong)w+=20;if(s.seen===0)w+=15;if(s.reviewing)w+=10;w+=(MASTERY-s.streak)*5;return{idx:i,weight:w};});
  var totalW=weighted.reduce(function(a,b){return a+b.weight;},0);
  var r=Math.random()*totalW,chosen=weighted[0].idx;
  for(var k=0;k<weighted.length;k++){r-=weighted[k].weight;if(r<=0){chosen=weighted[k].idx;break;}}
  setActivity(chosen);render();speakCurrent();
}

function speakCurrent(){
  if(!APP.activity)return;
  var words=getWords();var card=words[APP.activity.wordIdx];
  if(!card)return;
  // Speak the German word for flash/quiz/write
  if(APP.activity.type==="flash"||APP.activity.type==="quiz4"||APP.activity.type==="write"){
    setTimeout(function(){speak(card[0],"de");},200);
  }
}

function setActivity(wordIdx){
  var words=getWords();var s=APP.wordState[wordIdx]||{streak:0};var type=pickActivityType(s.streak);
  if(type==="match"){
    var others=shuffle(APP.pool.filter(function(i){return i!==wordIdx;})).slice(0,3);
    var mw=shuffle([wordIdx].concat(others));
    var lefts=shuffle(mw.map(function(wi,i){return{id:"l"+i,text:words[wi][0],pairId:wi,side:"left"};}));
    var rights=shuffle(mw.map(function(wi,i){return{id:"r"+i,text:words[wi][1],pairId:wi,side:"right"};}));
    APP.activity={type:"match",wordIdx:wordIdx,matchPairs:lefts.concat(rights),matchWords:mw};
  } else if(type==="quiz4"){
    var allIdx=[];for(var i=0;i<words.length;i++)if(i!==wordIdx)allIdx.push(i);
    var otherIdxs=shuffle(allIdx).slice(0,3);
    APP.activity={type:"quiz4",wordIdx:wordIdx,options:shuffle([wordIdx].concat(otherIdxs))};
  } else {
    APP.activity={type:type,wordIdx:wordIdx};
  }
}

function saveProg(){
  if(!APP.deckId)return;var toSave={};
  Object.entries(APP.wordState).forEach(function(kv){toSave[kv[0]]={streak:kv[1].streak,seen:kv[1].seen,mastered:kv[1].mastered,masteredAt:kv[1].masteredAt};});
  saveProgress(APP.deckId,toSave);
}

function handleAnswer(wordIdx,correct){
  var words=getWords();APP.totalAnswered++;if(correct)APP.totalCorrect++;
  var prev=APP.wordState[wordIdx]||{streak:0,seen:0,lastWrong:false,cooldown:0};
  if(correct){
    APP.wordState[wordIdx]={streak:prev.streak+1,seen:prev.seen+1,lastWrong:false,cooldown:0,mastered:prev.mastered,masteredAt:prev.masteredAt,reviewing:prev.reviewing};
    APP.combo++;
  } else {
    var cd=3+Math.floor(Math.random()*3);
    APP.wordState[wordIdx]={streak:Math.max(0,prev.streak-1),seen:prev.seen+1,lastWrong:true,cooldown:cd,mastered:prev.mastered,masteredAt:prev.masteredAt,reviewing:prev.reviewing};
    APP.combo=0;
  }
  var ws=APP.wordState[wordIdx];
  if(correct&&ws.streak>=MASTERY&&!ws.mastered){
    ws.mastered=true;ws.masteredAt=APP.globalTurn;ws.reviewing=false;APP.justMastered=wordIdx;
    if(APP.nextUnlocked<words.length){
      var toAdd=Math.min(ADD_BATCH,words.length-APP.nextUnlocked);
      for(var i=0;i<toAdd;i++){var ni=APP.nextUnlocked+i;APP.pool.push(ni);APP.wordState[ni]={streak:0,seen:0,lastWrong:false,cooldown:0,mastered:false,masteredAt:null,reviewing:false};}
      APP.justAdded=toAdd;APP.nextUnlocked+=toAdd;
    }
    saveProg();render();setTimeout(pickNext,1800);
  } else if(correct&&ws.reviewing&&ws.streak>=MASTERY){
    ws.mastered=true;ws.masteredAt=APP.globalTurn;ws.reviewing=false;APP.justMastered=wordIdx;
    saveProg();render();setTimeout(pickNext,1800);
  } else {
    saveProg();render();setTimeout(pickNext,correct?600:1500);
  }
}

// ============ RENDER LEARN ============
function renderLearn(wrap){
  var act=APP.activity;if(!act){pickNext();return;}
  var words=getWords();var deck=getDeck();
  var mastered=getMastered();var reviewing=getReviewing();
  var inProg=APP.pool.filter(function(i){var ws=APP.wordState[i];return ws&&!ws.mastered;}).length;
  var ws=APP.wordState[act.wordIdx]||{streak:0};var card=words[act.wordIdx];

  var sec=el("div",{class:"screen"});
  var hdr=el("div",{class:"learn-header"});
  hdr.appendChild(el("div",{class:"learn-stats"},
    el("div",{},el("span",{class:"learn-count"},""+mastered),el("span",{style:{fontSize:"13px",color:"var(--text-dim)",fontWeight:500,marginLeft:"4px"}},"/ "+words.length)),
    el("div",{class:"learn-pills"},
      APP.combo>=3?el("span",{class:"pill",style:{background:"var(--gold-bg)",color:"var(--gold)",border:"1px solid rgba(202,138,4,.18)"}},"🔥 "+APP.combo):null,
      reviewing>0?el("span",{class:"pill",style:{background:"var(--blue-bg)",color:"var(--blue)",border:"1px solid var(--blue-border)"}},"🔍 "+reviewing):null,
      el("span",{class:"pill",style:{background:"var(--orange-bg)",color:"var(--orange)",border:"1px solid var(--orange-border)"}},"📖 "+inProg)
    )
  ));
  hdr.appendChild(el("div",{class:"progress-bar"},el("div",{class:"progress-fill",style:{width:(mastered/words.length*100)+"%"}})));

  var pips=el("div",{class:"pips"});
  APP.pool.slice(0,35).forEach(function(i){
    var s=APP.wordState[i]||{streak:0};var done=s.mastered&&!s.reviewing;var rev=s.reviewing;
    var cur=act.wordIdx===i||(act.matchWords&&act.matchWords.indexOf(i)>=0);var cd=s.cooldown>0;
    var bg="var(--bg2)";
    if(done)bg="var(--green)";else if(rev)bg="var(--blue)";else if(cur)bg="var(--text)";
    else if(cd)bg="var(--red)";else if(s.streak>0)bg="var(--orange)";
    pips.appendChild(el("div",{class:"pip",style:{background:bg,opacity:done?"0.4":"1"}}));
  });
  if(APP.pool.length>35)pips.appendChild(el("span",{style:{fontSize:"10px",color:"var(--text-dim)",marginLeft:"4px"}},"+"+(APP.pool.length-35)));
  hdr.appendChild(pips);sec.appendChild(hdr);

  // Badge
  var colors={flash:"var(--blue)",quiz4:"var(--green)",write:"var(--orange)",match:"var(--gold)"};
  var bgcolors={flash:"var(--blue-bg)",quiz4:"var(--green-bg)",write:"var(--orange-bg)",match:"var(--gold-bg)"};
  var labels={flash:"🔄 Fiszka",quiz4:"🎯 Quiz",write:"✍️ Napisz",match:"🧩 Dopasuj"};
  var dotsHtml="";for(var i=0;i<MASTERY;i++)dotsHtml+='<span style="color:'+(i<ws.streak?"var(--green)":"var(--bg2)")+'">●</span>';
  var badge=el("div",{class:"activity-badge fade-in"},
    el("span",{class:"badge",style:{background:bgcolors[act.type],color:colors[act.type]}},labels[act.type]),
    ws.reviewing?el("span",{class:"badge",style:{background:"var(--blue-bg)",color:"var(--blue)"}},"🔍 Powtórka"):null
  );
  var dotsEl=el("span",{class:"streak-dots"});dotsEl.innerHTML=dotsHtml;badge.appendChild(dotsEl);
  sec.appendChild(badge);

  var content=el("div",{class:"fade-in",style:{width:"100%"}});
  if(act.type==="flash")renderFlash(content,act,card,words);
  else if(act.type==="quiz4")renderQuiz(content,act,card,words);
  else if(act.type==="write")renderWrite(content,act,card,words);
  else if(act.type==="match")renderMatch(content,act,words);
  sec.appendChild(content);

  // Overlay
  if(APP.justMastered!==null){
    var w=words[APP.justMastered];
    sec.appendChild(el("div",{class:"overlay"},
      el("div",{class:"star"},"⭐"),
      el("div",{style:{fontSize:"24px",fontWeight:800,color:"var(--green-dim)",marginBottom:"4px"}},"Słówko opanowane!"),
      el("div",{style:{fontSize:"20px",fontWeight:600,color:"var(--text)",marginBottom:"8px"}},w[0]+" = "+w[1]),
      APP.justAdded?el("div",{style:{fontSize:"15px",color:"var(--orange)",fontWeight:600}},"+"+APP.justAdded+" nowe słówka w puli"):null
    ));
  }

  sec.appendChild(el("div",{style:{textAlign:"center",marginTop:"32px"}},
    el("button",{class:"back-btn",style:{margin:"0 auto"},onClick:function(){saveProg();APP.screen="home";render();}},"← Zakończ naukę")
  ));
  wrap.appendChild(sec);
}

// ============ FLASH ============
function renderFlash(wrap,act,card){
  var fc=el("div",{class:"flash-card",style:{
    background:APP.flipped?"linear-gradient(145deg,var(--green-bg),var(--card))":"var(--card)",
    border:"1px solid "+(APP.flipped?"var(--green-border)":"var(--border)")
  },onClick:function(){
    APP.flipped=!APP.flipped;render();
    if(APP.flipped)speak(card[1],"pl"); else speak(card[0],"de");
  }},
    el("div",{class:"card-label"},APP.flipped?"PO POLSKU":"AUF DEUTSCH"),
    el("div",{class:"card-word",style:{fontSize:APP.flipped?"28px":"34px",color:APP.flipped?"var(--green-dim)":"var(--text)"}},APP.flipped?card[1]:card[0]),
    el("button",{class:"speaker-btn",onClick:function(e){e.stopPropagation();speak(APP.flipped?card[1]:card[0],APP.flipped?"pl":"de");}},"🔊"),
    el("div",{class:"card-hint"},APP.flipped?"Kliknij żeby wrócić":"Kliknij żeby odkryć")
  );
  wrap.appendChild(fc);
  if(APP.flipped){
    wrap.appendChild(el("div",{class:"answer-buttons"},
      el("button",{class:"answer-btn",style:{border:"1px solid var(--red-border)",background:"var(--red-bg)",color:"var(--red)"},onClick:function(){handleAnswer(act.wordIdx,false);}},"Nie wiem 😕"),
      el("button",{class:"answer-btn",style:{border:"1px solid var(--green-border)",background:"var(--green-bg)",color:"var(--green)"},onClick:function(){handleAnswer(act.wordIdx,true);}},"Wiem! ✓")
    ));
  }
}

// ============ QUIZ ============
function renderQuiz(wrap,act,card,words){
  wrap.appendChild(el("div",{class:"question-box"},
    el("div",{class:"q-label"},"Co znaczy:"),el("div",{class:"q-word"},card[0]),
    el("button",{class:"speaker-btn",onClick:function(){speak(card[0],"de");}},"🔊")
  ));
  var opts=el("div",{class:"quiz-options"});
  act.options.forEach(function(optIdx,i){
    var opt=words[optIdx];var isCorrect=optIdx===act.wordIdx;var isSel=APP.quizAnswer===i;var show=APP.quizAnswer!==null;
    var bg="var(--card)",bc="var(--border)",tc="var(--text)",op="1";
    if(show&&isCorrect){bg="var(--green-bg)";bc="var(--green-border)";tc="var(--green)";}
    if(show&&isSel&&!isCorrect){bg="var(--red-bg)";bc="var(--red-border)";tc="var(--red)";}
    if(show&&!isCorrect&&!isSel)op="0.35";
    var btn=el("button",{class:"quiz-opt",style:{border:"1px solid "+bc,background:bg,color:tc,opacity:op,cursor:show?"default":"pointer"}},opt[1]);
    if(!show)btn.addEventListener("click",function(){
      APP.quizAnswer=i;render();
      if(isCorrect)speak(opt[1],"pl");
      else{speak(words[act.wordIdx][1],"pl");}
      handleAnswer(act.wordIdx,isCorrect);
    });
    opts.appendChild(btn);
  });
  wrap.appendChild(opts);
}

// ============ WRITE ============
function renderWrite(wrap,act,card){
  wrap.appendChild(el("div",{class:"question-box"},
    el("div",{class:"q-label"},"Przetłumacz:"),el("div",{class:"q-word"},card[0]),
    el("button",{class:"speaker-btn",onClick:function(){speak(card[0],"de");}},"🔊")
  ));
  var bc=APP.writeResult==="correct"?"var(--green)":APP.writeResult==="wrong"?"var(--red)":"var(--border)";
  var input=el("input",{class:"write-input",style:{borderColor:bc},placeholder:"Wpisz tłumaczenie...",value:APP.writeInput,disabled:!!APP.writeResult});
  input.addEventListener("input",function(e){APP.writeInput=e.target.value;});
  input.addEventListener("keydown",function(e){if(e.key==="Enter"&&!APP.writeResult)doCheck();});
  wrap.appendChild(input);
  setTimeout(function(){input.focus();},50);

  function doCheck(){
    var answers=card[1].split(",").map(function(s){return normalize(s);});
    var inp=normalize(APP.writeInput);
    var ok=answers.some(function(a){if(inp===a)return true;if(a.indexOf(inp)>=0&&inp.length>3)return true;return false;});
    APP.writeResult=ok?"correct":"wrong";
    speak(card[1],"pl");
    render();
    setTimeout(function(){handleAnswer(act.wordIdx,ok);},ok?800:2000);
  }

  if(!APP.writeResult){
    wrap.appendChild(el("button",{class:"primary-btn",style:{marginTop:"10px"},onClick:doCheck},"Sprawdź"));
  } else {
    wrap.appendChild(el("div",{class:"result-box",style:{
      background:APP.writeResult==="correct"?"var(--green-bg)":"var(--red-bg)",
      border:"1px solid "+(APP.writeResult==="correct"?"var(--green-border)":"var(--red-border)")
    }},el("div",{class:"result-label",style:{color:APP.writeResult==="correct"?"var(--green)":"var(--red)"}},APP.writeResult==="correct"?"Dobrze! ✓":"Poprawna odpowiedź:"),
      el("div",{class:"result-word"},card[1])
    ));
  }
}

// ============ MATCH ============
function renderMatch(wrap,act,words){
  var pairs=act.matchPairs||[];var lefts=pairs.filter(function(p){return p.side==="left";});var rights=pairs.filter(function(p){return p.side==="right";});
  var grid=el("div",{class:"match-grid"});
  [lefts,rights].forEach(function(side){
    var col=el("div",{class:"match-col"});
    side.forEach(function(item){
      var isM=APP.matchMatched.has(item.pairId+item.side);var isSel=APP.matchSelected&&APP.matchSelected.id===item.id;var isW=APP.matchWrong&&APP.matchWrong.indexOf(item.id)>=0;
      var bg="var(--card)",bc="var(--border)",tc="var(--text)",op="1",td="none";
      if(isM){bg="var(--green-bg)";bc="var(--green-border)";tc="rgba(22,163,74,0.4)";op="0.45";td="line-through";}
      if(isW){bg="var(--red-bg)";bc="var(--red-border)";tc="var(--red)";}
      if(isSel){bg="var(--green-bg)";bc="var(--green-border)";}
      var btn=el("button",{class:"match-btn",style:{border:"2px solid "+bc,background:bg,color:tc,opacity:op,textDecoration:td}},item.text);
      if(!isM)btn.addEventListener("click",function(){
        if(item.side==="left")speak(item.text,"de"); else speak(item.text,"pl");
        if(!APP.matchSelected){APP.matchSelected=item;APP.matchWrong=null;render();return;}
        if(APP.matchSelected.id===item.id){APP.matchSelected=null;render();return;}
        if(APP.matchSelected.side===item.side){APP.matchSelected=item;render();return;}
        if(APP.matchSelected.pairId===item.pairId){
          APP.matchMatched.add(item.pairId+"left");APP.matchMatched.add(item.pairId+"right");APP.matchSelected=null;
          var total=(act.matchWords?act.matchWords.length:4)*2;
          if(APP.matchMatched.size>=total){
            APP.totalAnswered++;APP.totalCorrect++;APP.combo++;
            act.matchWords.forEach(function(wi){var prev=APP.wordState[wi]||{streak:0,seen:0,lastWrong:false,cooldown:0};APP.wordState[wi]={streak:prev.streak+1,seen:prev.seen+1,lastWrong:false,cooldown:0,mastered:prev.mastered,masteredAt:prev.masteredAt,reviewing:prev.reviewing};});
            saveProg();render();setTimeout(pickNext,1000);
          } else render();
        } else {APP.matchWrong=[APP.matchSelected.id,item.id];APP.combo=0;render();setTimeout(function(){APP.matchWrong=null;APP.matchSelected=null;render();},500);}
      });
      col.appendChild(btn);
    });
    grid.appendChild(col);
  });
  wrap.appendChild(grid);
}

// ============ DONE ============
function renderDone(wrap){
  var words=getWords();var pct=APP.totalAnswered>0?Math.round(APP.totalCorrect/APP.totalAnswered*100):0;
  wrap.appendChild(el("div",{class:"done-screen fade-up"},
    el("div",{class:"trophy"},"🏆"),
    el("h2",{style:{fontSize:"28px",fontWeight:800,marginBottom:"8px"}},"Wszystko opanowane!"),
    el("p",{style:{fontSize:"15px",color:"var(--text-dim)",marginBottom:"24px"}},words.length+" / "+words.length+" słówek"),
    el("div",{class:"done-stats"},
      el("div",{},el("div",{class:"done-stat-value",style:{color:"var(--green)"}},""+APP.totalCorrect),el("div",{class:"done-stat-label"},"dobrze")),
      el("div",{},el("div",{class:"done-stat-value"},""+pct+"%"),el("div",{class:"done-stat-label"},"celność"))
    ),
    el("div",{class:"done-actions"},
      el("button",{class:"primary-btn",style:{width:"auto",padding:"14px 32px"},onClick:function(){APP.screen="settings";render();}},"Jeszcze raz"),
      el("button",{class:"secondary-btn",onClick:function(){APP.screen="home";render();}},"Menu")
    )
  ));
}

render();
