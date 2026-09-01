(() => {
  const Q = window.MBTI_QUESTIONS;
  const VERSION = "2.0";
  const SESSION_KEY = "mbti_blind_session_v2";
  const HISTORY_KEY = "mbti_blind_history_v2";
  const AXES = [
    {key:"EI", left:"E", right:"I", label:"能量取向", leftName:"外向 E", rightName:"内向 I"},
    {key:"SN", left:"S", right:"N", label:"信息取向", leftName:"实感 S", rightName:"直觉 N"},
    {key:"TF", left:"T", right:"F", label:"判断取向", leftName:"思考 T", rightName:"情感 F"},
    {key:"JP", left:"J", right:"P", label:"生活方式", leftName:"判断 J", rightName:"感知 P"},
  ];
  const TYPE_TEXT = {
    INTJ:"偏独立、抽象、分析与结构化", INTP:"偏独立、抽象、分析与开放探索",
    ENTJ:"偏外部互动、抽象、分析与结构化", ENTP:"偏外部互动、抽象、分析与开放探索",
    INFJ:"偏独立、抽象、价值考量与结构化", INFP:"偏独立、抽象、价值考量与开放探索",
    ENFJ:"偏外部互动、抽象、价值考量与结构化", ENFP:"偏外部互动、抽象、价值考量与开放探索",
    ISTJ:"偏独立、具体、分析与结构化", ISFJ:"偏独立、具体、价值考量与结构化",
    ESTJ:"偏外部互动、具体、分析与结构化", ESFJ:"偏外部互动、具体、价值考量与结构化",
    ISTP:"偏独立、具体、分析与开放探索", ISFP:"偏独立、具体、价值考量与开放探索",
    ESTP:"偏外部互动、具体、分析与开放探索", ESFP:"偏外部互动、具体、价值考量与开放探索"
  };

  const $ = s => document.querySelector(s);
  const views = ["#welcomeView","#testView","#resultView","#historyView"];
  let session = load(SESSION_KEY, null);
  let index = 0;
  let autoTimer = null;

  function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function shuffled(arr){
    const a=[...arr];
    if (window.crypto && window.crypto.getRandomValues) {
      for(let i=a.length-1;i>0;i--){ const u=new Uint32Array(1); window.crypto.getRandomValues(u); const j=u[0]%(i+1); [a[i],a[j]]=[a[j],a[i]]; }
    } else {
      for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    }
    return a;
  }
  function randomBool(){
    if (window.crypto && window.crypto.getRandomValues){ const u=new Uint8Array(1); window.crypto.getRandomValues(u); return !!(u[0]&1); }
    return Math.random()<.5;
  }
  function createSession(){
    return {
      version:VERSION, startedAt:new Date().toISOString(),
      items: shuffled(Q.map(q => ({id:q.id, flipped:randomBool()}))),
      answers:{}, current:0
    };
  }
  function showView(id){
    views.forEach(v=>$(v).classList.toggle("hidden", v!==id));
    $("#homeBtn").classList.toggle("hidden", id==="#welcomeView");
    $("#historyBtn").classList.toggle("hidden", id==="#historyView");
    window.scrollTo({top:0,behavior:"auto"});
  }
  function getQuestion(item){
    const q=Q.find(x=>x.id===item.id);
    if(!item.flipped) return {...q};
    return { ...q, a:q.b, b:q.a, aPole:q.bPole, bPole:q.aPole };
  }
  function countAnswered(){ return session ? Object.keys(session.answers).length : 0; }
  function renderWelcome(){
    $("#resumeBtn").classList.toggle("hidden", !(session && countAnswered()>0 && countAnswered()<Q.length));
  }
  function renderQuestion(){
    const item=session.items[index], q=getQuestion(item), ans=session.answers[item.id];
    $("#questionNumber").textContent=`QUESTION ${String(index+1).padStart(2,"0")}`;
    $("#questionPrompt").textContent=q.prompt; $("#optionA").textContent=q.a; $("#optionB").textContent=q.b;
    $("#progressText").textContent=`${index+1} / ${Q.length}`; $("#answeredText").textContent=`已答 ${countAnswered()}`;
    $("#progressBar").style.width=`${countAnswered()/Q.length*100}%`;
    document.querySelectorAll("#answerScale button").forEach(b=>b.classList.toggle("selected", Number(b.dataset.value)===ans));
    $("#prevBtn").disabled=index===0; $("#nextBtn").textContent=index===Q.length-1 ? "检查并完成" : "下一题";
    session.current=index; save(SESSION_KEY,session);
  }
  function startNew(){
    if(session && countAnswered()>0 && countAnswered()<Q.length){
      if(!confirm("当前有未完成的测试。开始新测试会覆盖这次进度，继续吗？")) return;
    }
    session=createSession(); index=0; save(SESSION_KEY,session); showView("#testView"); renderQuestion();
  }
  function choose(value){
    clearTimeout(autoTimer);
    const item=session.items[index]; session.answers[item.id]=value; save(SESSION_KEY,session); renderQuestion();
    autoTimer=setTimeout(()=>{ if(index<Q.length-1){ index++; renderQuestion(); } else { finish(); } }, 230);
  }
  function missingIndex(){
    return session.items.findIndex(it => session.answers[it.id] == null);
  }

  function score(){
    const byAxis={EI:[],SN:[],TF:[],JP:[]};
    let neutral=0;
    session.items.forEach(item=>{
      const q=getQuestion(item), v=session.answers[item.id];
      if(v===3) neutral++;
      const raw=(v-3)/2;
      const pair=[q.aPole,q.bPole].sort().join("");
      let key = pair==="EI"?"EI":pair==="NS"?"SN":pair==="FT"?"TF":"JP";
      const axis=AXES.find(a=>a.key===key);
      const oriented = q.bPole===axis.right ? raw : -raw;
      byAxis[key].push(oriented);
    });
    const axes={};
    AXES.forEach(a=>{
      const vals=byAxis[a.key], mean=vals.reduce((s,x)=>s+x,0)/vals.length;
      const directional=vals.filter(x=>x!==0);
      const totalAbs=directional.reduce((s,x)=>s+Math.abs(x),0);
      const signedAbs=Math.abs(directional.reduce((s,x)=>s+x,0));
      const consistency=totalAbs ? signedAbs/totalAbs : 0;
      const rightPct=Math.round((50+50*mean)*10)/10;
      const leftPct=Math.round((100-rightPct)*10)/10;
      axes[a.key]={...a,mean,leftPct,rightPct,consistency:Math.round(consistency*100)};
    });
    const type=AXES.map(a=>axes[a.key].mean>=0?a.right:a.left).join("");
    const neutralRate=Math.round(neutral/Q.length*100);
    const axisConsistency=Math.round(AXES.reduce((s,a)=>s+axes[a.key].consistency,0)/AXES.length);
    const avgDistance=Math.round(AXES.reduce((s,a)=>s+Math.abs(axes[a.key].mean),0)/AXES.length*100);
    const quality=Math.round(Math.max(0,Math.min(100, 45 + avgDistance*.35 + axisConsistency*.35 - neutralRate*.15)));
    return {type,axes,neutralRate,axisConsistency,avgDistance,quality,completedAt:new Date().toISOString(),version:VERSION};
  }
  function strength(mean){
    const x=Math.abs(mean);
    if(x<.10) return "几乎平衡";
    if(x<.25) return "轻度倾向";
    if(x<.45) return "中度倾向";
    if(x<.65) return "明显倾向";
    return "强倾向";
  }
  function qualityLabel(q){ return q>=80?"较高":q>=65?"中等偏高":q>=50?"中等":"偏低"; }

  function finish(){
    clearTimeout(autoTimer);
    const missing=missingIndex();
    if(missing!==-1){ index=missing; renderQuestion(); alert("还有未作答的题目，已跳到第一道未答题。"); return; }
    const result=score();
    const history=load(HISTORY_KEY,[]);
    const previous=history[0] || null;
    history.unshift(result); save(HISTORY_KEY,history.slice(0,20));
    localStorage.removeItem(SESSION_KEY); session=null;
    renderResult(result,previous); showView("#resultView");
  }

  function renderResult(r,prev){
    $("#typeText").textContent=r.type;
    $("#typeTitle").textContent=TYPE_TEXT[r.type] || "当前四维偏好画像";
    const sorted=AXES.map(a=>r.axes[a.key]).sort((x,y)=>Math.abs(y.mean)-Math.abs(x.mean));
    const strongest=sorted[0], weakest=sorted[sorted.length-1];
    const pref=x=>x.mean>=0?x.right:x.left;
    $("#resultIntro").textContent=`当前最明显的是 ${strongest.label}（偏 ${pref(strongest)}），最接近中间的是 ${weakest.label}。`;
    const root=$("#axisCards"); root.innerHTML="";
    AXES.forEach(a=>{
      const x=r.axes[a.key], dot=Math.max(2,Math.min(98,x.rightPct));
      const div=document.createElement("div"); div.className="axis-card";
      div.innerHTML=`
        <div class="axis-head"><div class="axis-title">${x.label}</div><div class="axis-score">${strength(x.mean)} · 一致性 ${x.consistency}%</div></div>
        <div class="axis-names"><span>${x.leftName} ${Math.round(x.leftPct)}%</span><span>${x.rightName} ${Math.round(x.rightPct)}%</span></div>
        <div class="axis-track"><div class="axis-mid"></div><div class="axis-dot" style="left:${dot}%"></div></div>
        <div class="axis-foot"><span>偏 ${pref(x)}</span><span>${Math.abs(x.mean)<.10?"边界维度，复测可能翻转":"方向相对明确"}</span></div>`;
      root.appendChild(div);
    });
    $("#qualityMetrics").innerHTML=`
      <div class="metric"><b>${r.quality}</b><span>结果质量 / 100</span></div>
      <div class="metric"><b>${r.axisConsistency}%</b><span>平均方向一致性</span></div>
      <div class="metric"><b>${r.neutralRate}%</b><span>选择“3”的比例</span></div>`;
    let note=`整体结果质量为${qualityLabel(r.quality)}。`;
    if(r.neutralRate>=30) note+=" 本次中间答案较多，四维区分度会下降。";
    if(r.axisConsistency<45) note+=" 多个维度在不同情境中的回答方向变化较大，因此更适合把结果理解为“情境依赖”，而不是稳定标签。";
    if(r.neutralRate<30 && r.axisConsistency>=45) note+=" 回答具有可用的区分度；仍建议隔几个月用新一轮随机题序复测，而不是把一次结果当成固定人格。";
    $("#qualityNote").textContent=note;

    $("#profileText").textContent=`${r.type} 在这套测试中表示：${TYPE_TEXT[r.type] || "四条偏好轴的当前组合"}。这里的百分比不是“你有多少人格成分”，而是本次跨情境回答在该维度上更靠近哪一端。`;
    renderCompare(r,prev);
  }
  function renderCompare(r,p){
    if(!p){ $("#compareCard").classList.add("hidden"); return; }
    $("#compareCard").classList.remove("hidden");
    let html=`<p>上一次为 <b>${p.type}</b>，这一次为 <b>${r.type}</b>。</p>`;
    AXES.forEach(a=>{
      const now=r.axes[a.key].rightPct, old=p.axes[a.key].rightPct, d=Math.round((now-old)*10)/10;
      html+=`<div class="change-row"><span>${a.label}：${a.rightName} ${Math.round(old)}% → ${Math.round(now)}%</span><b class="delta ${d>=0?"up":"down"}">${d>0?"+":""}${d}%</b></div>`;
    });
    html+=`<p class="muted">百分比移动比字母是否改变更有信息量。接近 50% 的维度即使只移动几分，也可能造成类型字母翻转。</p>`;
    $("#compareContent").innerHTML=html;
  }
  function renderHistory(){
    const h=load(HISTORY_KEY,[]), root=$("#historyList"); root.innerHTML="";
    $("#emptyHistory").classList.toggle("hidden",h.length!==0);
    h.forEach(r=>{
      const div=document.createElement("div"); div.className="history-item";
      const date=new Date(r.completedAt).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
      div.innerHTML=`<div class="history-top"><div class="history-type">${r.type}</div><div class="history-date">${date}</div></div>
      <div class="mini-axes">${AXES.map(a=>{const x=r.axes[a.key];return `<div class="mini-axis"><b>${x.mean>=0?x.right:x.left} ${Math.round(Math.max(x.leftPct,x.rightPct))}%</b>${a.label}</div>`}).join("")}</div>`;
      root.appendChild(div);
    });
  }
  function resultText(r){
    const lines=[`MBTI Blind Test v${r.version}：${r.type}`];
    AXES.forEach(a=>{const x=r.axes[a.key];lines.push(`${a.leftName} ${Math.round(x.leftPct)}% · ${a.rightName} ${Math.round(x.rightPct)}%（一致性 ${x.consistency}%）`)});
    lines.push(`结果质量 ${r.quality}/100 · 中间答案 ${r.neutralRate}%`);
    return lines.join("\n");
  }

  $("#startBtn").onclick=startNew;
  $("#resumeBtn").onclick=()=>{ index=session.current||0; showView("#testView"); renderQuestion(); };
  $("#historyBtn").onclick=()=>{ renderHistory(); showView("#historyView"); };
  $("#homeBtn").onclick=()=>{ renderWelcome(); showView("#welcomeView"); };
  $("#prevBtn").onclick=()=>{ clearTimeout(autoTimer); if(index>0){index--;renderQuestion();} };
  $("#nextBtn").onclick=()=>{ clearTimeout(autoTimer); if(index<Q.length-1){index++;renderQuestion();}else finish(); };
  document.querySelectorAll("#answerScale button").forEach(b=>b.onclick=()=>choose(Number(b.dataset.value)));
  $("#retakeBtn").onclick=()=>{ session=null; startNew(); };
  $("#copyResultBtn").onclick=async()=>{
    const h=load(HISTORY_KEY,[]); if(!h[0]) return;
    try{await navigator.clipboard.writeText(resultText(h[0])); $("#copyResultBtn").textContent="已复制"; setTimeout(()=>$("#copyResultBtn").textContent="复制结果",1200)}
    catch{alert(resultText(h[0]))}
  };
  $("#clearHistoryBtn").onclick=()=>{ if(confirm("确定清空当前浏览器保存的全部测试历史吗？")){localStorage.removeItem(HISTORY_KEY);renderHistory();} };

  renderWelcome(); showView("#welcomeView");
})();
