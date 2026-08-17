
/* LiftRank v4: adaptive ranking + embedded interactive anatomy */
const exerciseDB=[
{name:"Bench Press",cat:"Barbell compound",method:"1rm",muscles:["Chest","Triceps","Shoulders"]},
{name:"Squat",cat:"Barbell compound",method:"1rm",muscles:["Quads","Glutes","Hamstrings"]},
{name:"Deadlift",cat:"Barbell compound",method:"1rm",muscles:["Hamstrings","Glutes","Lower Back","Upper Back"]},
{name:"Overhead Press",cat:"Barbell compound",method:"1rm",muscles:["Shoulders","Triceps"]},
{name:"Incline Bench Press",cat:"Barbell compound",method:"1rm",muscles:["Chest","Shoulders","Triceps"]},
{name:"Barbell Row",cat:"Barbell compound",method:"1rm",muscles:["Upper Back","Lats","Biceps"]},
{name:"Front Squat",cat:"Barbell compound",method:"1rm",muscles:["Quads","Glutes"]},
{name:"Dumbbell Bench Press",cat:"Dumbbell",method:"weight_reps",muscles:["Chest","Triceps","Shoulders"]},
{name:"Dumbbell Shoulder Press",cat:"Dumbbell",method:"weight_reps",muscles:["Shoulders","Triceps"]},
{name:"Dumbbell Row",cat:"Dumbbell",method:"weight_reps",muscles:["Lats","Upper Back","Biceps"]},
{name:"Hammer Curl",cat:"Dumbbell",method:"weight_reps",muscles:["Biceps","Forearms"]},
{name:"Bicep Curl",cat:"Dumbbell",method:"weight_reps",muscles:["Biceps","Forearms"]},
{name:"Lateral Raise",cat:"Dumbbell",method:"reps",muscles:["Shoulders"]},
{name:"Tricep Pushdown",cat:"Cable",method:"weight_reps",muscles:["Triceps"]},
{name:"Cable Curl",cat:"Cable",method:"weight_reps",muscles:["Biceps","Forearms"]},
{name:"Cable Row",cat:"Cable",method:"weight_reps",muscles:["Upper Back","Lats","Biceps"]},
{name:"Lat Pulldown",cat:"Cable",method:"weight_reps",muscles:["Lats","Biceps","Upper Back"]},
{name:"Cable Fly",cat:"Cable",method:"weight_reps",muscles:["Chest"]},
{name:"Leg Press",cat:"Machine",method:"weight_reps",muscles:["Quads","Glutes","Hamstrings"]},
{name:"Leg Extension",cat:"Machine",method:"weight_reps",muscles:["Quads"]},
{name:"Leg Curl",cat:"Machine",method:"weight_reps",muscles:["Hamstrings"]},
{name:"Chest Press",cat:"Machine",method:"weight_reps",muscles:["Chest","Triceps"]},
{name:"Shoulder Press",cat:"Machine",method:"weight_reps",muscles:["Shoulders","Triceps"]},
{name:"Pull-Up",cat:"Bodyweight",method:"bw_plus_weight",muscles:["Lats","Biceps","Upper Back"]},
{name:"Chin-Up",cat:"Bodyweight",method:"bw_plus_weight",muscles:["Biceps","Lats","Upper Back"]},
{name:"Push-Up",cat:"Bodyweight",method:"reps",muscles:["Chest","Triceps","Shoulders"]},
{name:"Dip",cat:"Bodyweight",method:"bw_plus_weight",muscles:["Chest","Triceps","Shoulders"]},
{name:"Plank",cat:"Core",method:"time",muscles:["Abs"]},
{name:"Running",cat:"Conditioning",method:"distance_time",muscles:["Quads","Hamstrings","Calves"]},
{name:"Calf Raise",cat:"Machine",method:"weight_reps",muscles:["Calves"]},
{name:"Cable Woodchop",cat:"Cable",method:"weight_reps",muscles:["Obliques","Abs"]},
{name:"Russian Twist",cat:"Core",method:"weight_reps",muscles:["Obliques","Abs"]},
{name:"Side Plank",cat:"Core",method:"time",muscles:["Obliques","Abs"]}
];
const exercises=exerciseDB.map(x=>x.name);
const icons={Bronze:"🥉",Silver:"🥈",Gold:"🥇",Platinum:"💠",Diamond:"💎",Elite:"⚡",Legend:"🔥",Apex:"👑"};
const ranks=["Bronze","Silver","Gold","Platinum","Diamond","Elite","Legend","Apex"],divs=["I","II","III"];
const muscles=["Chest","Shoulders","Biceps","Triceps","Forearms","Abs","Obliques","Lats","Upper Back","Lower Back","Glutes","Quads","Hamstrings","Calves"];
const DB="liftrank_v2";
let data=JSON.parse(localStorage.getItem(DB)||"null")||{workouts:[],prs:{},rankings:{},xp:0,level:1,today:[]};
let selectedRankExercise=null, selectedMuscle=null, selectedAnatomyRegion=null;
const benchmarks={
male:{bench:[53,74,98,127,157],squat:[72,98,130,166,205],deadlift:[86,116,151,192,235],ohp:[33,47,64,84,106]},
female:{bench:[24,39,59,82,109],squat:[39,59,85,115,148],deadlift:[48,71,99,132,168],ohp:[17,26,39,54,70]}
};
const anchors=[5,20,50,80,95];

function save(){localStorage.setItem(DB,JSON.stringify(data))}
function getEx(n){return exerciseDB.find(x=>x.name===n)}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.s===id));render()}
function init(){renderRankPicker();render();searchExercises();document.querySelectorAll(".anatomy img").forEach(initAnatomyImage)}
function initAnatomyImage(img){
  const canvas=img.parentElement.querySelector(".highlight-canvas");
  if(!canvas)return;
  const mask=new Image();
  mask.onload=()=>{
    const state={mask,w:mask.naturalWidth,h:mask.naturalHeight,ready:true,data:null};
    const off=document.createElement("canvas");off.width=state.w;off.height=state.h;
    const ctx=off.getContext("2d",{willReadFrequently:true});ctx.drawImage(mask,0,0,state.w,state.h);
    state.data=ctx.getImageData(0,0,state.w,state.h).data;
    anatomyStates.set(img,state);
    resizeAnatomyCanvas(img);
    if(selectedAnatomyRegion)highlightSelectedRegion(selectedAnatomyRegion.side,selectedAnatomyRegion.id);
  };
  mask.src=img.dataset.mask;
  resizeAnatomyCanvas(img);
  if(!canvas.dataset.bound){
    canvas.dataset.bound="1";
    canvas.addEventListener("pointerdown",e=>{
      e.preventDefault();
      const state=anatomyStates.get(img);if(!state?.ready)return;
      const r=img.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const id=getMaskIdAtPoint(state,x,y,r.width,r.height);
      if(id)selectAnatomyRegion(img,id);
    });
  }
  if(!img.dataset.resizeBound){img.dataset.resizeBound="1";window.addEventListener("resize",()=>{resizeAnatomyCanvas(img);if(selectedAnatomyRegion)highlightSelectedRegion(selectedAnatomyRegion.side,selectedAnatomyRegion.id);});}
}
function resizeAnatomyCanvas(img){const c=img.parentElement.querySelector(".highlight-canvas");if(!c)return;const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(w&&h){c.width=w;c.height=h;}}
function searchExercises(){let q=(document.getElementById("search")?.value||"").toLowerCase();let out=exerciseDB.filter(x=>!q||x.name.toLowerCase().includes(q)||x.cat.toLowerCase().includes(q));document.getElementById("results").innerHTML=q?out.map(x=>`<div class="exercise" onclick="addExercise('${x.name}')"><div><b>${x.name}</b><div class="metric">${x.cat} · ${methodLabel(x.method)}</div></div><span class="badge">＋</span></div>`).join(""):""}
function methodLabel(m){return {one_rm:"1RM",weight_reps:"Weight × reps",reps:"Reps",bw_plus_weight:"BW + added weight",time:"Time",distance_time:"Distance / time",weight_reps:"Weight × reps",reps:"Reps"}[m]||m}
function addExercise(name){data.today.push({name,sets:[newSet(name)]});save();document.getElementById("search").value="";searchExercises();render()}
function newSet(name){let m=getEx(name).method;return m==="time"?{w:"",r:"",time:""}:m==="distance_time"?{w:"",r:"",distance:"",time:""}:{w:"",r:""}}
function addSet(i){data.today[i].sets.push(newSet(data.today[i].name));save();render()}
function removeSet(i,j){data.today[i].sets.splice(j,1);save();render()}
function updateSet(i,j,k,v){data.today[i].sets[j][k]=v;save()}
function setInputs(e,i,j,s){let m=e.method;if(m==="time")return `<input type="number" placeholder="Seconds" value="${s.time||""}" onchange="updateSet(${i},${j},'time',this.value)">`;if(m==="distance_time")return `<div class="grid"><input type="number" placeholder="Distance" value="${s.distance||""}" onchange="updateSet(${i},${j},'distance',this.value)"><input type="number" placeholder="Seconds" value="${s.time||""}" onchange="updateSet(${i},${j},'time',this.value)"></div>`;return `<div class="grid"><input type="number" placeholder="${m==='bw_plus_weight'?'Added lb':'Weight lb'}" value="${s.w}" onchange="updateSet(${i},${j},'w',this.value)"><input type="number" placeholder="Reps" value="${s.r}" onchange="updateSet(${i},${j},'r',this.value)"></div>`}
function renderToday(){let c=document.getElementById("today");if(!data.today.length){c.innerHTML='<div class="empty">No exercises yet.</div>';return}c.innerHTML=data.today.map((item,i)=>{let e=getEx(item.name);return `<div class="exercise" style="display:block"><b>${e.name}</b><div class="metric">${e.cat} · ${methodLabel(e.method)}</div>${item.sets.map((s,j)=>`${setInputs(e,i,j,s)}<button class="secondary" onclick="removeSet(${i},${j})">Remove set</button>`).join("")}<button class="secondary" onclick="addSet(${i})">＋ Add Set</button></div>`}).join("")}
function e1rm(w,r){return r<=1?w:w*(1+r/30)}
function setScore(e,s){let m=e.method;if(m==="time")return +s.time||0;if(m==="distance_time")return (+s.distance||0)*1000/(+s.time||1);if(m==="reps")return +s.r||0;if(m==="bw_plus_weight")return (+dataBodyweight()||0)+(+s.w||0);return e1rm(+s.w||0,+s.r||0)}
function dataBodyweight(){return data.bodyweight||0}
function finishWorkout(){let sets=0,vol=0,newPr=[];data.today.forEach(ei=>ei.sets.forEach(s=>{let e=getEx(ei.name),valid=false,score=setScore(e,s);if(e.method==="time")valid=score>0;else if(e.method==="distance_time")valid=+s.distance>0&&+s.time>0;else valid=+s.r>0&&(e.method==="reps"||+s.w>0||e.method==="bw_plus_weight");if(valid){sets++;vol+=e.method==="distance_time"?+s.distance:(e.method==="time"?score:(+s.w||0)*(+s.r||0));if(score>(data.prs[e.name]||0)){data.prs[e.name]=score;newPr.push([e.name,score,e.method])}}}));if(!sets){alert("Enter at least one complete set.");return}data.workouts.push({date:new Date().toISOString(),sets,volume:vol,exercises:JSON.parse(JSON.stringify(data.today))});data.xp+=sets*25+newPr.length*100;while(data.xp>=xpNeed()){data.xp-=xpNeed();data.level++}data.today=[];save();showModal(newPr.length?"🎉 New PR!":"Workout Complete!",newPr.length?newPr.map(x=>`<div class="exercise"><b>${x[0]}</b><span class="success">${formatScore(x[1],x[2])}</span></div>`).join(""):`${sets} sets logged.`);render()}
function xpNeed(){return Math.round(500*Math.pow(data.level,1.25))}
function formatScore(v,m){if(m==="time")return Math.round(v)+" sec";if(m==="distance_time")return v+" distance";if(m==="reps")return Math.round(v)+" reps";return Math.round(v)+" lb"}
function renderRankPicker(){let q=(document.getElementById("rankSearch")?.value||"").toLowerCase();let list=exerciseDB.filter(x=>x.name.toLowerCase().includes(q)||x.cat.toLowerCase().includes(q));document.getElementById("rankPicker").innerHTML=list.map(x=>`<div class="exercise rank-card" onclick="selectRankExercise('${x.name}')"><div><b>${x.name}</b><div class="metric">${x.cat} · 🏆 Rankable · ${methodLabel(x.method)}</div></div><span class="badge">›</span></div>`).join("")||'<div class="empty">No exercises found.</div>'}
function selectRankExercise(name){selectedRankExercise=getEx(name);document.getElementById("rankSelectedLabel").textContent=name+" · "+methodLabel(selectedRankExercise.method);renderRankInputs()}
function renderRankInputs(){let e=selectedRankExercise;if(!e){document.getElementById("rankInputs").innerHTML='<div class="empty">Choose an exercise above.</div>';return}let m=e.method;let html="";if(["one_rm","weight_reps","bw_plus_weight"].includes(m)){html+=`<div class="field"><label>${m==="one_rm"?"1 Rep Max (lb)":m==="bw_plus_weight"?"Added Weight (lb)":"Weight (lb)"}</label><input id="rankWeight" type="number" placeholder="225"></div>`}if(["weight_reps","reps","bw_plus_weight"].includes(m)){html+=`<div class="field"><label>Reps</label><input id="rankReps" type="number" min="1" max="100" placeholder="8"></div>`}if(m==="time")html+=`<div class="field"><label>Time (seconds)</label><input id="rankTime" type="number" placeholder="90"></div>`;if(m==="distance_time")html+=`<div class="two-col"><div class="field"><label>Distance</label><input id="rankDistance" type="number" placeholder="1"></div><div class="field"><label>Time (seconds)</label><input id="rankTime" type="number" placeholder="480"></div></div>`;if(m==="bw_plus_weight"||m==="one_rm")html+=`<div class="field"><label>Bodyweight (lb)</label><input id="bodyweight" type="number" placeholder="160"></div>`;html+=`<div class="field"><label>Benchmark category</label><select id="sex"><option value="male">Male</option><option value="female">Female</option></select></div>`;document.getElementById("rankInputs").innerHTML=html}
function pctInterpolate(value,arr){if(value<=arr[0])return Math.max(0,5*value/Math.max(arr[0],.001));for(let i=0;i<arr.length-1;i++){if(value<=arr[i+1]){let t=(value-arr[i])/(arr[i+1]-arr[i]);return anchors[i]+t*(anchors[i+1]-anchors[i])}}return Math.min(99.9,95+(value-arr[4])/(arr[4]*.15)*4.9)}
function rankForMetric(ex,metric,sex,bw){let p;if(["Bench Press","Squat","Deadlift","Overhead Press"].includes(ex.name)){let key={"Bench Press":"bench","Squat":"squat","Deadlift":"deadlift","Overhead Press":"ohp"}[ex.name];let scale=(bw||80)/80;p=pctInterpolate(metric,benchmarks[sex][key].map(v=>v*scale));}else{let base={ "Lateral Raise":12,"Leg Press":180,"Leg Extension":90,"Leg Curl":90,"Chest Press":120,"Shoulder Press":70,"Tricep Pushdown":50,"Cable Curl":45,"Cable Fly":40,"Lat Pulldown":100,"Cable Row":110,"Bicep Curl":35,"Hammer Curl":40,"Dumbbell Bench Press":55,"Dumbbell Shoulder Press":35,"Dumbbell Row":55,"Front Squat":100,"Barbell Row":90,"Calf Raise":120,"Pull-Up":10,"Chin-Up":10,"Dip":20,"Push-Up":30,"Plank":90,"Side Plank":45,"Cable Woodchop":30,"Russian Twist":30,"Running":8}[ex.name]||50;let normalized=metric/base;p=50+50*Math.tanh(Math.log(Math.max(normalized,.05))*1.25);p=Math.max(1,Math.min(99.9,p))}return {pct:p,...rankFromPct(p)}}
function rankFromPct(p){let bands=[10,20,30,40,50,60,70,80,85,90,92,94,95,96,97,98,99,99.5,99.8,99.9,99.95,99.99,99.995];let idx=0;for(let i=0;i<bands.length;i++)if(p>=bands[i])idx=i+1;idx=Math.min(idx,23);return {name:ranks[Math.floor(idx/3)],div:divs[idx%3],icons:icons[ranks[Math.floor(idx/3)]].repeat(idx%3+1)}}
function addRank(){if(!selectedRankExercise){alert("Select an exercise first.");return}let e=selectedRankExercise,m=e.method,metric=0,bw=+(document.getElementById("bodyweight")?.value||data.bodyweight||160),sex=document.getElementById("sex")?.value||"male";if(m==="one_rm")metric=+document.getElementById("rankWeight").value;else if(m==="weight_reps")metric=e1rm(+document.getElementById("rankWeight").value,+document.getElementById("rankReps").value);else if(m==="bw_plus_weight")metric=bw+(+document.getElementById("rankWeight").value||0);else if(m==="reps")metric=+document.getElementById("rankReps").value;else if(m==="time")metric=+document.getElementById("rankTime").value;else if(m==="distance_time"){let d=+document.getElementById("rankDistance").value,t=+document.getElementById("rankTime").value;metric=d*1000/t}if(!metric||metric<0){alert("Enter a valid performance.");return}data.bodyweight=bw;let result=rankForMetric(e,metric,sex,bw/2.20462);data.rankings[e.name]={metric,pct:result.pct,rank:result,method:m,bodyweight:bw,updated:new Date().toISOString()};data.rankHistory=data.rankHistory||{};data.rankHistory[e.name]=data.rankHistory[e.name]||[];data.rankHistory[e.name].push({metric,pct:result.pct,date:new Date().toISOString()});save();showModal("Rank Calculated",`<div class="rank">${result.name} ${result.div}</div><div class="icons">${result.icons}</div><p><b>${result.pct.toFixed(1)}th percentile</b> benchmark estimate</p><p class="muted">${e.name} · ${metricDisplay(e,metric)}</p>`);render()}
function metricDisplay(e,v){if(e.method==="time")return Math.round(v)+" sec";if(e.method==="distance_time")return v.toFixed(2)+" distance/sec";if(e.method==="reps")return Math.round(v)+" reps";return Math.round(v)+" lb strength score"}
function overall(){let vals=Object.values(data.rankings).map(x=>x.pct);if(!vals.length)return null;let avg=vals.reduce((a,b)=>a+b,0)/vals.length;return {pct:avg,...rankFromPct(avg)}}
function renderRanks(){let c=document.getElementById("rankList"),entries=Object.entries(data.rankings);c.innerHTML=entries.length?`<div class="label" style="margin-top:18px">Your ranked exercises</div>`+entries.map(([e,x])=>`<div class="exercise"><div><b>${e}</b><div class="metric">${metricDisplay(getEx(e),x.metric)} · ${x.pct.toFixed(1)}th percentile</div></div><span class="badge">${x.rank.name} ${x.rank.div}<br>${x.rank.icons}</span></div>`).join(""):'<div class="empty">No ranked exercises yet.</div>'}
function muscleData(m){let vals=[];exerciseDB.filter(e=>e.muscles.includes(m)).forEach(e=>{if(data.rankings[e.name])vals.push({e,x:data.rankings[e.name]})});return vals}
const anatomyStates=new WeakMap();
const anatomyRegions={
  front:{
    1:{label:"Left Pectoralis Major",group:"Chest"},2:{label:"Right Pectoralis Major",group:"Chest"},
    3:{label:"Left Deltoid",group:"Shoulders"},4:{label:"Right Deltoid",group:"Shoulders"},
    5:{label:"Left Biceps",group:"Biceps"},6:{label:"Right Biceps",group:"Biceps"},
    7:{label:"Left Triceps",group:"Triceps"},8:{label:"Right Triceps",group:"Triceps"},
    9:{label:"Left Forearm",group:"Forearms"},10:{label:"Right Forearm",group:"Forearms"},
    11:{label:"Rectus Abdominis",group:"Abs"},12:{label:"Left Oblique",group:"Obliques"},13:{label:"Right Oblique",group:"Obliques"},
    14:{label:"Left Quadriceps",group:"Quads"},15:{label:"Right Quadriceps",group:"Quads"},
    16:{label:"Left Gastrocnemius",group:"Calves"},17:{label:"Right Gastrocnemius",group:"Calves"}
  },
  back:{
    1:{label:"Left Deltoid",group:"Shoulders"},2:{label:"Right Deltoid",group:"Shoulders"},
    3:{label:"Left Triceps",group:"Triceps"},4:{label:"Right Triceps",group:"Triceps"},
    5:{label:"Left Forearm",group:"Forearms"},6:{label:"Right Forearm",group:"Forearms"},
    7:{label:"Left Latissimus Dorsi",group:"Lats"},8:{label:"Right Latissimus Dorsi",group:"Lats"},
    9:{label:"Erector Spinae",group:"Lower Back"},
    16:{label:"Upper Back (Trapezius)",group:"Upper Back"},
    10:{label:"Left Gluteus Maximus",group:"Glutes"},11:{label:"Right Gluteus Maximus",group:"Glutes"},
    12:{label:"Left Hamstring",group:"Hamstrings"},13:{label:"Right Hamstring",group:"Hamstrings"},
    14:{label:"Left Gastrocnemius",group:"Calves"},15:{label:"Right Gastrocnemius",group:"Calves"}
  }
};
function anatomySide(img){return img.closest(".body-diagram")?.querySelector(".diagram-title")?.textContent.toLowerCase().includes("back")?"back":"front"}
function getMaskIdAtPoint(state,x,y,cw,ch){
  const sx=Math.max(0,Math.min(state.w-1,Math.round(x*state.w/Math.max(cw,1))));
  const sy=Math.max(0,Math.min(state.h-1,Math.round(y*state.h/Math.max(ch,1))));
  const idAt=(px,py)=>state.data[(py*state.w+px)*4];
  let id=idAt(sx,sy);if(id)return id;
  // Search a small radius so thin anti-aliased edges still select the exact neighboring colored muscle.
  for(let r=1;r<=12;r++){
    for(let dy=-r;dy<=r;dy++){
      for(let dx=-r;dx<=r;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
        const px=sx+dx,py=sy+dy;if(px<0||py<0||px>=state.w||py>=state.h)continue;
        id=idAt(px,py);if(id)return id;
      }
    }
  }
  return 0;
}
function selectAnatomyRegion(img,id){
  const side=anatomySide(img),region=anatomyRegions[side]?.[id];if(!region)return;
  selectedAnatomyRegion={id,label:region.label,group:region.group,side};
  selectedMuscle=region.group;
  document.querySelectorAll('.selected-muscle-label').forEach(x=>x.textContent='Selected: '+region.label);
  highlightSelectedRegion(side,id);
  renderMuscleDetail();
}
function selectMuscle(m){
  // Backward-compatible entry point for any existing UI code that selects a muscle group.
  selectedMuscle=m;selectedAnatomyRegion=null;
  document.querySelectorAll('.selected-muscle-label').forEach(x=>x.textContent='Selected: '+m);
  clearMuscleHighlights();renderMuscleDetail();
}
function highlightSelectedRegion(side,id){
  document.querySelectorAll('.anatomy img').forEach(img=>{
    const state=anatomyStates.get(img),canvas=img.parentElement.querySelector('.highlight-canvas');if(!state?.ready||!canvas)return;
    resizeAnatomyCanvas(img);
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    if(anatomySide(img)!==side)return;
    const out=ctx.createImageData(state.w,state.h),d=state.data;
    for(let y=0;y<state.h;y++){
      for(let x=0;x<state.w;x++){
        const i=(y*state.w+x)*4;if(d[i]!==id)continue;
        out.data[i]=255;out.data[i+1]=255;out.data[i+2]=255;out.data[i+3]=105;
        // White edge around the exact selected pixels makes the anatomical boundary unmistakable.
        const edge=(x===0||y===0||x===state.w-1||y===state.h-1||d[((y-1)*state.w+x)*4]!==id||d[((y+1)*state.w+x)*4]!==id||d[(y*state.w+x-1)*4]!==id||d[(y*state.w+x+1)*4]!==id);
        if(edge){out.data[i]=255;out.data[i+1]=255;out.data[i+2]=255;out.data[i+3]=230;}
      }
    }
    ctx.putImageData(out,0,0);
  });
}
function clearMuscleHighlights(){document.querySelectorAll('.highlight-canvas').forEach(c=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height)})}
function renderMuscleDetail(){let c=document.getElementById("muscleDetail");if(!selectedMuscle){c.innerHTML='<div class="empty">Select a colored muscle to see your strength and progress.</div>';return}let vals=muscleData(selectedMuscle);if(!vals.length){c.innerHTML=`<div class="muscle-detail-head"><div><div class="label">${selectedMuscle}</div>${selectedAnatomyRegion?`<div class="metric">${selectedAnatomyRegion.label}</div>`:""}<div class="rank">Not ranked yet</div><div class="muted">Rank an exercise below to start tracking this muscle.</div></div><div class="badge">🏆 Rankable</div></div><div style="margin-top:12px"><div class="label">Related exercises</div>${exerciseDB.filter(e=>e.muscles.includes(selectedMuscle)).map(e=>`<span class="chip">${e.name}</span>`).join("")}</div>`;return}let avg=vals.reduce((a,b)=>a+b.x.pct,0)/vals.length;let rr=rankFromPct(avg);let history=data.rankHistory||{};let old=[];vals.forEach(v=>(history[v.e.name]||[]).forEach(h=>old.push(h.pct)));let first=old.length?Math.min(...old):avg;let change=avg-first;let sign=change>=0?"+":"";c.innerHTML=`<div class="muscle-detail-head"><div><div class="label">${selectedMuscle}</div>${selectedAnatomyRegion?`<div class="metric">${selectedAnatomyRegion.label}</div>`:""}<div class="rank">${rr.name} ${rr.div}</div><div class="icons">${rr.icons}</div><div class="muted">${avg.toFixed(1)}th percentile</div></div><div style="text-align:right"><div class="label">Improvement</div><div class="muscle-stat success">${sign}${change.toFixed(1)}%</div><div class="muted">Since your first check-in</div></div></div><div class="statline"><span>Ranked exercises</span><span>${vals.length}</span></div><div class="label">Strength progress</div><div class="progress"><span style="width:${Math.min(100,avg)}%"></span></div>${vals.map(v=>`<div class="exercise"><div><b>${v.e.name}</b><div class="metric">${methodLabel(v.e.method)} · ${v.x.pct.toFixed(1)}th percentile</div></div><span class="badge">${v.rank?.name||v.x.rank.name}</span></div>`).join("")}<div class="notice">Your muscle score is the average benchmark percentile of ranked exercises that train ${selectedMuscle}. Keep logging check-ins to build a real progress trend.</div>`}
function renderMuscleSummary(){document.getElementById("muscleSummary").innerHTML=muscles.map(m=>{let vals=muscleData(m);let p=vals.length?vals.reduce((a,b)=>a+b.x.pct,0)/vals.length:0;return `<div class="statline"><span>${m}</span><span>${vals.length?p.toFixed(0)+"%":"—"}</span></div><div class="progress"><span style="width:${p}%"></span></div>`}).join("")}
function render(){let o=overall();document.getElementById("workouts").textContent=data.workouts.length;document.getElementById("prs").textContent=Object.keys(data.prs).length;document.getElementById("sets").textContent=data.workouts.reduce((a,b)=>a+b.sets,0);document.getElementById("xp").textContent=data.xp;document.getElementById("level").textContent="LVL "+data.level;document.getElementById("overallRank").textContent=o?`${o.name} ${o.div}`:"Add a ranked exercise";document.getElementById("overallIcons").textContent=o?o.icons:"";document.getElementById("overallPct").textContent=o?`${o.pct.toFixed(1)}th percentile benchmark score`:"No overall percentile yet";document.getElementById("profileRank").textContent=o?`${o.name} ${o.div}`:"—";document.getElementById("profileIcons").textContent=o?o.icons:"";document.getElementById("profilePct").textContent=o?`${o.pct.toFixed(1)}th percentile benchmark score`:"—";document.getElementById("profileLevel").textContent=data.level;document.getElementById("profileXP").textContent=data.xp;document.getElementById("profilePRs").innerHTML=Object.entries(data.prs).map(([e,v])=>`<div class="exercise"><span>${e}</span><span class="badge">${formatScore(v,getEx(e)?.method)}</span></div>`).join("")||'<div class="empty">No PRs yet.</div>';renderToday();renderRanks();renderRankPicker();renderRankInputs();renderMuscleDetail();renderMuscleSummary()}
function showModal(t,m){document.getElementById("modalTitle").textContent=t;document.getElementById("modalText").innerHTML=m;document.getElementById("modal").classList.add("show")}
function closeModal(){document.getElementById("modal").classList.remove("show")}
init();
