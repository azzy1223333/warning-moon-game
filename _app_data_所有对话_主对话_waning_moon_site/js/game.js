
// ====== MULTI-PAGE SUPPORT ======
const PAGE_MAP = {
  'index.html': 'index',
  'phase0.html': 'phase0',
  'phase1.html': 'phase1', 
  'phase2.html': 'phase2',
  'phase3.html': 'phase3',
  'phase4.html': 'phase4'
};

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  return PAGE_MAP[filename] || 'index';
}

function navigateToPhase(phaseIdx) {
  const pages = ['phase0.html', 'phase1.html', 'phase2.html', 'phase3.html', 'phase4.html'];
  if (phaseIdx >= 0 && phaseIdx < pages.length) {
    window.location.href = pages[phaseIdx];
  }
}


// ====== GAME STATE ======
const GS = {
  phase: 0, scene: 0,
  puzzles: {}, clues: [],
  anomalyCount: 0, startTime: Date.now(),
  phaseProgress: [0,0,0,0,0],
  phasesUnlocked: [false,false,false,false,false],
  warningTriggered: false,
  eyeTrackingActive: false,
  audioCtx: null, ambientOsc: null,
  countdown72: null
};

const PUZZLES = {
  '1.1': {answer:'WL-5246-0317', hint:'编号格式：WL-年份-月日，入学日期是关键'},
  '1.2': {answer:'all_revealed', hint:'还原所有三段涂黑内容'},
  '1.3': {answer:'月光协议', hint:'在法规数据库中找到那个被修正增设的条款'},
  '1.4': {answer:'rabbit404', hint:'莫尔斯电码转换后全部小写无分隔符'},
  '2.1': {answer:'524-3171225', hint:'伊尧编号后三位+与萝编号后四位+伊尧编号后四位'},
  '2.2': {answer:'sorted', hint:'按时间顺序正确排列所有日志'},
  '2.3': {answer:'SUBJECT RABBIT SHOWS IMMUNITY', hint:'按化学名对照手册逐字解码', caseSensitive:true},
  '2.4': {answer:'N22E114', hint:'兔子玩偶上绣着的坐标'},
  '3.1': {answer:'arranged', hint:'按月亮相位正确排列7幅画'},
  '3.2': {answer:'307', hint:'素描纸张背面的房间号'},
  '3.3': {answer:'decrypted', hint:'用WANINGMOON密钥解密Vigenère通信'},
  '3.4': {answer:'37', hint:'倒放歌词中提到的缝线编号'},
  '3.5': {answer:'enter4', hint:'从名单中发现关键信息后进入第四阶段'},
  '4.1': {answer:'hacked', hint:'完成终端入侵序列'},
  '4.2': {answer:'永远会保护她', hint:'父亲信件的藏头诗'},
  '4.3': {answer:'found', hint:'调整频率到正确位置'},
  '4.4': {answer:'choice', hint:'做出你的最终选择'}
};

// ====== HINT SYSTEM ======
const HINTS = {
  'puzzle_1_1': {
    1: '这份档案的编号格式似乎和入学信息有关...',
    2: '看看WL后面的数字，再看看入学日期...',
    3: '编号的最后四位，和入学日期的月份与日，有什么关系？'
  },
  'puzzle_1_2': {
    1: '三段文字使用了不同的加密方式...',
    2: '试试使用不同的工具按钮来还原每一段...',
    3: '每段对应一个工具。全部还原后会自动推进。'
  },
  'puzzle_1_3': {
    1: '标签上好像不只有药品名称...把倍率调高看看',
    2: '极小的文字...是关于这种药的适用范围',
    3: '用适用范围中的关键词去数据库搜索试试'
  },
  'puzzle_1_4': {
    1: '背景噪音中好像有规律的信号...',
    2: '这些信号可能是莫尔斯电码，试试解码',
    3: 'R-A-B-B-I-T-4-0-4...这个组合让你想到什么？全部小写无分隔符输入'
  },
  'puzzle_2_1': {
    1: '这个文件被加密了。密钥应该就在你之前收集的编号中...',
    2: '伊尧和与萝的编号有什么共同部分？试着组合一下...',
    3: '两个编号的共同前缀(524) + 与萝的出生月日(317) + 伊尧的出生月日(1225)，拼在一起就是密钥'
  },
  'puzzle_2_2': {
    1: '这些日志的时间戳有些不对劲，有些被篡改了',
    2: '按照事件发生的逻辑顺序排列——先有情绪波动，再有异常反应',
    3: '注意有几条日志的时间戳和其他事件矛盾，修正它们'
  },
  'puzzle_2_3': {
    1: '这些化学分子式...也许不是普通的化学配方？',
    2: '试试用药物编码手册对照每个分子式',
    3: '每个分子式对应一个字母。全部拼起来读读看'
  },
  'puzzle_2_4': {
    1: '玩偶上的缝线数字不是装饰...',
    2: 'N和E代表什么？这像是某种地理标记...',
    3: 'N 22°34\' E 114°06\' 是一个坐标。试试简化格式输入（如N22E114）'
  },
  'puzzle_3_1': {
    1: '月亮的朝向各不相同，也许排列顺序和月亮有关...',
    2: '新月→蛾眉月→上弦月...按照月亮盈亏的自然顺序',
    3: '从新月开始，按相位周期排列：新月→蛾眉月→上弦月→盈凸月→满月→亏凸月→下弦月'
  },
  'puzzle_3_2': {
    1: '五张素描各有不同...也许叠加后会有新的信息？',
    2: '持续点击切换，直到看到完整的图案',
    3: '纸张背面似乎还隐藏着什么...'
  },
  'puzzle_3_3': {
    1: '这个加密方式叫Vigenère密码，你需要找到密钥',
    2: '密钥和游戏的核心主题有关——"残月"...',
    3: '残月的英文是 Waning Moon，去掉空格连在一起'
  },
  'puzzle_3_4': {
    1: '这首歌的歌词...也许不只是歌词',
    2: '试试把歌曲倒放，听听隐藏的信息',
    3: '倒放后揭示的信息提到了一个数字——那个缝线编号'
  },
  'puzzle_4_1': {
    1: '你需要进入天空城服务器。第一步是建立连接...',
    2: '用 connect 命令连接目标，然后用 auth 命令带上你们收集到的编号...',
    3: '命令序列：1.connect sky-city-server 2.auth 与萝编号 伊尧编号 3.decrypt --key 密钥 4.find new-moon-protocol 5.download all'
  },
  'puzzle_4_2': {
    1: '这封信的格式好像有点特别...',
    2: '每行诗句的开头...有什么规律吗？',
    3: '把每句诗的第一个字连起来读...'
  },
  'puzzle_4_3': {
    1: '信号被埋在白噪音下面。试试不同的频率...',
    2: '当频率接近时，噪音会变化，信号会增强',
    3: '试试 400-410 之间的频率...某个数字和兔子有关'
  }
};

const hintLevels = {};

function showHint(puzzleId) {
  const content = document.getElementById('hint_' + puzzleId);
  if (!content) return;
  content.style.display = 'block';
  if (!hintLevels[puzzleId]) hintLevels[puzzleId] = 0;
  hintLevels[puzzleId] = 1;
  document.getElementById('hint_1_' + puzzleId).style.display = 'block';
  const nextBtn = content.querySelector('.hint-next');
  if (nextBtn) nextBtn.style.display = 'inline-block';
  // Hide the main hint button
  const mainBtn = content.previousElementSibling;
  if (mainBtn && mainBtn.classList.contains('hint-btn')) mainBtn.style.display = 'none';
}

function nextHint(puzzleId) {
  if (!hintLevels[puzzleId]) return;
  hintLevels[puzzleId]++;
  const level = hintLevels[puzzleId];
  const levelEl = document.getElementById('hint_' + level + '_' + puzzleId);
  if (levelEl) {
    levelEl.style.display = 'block';
  }
  if (level >= 3) {
    const nextBtn = document.querySelector('#hint_' + puzzleId + ' .hint-next');
    if (nextBtn) nextBtn.style.display = 'none';
  }
}

function renderHintSystem(puzzleId) {
  const h = HINTS[puzzleId];
  if (!h) return '';
  return `<div class="hint-system">
    <button class="hint-btn" onclick="showHint('${puzzleId}')">💡 提示</button>
    <div class="hint-content" id="hint_${puzzleId}" style="display:none">
      <div class="hint-level" id="hint_1_${puzzleId}" style="display:none">${h[1]}</div>
      <div class="hint-level" id="hint_2_${puzzleId}" style="display:none">${h[2]}</div>
      <div class="hint-level" id="hint_3_${puzzleId}" style="display:none">${h[3]}</div>
      <button class="hint-next" onclick="nextHint('${puzzleId}')" style="display:none">💡 需要更多帮助...</button>
    </div>
  </div>`;
}

// ====== SAVE/LOAD ======
function saveGame(){
  localStorage.setItem('waningmoon_save', JSON.stringify({
    phase:GS.phase, scene:GS.scene, puzzles:GS.puzzles,
    clues:GS.clues, anomalyCount:GS.anomalyCount,
    phaseProgress:GS.phaseProgress, phasesUnlocked:GS.phasesUnlocked
  }));
}
function loadGame(){
  const d=localStorage.getItem('waningmoon_save');
  if(!d) return false;
  try{
    const s=JSON.parse(d);
    Object.assign(GS,s);
    return true;
  }catch(e){return false}
}

// ====== UI HELPERS ======
function $(id){return document.getElementById(id)}
function show(id){$(id).classList.add('active')}
function hide(id){$(id).classList.remove('active')}
function notify(msg,type='success'){
  const n=$('notification');
  n.textContent=msg;
  n.className='notification show '+(type||'');
  setTimeout(()=>n.classList.remove('show'),3000);
}
function triggerGlitch(){
  const g=$('glitchOverlay');
  g.classList.add('active');
  setTimeout(()=>g.classList.remove('active'),150);
}
function addAnomaly(){
  GS.anomalyCount++;
  $('anomalyCount').textContent='异常事件：'+GS.anomalyCount;
}
function typewriter(el,text,speed=50){
  let i=0;
  el.textContent='';
  const t=setInterval(()=>{
    if(i<text.length){el.textContent+=text[i];i++}
    else clearInterval(t);
  },speed);
}
function addClue(text){
  if(GS.clues.includes(text)) return;
  GS.clues.push(text);
  const d=document.createElement('div');
  d.className='clue-item new';
  d.textContent='• '+text;
  $('clueList').appendChild(d);
  setTimeout(()=>d.classList.remove('new'),500);
  saveGame();
}
function updateProgress(phase,pct){
  GS.phaseProgress[phase]=pct;
  const fills=document.querySelectorAll('.nav-phase');
  fills.forEach((f,i)=>{
    const fill=f.querySelector('.progress-fill');
    if(fill) fill.style.width=GS.phaseProgress[i]+'%';
  });
  saveGame();
}

// ====== AUDIO ======
function initAudio(){
  if(GS.audioCtx) return;
  GS.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  startAmbient();
}
function startAmbient(){
  if(!GS.audioCtx) return;
  const o=GS.audioCtx.createOscillator();
  const g=GS.audioCtx.createGain();
  o.type='sine';o.frequency.value=55;
  g.gain.value=0.03;
  o.connect(g);g.connect(GS.audioCtx.destination);
  o.start();
  GS.ambientOsc=o;
  setInterval(()=>{
    if(Math.random()>0.85) playStatic();
  },5000);
}
function playStatic(){
  if(!GS.audioCtx) return;
  const buf=GS.audioCtx.createBuffer(1,GS.audioCtx.sampleRate*0.1,GS.audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.05;
  const s=GS.audioCtx.createBufferSource();
  s.buffer=buf;s.connect(GS.audioCtx.destination);s.start();
}
function playBeep(freq=440,dur=0.1){
  if(!GS.audioCtx) return;
  const o=GS.audioCtx.createOscillator();
  const g=GS.audioCtx.createGain();
  o.frequency.value=freq;g.gain.value=0.1;
  o.connect(g);g.connect(GS.audioCtx.destination);
  o.start();
  o.stop(GS.audioCtx.currentTime+dur);
}

// ====== SCREENS ======
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
}
function showBoot(){showScreen('bootScreen')}

let bootHintLevel=0;
function showBootHint(){
  bootHintLevel++;
  const el=$('bootHintText');
  el.style.display='block';
  if(bootHintLevel===1) el.innerHTML='系统日志中闪烁的文字...也许是某种错误代码？注意"NULL"这个关键词...';
  else if(bootHintLevel===2) el.innerHTML='错误代码格式是 ERR_NULL_XXX。把 ERR_ 去掉，再想想"公民"对应的英文...';
  else if(bootHintLevel>=3){
    el.innerHTML='完整代码：<span style="color:var(--warn);letter-spacing:2px">NULL-CITIZEN</span>（注意中间的连字符）';
    el.style.color='var(--warn)';
  }
}

function submitBoot(){
  initAudio();
  const v=$('bootInput').value.trim();
  if(v.toUpperCase()==='NULL-CITIZEN'){
    $('bootResult').innerHTML='<span style="color:var(--success)">身份核验中...</span>';
    setTimeout(()=>{
      $('bootResult').innerHTML='<span style="color:var(--warn)">检测到异常记录。进入受限模式。</span>';
      setTimeout(()=>{
        window.location.href='phase0.html';
      },1500);
    },1500);
  } else if(v){
    $('bootResult').textContent='查询失败。你的记录已被标记。';
    addAnomaly();
    triggerGlitch();
  }
}

// ====== RESET ======
function resetGame(){
  if(!confirm('确定要重置所有游戏进度吗？\n此操作不可撤销。')) return;
  localStorage.removeItem('waningmoon_save');
  // Reset game state
  GS.phase=0; GS.scene=0;
  GS.puzzles={}; GS.clues=[];
  GS.anomalyCount=0; GS.startTime=Date.now();
  GS.phaseProgress=[0,0,0,0,0];
  GS.phasesUnlocked=[false,false,false,false,false];
  GS.warningTriggered=false;
  GS.eyeTrackingActive=false;
  GS.phasesUnlocked[0]=true;
  if(GS.countdown72) clearInterval(GS.countdown72);
  GS.countdown72=null;
  bootHintLevel=0;
  notify('进度已重置','success');
  setTimeout(()=>{ window.location.href='index.html'; }, 1000);
}

// ====== GAME INIT ======
function restoreClues(){
  const cl=$('clueList');
  if(cl && GS.clues){
    cl.innerHTML='';
    GS.clues.forEach(text=>{
      const d=document.createElement('div');
      d.className='clue-item';
      d.textContent='• '+text;
      cl.appendChild(d);
    });
  }
  const ac=$('anomalyCount');
  if(ac) ac.textContent='异常事件：'+GS.anomalyCount;
  const fills=document.querySelectorAll('.nav-phase');
  fills.forEach((f,i)=>{
    const fill=f.querySelector('.progress-fill');
    if(fill) fill.style.width=GS.phaseProgress[i]+'%';
  });
}

function initGame(){
  const hasSave=loadGame();
  const page = getCurrentPage();
  const phaseForPage = {'phase0':0,'phase1':1,'phase2':2,'phase3':3,'phase4':4}[page];
  if(phaseForPage === undefined) return;
  
  if(hasSave && !GS.phasesUnlocked[phaseForPage]){
    let target = 0;
    for(let i=4;i>=0;i--){ if(GS.phasesUnlocked[i]){target=i;break;} }
    const pages = ['phase0.html','phase1.html','phase2.html','phase3.html','phase4.html'];
    notify('该阶段尚未解锁，跳转到已解锁的最新阶段','error');
    setTimeout(()=>{ window.location.href = pages[target]; }, 1500);
    return;
  }
  
  GS.phase = phaseForPage;
  buildNav();
  if(hasSave){
    renderPhase(phaseForPage, GS.scene);
    restoreClues();
  } else {
    GS.phasesUnlocked[0]=true;
    renderPhase(phaseForPage,0);
  }
  startGameClock();
  startRandomEffects();
  // Initial horror: brief system anomaly
  setTimeout(()=>{
    const noise=$('staticNoise');
    if(noise){noise.classList.add('active');setTimeout(()=>noise.classList.remove('active'),300)}
    const flash=$('horrorFlash');const txt=$('horrorText');
    if(flash&&txt){
      txt.textContent='ERR_NULL_CITIZEN';
      flash.classList.add('active');
      setTimeout(()=>flash.classList.remove('active'),200);
    }
    playBeep(100,0.15);
  },1500);
}

function buildNav(){
  const phases=[
    {name:'第一阶段',title:'月光档案室',desc:'寻找与萝的记录'},
    {name:'第二阶段',title:'月光协议',desc:'深入实验数据库'},
    {name:'第三阶段',title:'记忆碎片',desc:'拼凑被抹去的记忆'},
    {name:'第四阶段',title:'新月计划',desc:'72小时倒计时'},
    {name:'终局',title:'最终选择',desc:'月出？月落？月光不灭？'}
  ];
  let html='';
  phases.forEach((p,i)=>{
    const locked=!GS.phasesUnlocked[i]?'locked':'';
    const active=GS.phase===i?'active':'';
    html+=`<div class="nav-phase ${locked} ${active}" onclick="navToPhase(${i})">
      <h4>${p.name}</h4>
      <div style="font-size:.75em;color:var(--text)">${p.title}</div>
      <div class="phase-desc">${p.desc}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${GS.phaseProgress[i]}%"></div></div>
    </div>`;
  });
  $('navPanel').innerHTML=html;
}

function navToPhase(i){
  if(!GS.phasesUnlocked[i]){notify('该阶段尚未解锁','error');return}
  GS.phase=i; GS.scene=0;
  saveGame();
  navigateToPhase(i);
}

function updatePuzzlePlaceholder(){
  const hints={
    '0.0':'输入档案编号 (WL-????-????)...',
    '0.1':'还原涂黑内容后...',
    '0.2':'输入发现的协议名称...',
    '0.3':'输入莫尔斯电码解码结果...',
    '1.0':'输入解密密钥...',
    '1.1':'按时间顺序点击日志...',
    '1.2':'输入解码后的完整信息...',
    '1.3':'输入坐标...',
    '2.0':'按顺序排列画作...',
    '2.1':'输入房间号...',
    '2.2':'解密后点击确认...',
    '2.3':'输入倒放揭示的数字...',
    '2.4':'从名单中获取关键信息...',
    '3.0':'完成终端命令...',
    '3.1':'输入藏头信息...',
    '3.2':'调整频率锁定信号...',
    '3.3':'做出最终选择...',
  };
  const key=GS.phase+'.'+GS.scene;
  const el=$('puzzleInput');
  if(el && hints[key]) el.placeholder=hints[key];
}

function renderPhase(phase,scene){
  const cp=$('contentPanel');
  switch(phase){
    case 0: renderPhase1(cp,scene); break;
    case 1: renderPhase2(cp,scene); break;
    case 2: renderPhase3(cp,scene); break;
    case 3: renderPhase4(cp,scene); break;
    case 4: renderEnding(cp,scene); break;
  }
  $('phaseIndicator').textContent=['月光档案室','月光协议','记忆碎片','新月计划','最终选择'][phase];
  updatePuzzlePlaceholder();
}

// ====== PUZZLE SUBMISSION WITH BETTER FEEDBACK ======
const ERROR_FEEDBACK = {
  '1.1': '编号格式不对。再看看档案和花名册之间的关联...',
  '1.3': '没有找到这个名称。试试从标签上的适用范围关键词入手...',
  '1.4': '这个频道名称好像不太对。再仔细看看莫尔斯电码的解码结果...',
  '2.1': '密钥格式不对。想想之前收集到的编号中有什么规律...',
  '2.3': '解码结果不正确。仔细对照化学分子式和手册...',
  '2.4': '坐标格式不对。看看玩偶上的标记...',
  '3.2': '房间号不对。再看看素描叠加后的信息...',
  '3.3': '密钥不正确。想想游戏的核心主题是什么...',
  '3.4': '数字不对。再仔细听听倒放的歌词...',
  '4.2': '藏头信息不对。再仔细看看每句诗的开头...',
};

function submitPuzzle(){
  const v=$('puzzleInput').value.trim();
  const key=(GS.phase+1)+'.'+(GS.scene+1);
  const p=PUZZLES[key];
  if(!p) return;
  
  let correct = p.caseSensitive ? (v===p.answer) : (v.toLowerCase()===p.answer.toLowerCase());
  
  // Special handling for 2.1: accept multiple formats
  if(key==='2.1'){
    const normalized = v.replace(/[-\s]/g,'');
    correct = (normalized==='5243171225');
  }
  
  // Special handling for certain puzzles
  if(key==='1.2' && GS.puzzles['1.2_a'] && GS.puzzles['1.2_b'] && GS.puzzles['1.2_c']){
    unlockPuzzle(key); return;
  }
  if(key==='2.2' && GS.puzzles['2.2_sorted']){
    unlockPuzzle(key); return;
  }
  if(key==='3.1' && GS.puzzles['3.1_arranged']){
    unlockPuzzle(key); return;
  }
  if(key==='3.3' && GS.puzzles['3.3_decrypted']){
    unlockPuzzle(key); return;
  }
  if(key==='4.1' && GS.puzzles['4.1_done']){
    unlockPuzzle(key); return;
  }
  if(key==='4.3' && GS.puzzles['4.3_found']){
    unlockPuzzle(key); return;
  }
  if(key==='4.4'){
    handleEndingChoice(v);
    return;
  }
  
  if(correct){
    unlockPuzzle(key);
  } else {
    const fb = ERROR_FEEDBACK[key] || '不太对...再想想。试试获取提示？';
    notify(fb, 'error');
    playBeep(200, 0.2);
  }
}

function unlockPuzzle(key){
  GS.puzzles[key]=true;
  notify('谜题已解开！','success');
  playBeep(880,0.15);
  setTimeout(()=>playBeep(1100,0.1),160);
  $('puzzleInput').value='';
  
  const totalInPhase = [4,4,5,4][GS.phase] || 0;
  const solved = Object.keys(GS.puzzles).filter(k=>k.startsWith((GS.phase+1)+'.')).length;
  updateProgress(GS.phase, Math.round(solved/totalInPhase*100));
  
  if(solved>=totalInPhase){
    if(GS.phase<4){
      GS.phasesUnlocked[GS.phase+1]=true;
      buildNav();
      notify('下一阶段已解锁！','success');
    }
  }
  
  if(key==='1.1'){
    setTimeout(()=>{GS.scene=1; renderPhase1($('contentPanel'),1)},800);
  }
  if(key==='1.3'){
    setTimeout(()=>{GS.scene=3; renderPhase1($('contentPanel'),3)},800);
  }
  if(key==='1.4' && !GS.warningTriggered){
    setTimeout(triggerWarningOverlay, 1000);
  }
  if(key==='2.1'){
    setTimeout(()=>{GS.scene=1; renderPhase2($('contentPanel'),1)},800);
  }
  if(key==='2.3'){
    addClue('实验发现：伊尧对镇静剂免疫');
    setTimeout(()=>{GS.scene=3; renderPhase2($('contentPanel'),3)},800);
  }
  if(key==='2.4'){
    setTimeout(()=>{GS.scene=4; renderPhase2($('contentPanel'),4)},800);
  }
  if(key==='3.2'){
    setTimeout(()=>{GS.scene=2; renderPhase3($('contentPanel'),2)},800);
  }
  if(key==='3.4'){
    setTimeout(()=>{GS.scene=4; renderPhase3($('contentPanel'),4)},800);
  }
  if(key==='4.2'){
    setTimeout(()=>{GS.scene=2; renderPhase4($('contentPanel'),2)},800);
  }
  
  saveGame();
  renderPhase(GS.phase, GS.scene);
}

// ====== PHASE 1: 月光档案室 ======
function renderPhase1(cp,scene){
  GS.scene=scene;
  const scenes=[renderP1S1,renderP1S2,renderP1S3,renderP1S4];
  if(scenes[scene]) scenes[scene](cp);
}

function renderP1S1(cp){
  cp.innerHTML=`
  <h3 class="section-title">📄 泄露文件 - 公民档案</h3>
  <div class="note-text">以下文件从混居区内部系统中泄露。部分内容被涂黑处理。</div>
  <div class="file-viewer reveal-anim">
    <div class="file-header">
      <span>混居区公民矫正档案</span>
      <span>密级：限制</span>
    </div>
    <table style="width:100%;font-size:.85em">
      <tr><td style="color:var(--text2);width:120px">档案编号</td><td>WL-5246-<span class="highlight-text">????</span></td></tr>
      <tr><td style="color:var(--text2)">姓名</td><td><span class="redacted" onclick="this.classList.toggle('revealed')" title="点击切换">██</span></td></tr>
      <tr><td style="color:var(--text2)">物种</td><td>狼族 (Canis lupus-form)</td></tr>
      <tr><td style="color:var(--text2)">入学的籍</td><td>混居区第三中学校</td></tr>
      <tr><td style="color:var(--text2)">入学日期</td><td class="highlight-text">5246年3月17日</td></tr>
      <tr><td style="color:var(--text2)">状态</td><td class="danger-text">已转入矫正设施</td></tr>
      <tr><td style="color:var(--text2)">备注</td><td>5247年9月事件后转入。涉及跨物种<span class="redacted" onclick="this.classList.toggle('revealed')">██</span>异常。</td></tr>
    </table>
  </div>
  <div class="file-viewer" style="margin-top:15px">
    <div class="file-header"><span>混居区第三中学校 花名册（摘录）</span></div>
    <table class="data-table">
      <tr><th>编号</th><th>姓名</th><th>物种</th><th>入学日期</th><th>班级</th></tr>
      <tr><td>RB-5245-1225</td><td>伊尧</td><td>兔族</td><td>5245年12月25日</td><td>2-A</td></tr>
      <tr class="highlight"><td>WL-5246-0317</td><td>██<span class="small-text">(涂黑)</span></td><td>狼族</td><td>5246年3月17日</td><td>2-A</td></tr>
    </table>
  </div>
  ${renderHintSystem('puzzle_1_1')}
  <div style="text-align:right;margin-top:15px">
    ${sceneNavBtn('next')}
  </div>`;
}

function renderP1S2(cp){
  const rA=GS.puzzles['1.2_a']?'revealed':'';
  const rB=GS.puzzles['1.2_b']?'revealed':'';
  const rC=GS.puzzles['1.2_c']?'revealed':'';
  cp.innerHTML=`
  <h3 class="section-title">📄 证人陈述书</h3>
  <div class="note-text">以下陈述书由目击者提供。三段关键内容被涂黑。使用工具还原。</div>
  <div class="tools-panel">
    <button class="tool-btn ${rA?'':'active'}" onclick="revealStatement(0)">亮度增强</button>
    <button class="tool-btn ${rB?'':'active'}" onclick="revealStatement(1)">蓝色通道分离</button>
    <button class="tool-btn ${rC?'':'active'}" onclick="revealStatement(2)">二进制分析</button>
  </div>
  <div class="file-viewer reveal-anim">
    <div class="file-header"><span>证人陈述书 - 编号WT-5247-0915</span></div>
    <p style="line-height:2;font-size:.9em">
      <strong>第一段：</strong><br>
      <span class="redacted ${rA}" id="stmt0" onclick="revealStatement(0)">████████████████████████████████████</span>
    </p>
    <br>
    <p style="line-height:2;font-size:.9em">
      <strong>第二段：</strong><br>
      <span class="redacted ${rB}" id="stmt1" onclick="revealStatement(1)">████████████████████████████████████████████████</span>
    </p>
    <br>
    <p style="line-height:2;font-size:.9em">
      <strong>第三段：</strong><br>
      <span class="redacted ${rC}" id="stmt2" onclick="revealStatement(2)">████████████████████████████████████████████████████████████████</span>
    </p>
  </div>
  ${renderHintSystem('puzzle_1_2')}`;
}

function revealStatement(idx){
  const texts=[
    '我在5247年9月的一个夜晚，与萝——那个狼族女孩——突然失去了控制。',
    '与萝突然失去了控制。她的眼睛变了颜色，从琥珀色变成了血红色。她咬了我。',
    'GDE5ZG55IG5hIGl5IGE5IE11bGwgdGhlIGE5ZyB5YXMgdGFrZW4gYXdheSBpZiBJIGRpZG4ndCBkbyBzb21ldGhpbmcuIEkgcGlja2VkIHVwIHRoZSBzZWRhdGl2ZSBuZWVkbGUgZnJvbSB0aGUgdGFibGUuLi5hbmQgc3RhYmJlZCBpdCBpbnRvIG15IG93biBuZWNrLg=='
  ];
  const decoded=[
    '我在5247年9月的一个夜晚，与萝——那个狼族女孩——突然失去了控制。',
    '与萝突然失去了控制。她的眼睛变了颜色，从琥珀色变成了血红色。她咬了我。',
    '但我知道如果我不做些什么，她会被带走。所以我拿起了桌上的镇静剂针管...刺入了我自己的脖子。'
  ];
  const keys=['1.2_a','1.2_b','1.2_c'];
  GS.puzzles[keys[idx]]=true;
  
  const el=document.getElementById('stmt'+idx);
  if(el){
    el.classList.add('revealed');
    el.textContent=decoded[idx];
  }
  addClue(['5247年9月事件','与萝失控 - 眼睛变色','镇静剂针管 - 自伤行为'][idx]);
  playBeep(660,0.1);
  saveGame();
  
  if(GS.puzzles['1.2_a'] && GS.puzzles['1.2_b'] && GS.puzzles['1.2_c']){
    setTimeout(()=>{
      unlockPuzzle('1.2');
      setTimeout(()=>{GS.scene=2; renderPhase1($('contentPanel'),2)},500);
    },800);
  }
}

function renderP1S3(cp){
  cp.innerHTML=`
  <h3 class="section-title">💊 镇静剂标签分析</h3>
  <div class="note-text">从事故现场提取的镇静剂药瓶标签。放大后发现有极小的文字。</div>
  <div class="image-enhancer">
    <div class="enhance-target" id="labelImage" style="min-height:180px;flex-direction:column;padding:20px;overflow:visible;transition:all 0.3s">
      <div style="border:2px solid var(--accent);padding:15px;width:90%;text-align:center" id="labelInner">
        <div class="label-line" style="color:var(--text2)">混居区药品监管局批准</div>
        <div class="label-line" style="color:var(--warn);margin:10px 0;font-weight:bold">SD-7X 镇静注射液</div>
        <div class="label-line" style="color:var(--text2)">规格：5ml/支 | 批号：5247-0915X</div>
        <div style="margin:10px 0">
          <div class="label-tiny" style="letter-spacing:0.5px">适用于：跨物种情感依恋综合征</div>
        </div>
        <div class="label-line" style="color:var(--text2)">注意：仅限授权矫正机构使用</div>
      </div>
    </div>
    <div class="controls">
      <label>🔍 放大倍率: <input type="range" min="1" max="5" step="1" value="1" oninput="zoomLabel(this.value)"></label>
      <span id="zoomLevel" style="font-size:.8em;color:var(--accent2);margin-left:10px">1x</span>
    </div>
  </div>
  ${renderHintSystem('puzzle_1_3')}
  <div class="search-tool">
    <div style="font-size:.8em;color:var(--accent2);margin-bottom:10px">法规数据库检索</div>
    <div class="search-input">
      <input type="text" id="lawSearch" placeholder="输入关键词搜索..." onkeydown="if(event.key==='Enter')searchLaw()">
      <button onclick="searchLaw()">搜索</button>
    </div>
    <div class="search-results" id="lawResults"></div>
  </div>
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
    ${sceneNavBtn('next')}
  </div>`;
}

function zoomLabel(v){
  v=parseInt(v);
  const lines=document.querySelectorAll('#labelInner .label-line');
  const tiny=document.querySelector('#labelInner .label-tiny');
  const zoomTxt=$('zoomLevel');
  const container=$('labelImage');
  // Scale font sizes: 1x=14px, 2x=20px, 3x=28px, 4x=36px, 5x=44px
  const sizes={1:14,2:20,3:28,4:36,5:44};
  const tinySizes={1:8,2:10,3:16,4:22,5:28};
  const padding={1:15,2:20,3:28,4:35,5:40};
  lines.forEach(l=>l.style.fontSize=sizes[v]+'px');
  if(tiny){
    tiny.style.fontSize=tinySizes[v]+'px';
    // At 3x+, reveal tiny text with highlight color
    if(v>=3){tiny.style.color='var(--warn)';tiny.style.fontWeight='bold'}
    else{tiny.style.color='var(--text2)';tiny.style.fontWeight='normal'}
  }
  if(container) container.style.padding=padding[v]+'px';
  if(zoomTxt) zoomTxt.textContent=v+'x';
  if(v>=3) addClue('镇静剂适用：跨物种情感依恋综合征');
}

function searchLaw(){
  const v=$('lawSearch').value.trim().toLowerCase();
  const results=$('lawResults');
  if(!v){results.innerHTML='';return}
  
  const db=[
    {kw:['跨物种','情感','依恋'],title:'《混居区跨物种关系管理条例》第47条',text:'跨物种情感依恋综合征：指不同物种公民之间产生的超出正常社交范围的情感依赖现象。根据《月光协议》第7修正案增设。详见月光协议相关条款。'},
    {kw:['月光','协议'],title:'《月光协议》第7修正案',text:'本条款根据月光协议第7修正案增设。涉及跨物种情感依恋的强制矫正程序。'},
    {kw:['镇静剂'],title:'《矫正用镇静剂使用规范》',text:'SD-7X型镇静剂仅限授权机构使用。参见跨物种情感依恋综合征相关条款。'},
  ];
  
  let html='';
  let found=false;
  db.forEach(item=>{
    if(item.kw.some(k=>v.includes(k))){
      html+=`<div class="search-result-item" onclick="this.querySelector('.detail').style.display='block'">
        <div class="title">${item.title}</div>
        <div class="detail" style="display:none;margin-top:5px;color:var(--warn)">${item.text}</div>
      </div>`;
      found=true;
      if(item.kw.includes('月光')){
        addClue('发现"月光协议"');
      }
    }
  });
  if(!found) html='<div style="color:var(--text2);padding:10px">未找到相关法规记录</div>';
  results.innerHTML=html;
  
  if(v.includes('月光')||v.includes('协议')){
    setTimeout(()=>{
      notify('发现关键信息：月光协议。请在下方输入框输入答案。','success');
      addClue('月光协议第7修正案');
    },1000);
  }
}

function renderP1S4(cp){
  cp.innerHTML=`
  <h3 class="section-title">🎵 矫正谈话录音分析</h3>
  <div class="note-text">与萝的矫正谈话录音。音频中似乎隐藏着什么。</div>
  <div class="audio-vis">
    <canvas id="audioCanvas" width="500" height="120"></canvas>
    <div class="audio-controls">
      <button onclick="playRecording()">▶ 播放录音</button>
      <button onclick="analyzeSpectrum()">📊 频谱分析</button>
      <button onclick="showMorse()">📡 莫尔斯解码</button>
    </div>
    <div id="recordingText" style="margin-top:10px;font-size:.8em;color:var(--text2)">
      [录音内容] "我不记得了...他们说我不应该记得...但是月亮...月亮每次出来的时候..."
    </div>
    <div id="morseResult" style="display:none;margin-top:15px">
      <div style="font-size:.8em;color:var(--accent2)">频谱分析 - 莫尔斯电码检测：</div>
      <div class="morse-display" id="morseCode">
        ·-· ·- -··· -··· ·· - ····- ----- ····-
      </div>
    </div>
  </div>
  ${renderHintSystem('puzzle_1_4')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
  </div>`;
  
  drawAudioVis();
}

function drawAudioVis(){
  const c=$('audioCanvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  const w=c.width,h=c.height;
  ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#4a6fa5';ctx.lineWidth=1;ctx.beginPath();
  for(let x=0;x<w;x++){
    const y=h/2+Math.sin(x*0.05)*20*Math.sin(x*0.01)+Math.random()*5;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.fillStyle='rgba(74,111,165,0.3)';
  for(let i=0;i<50;i++){
    const bh=Math.random()*40+5;
    ctx.fillRect(i*10,h-bh,8,bh);
  }
}

function playRecording(){
  playBeep(440,0.3);
  notify('正在播放录音...','');
  drawAudioVis();
}

function analyzeSpectrum(){
  playBeep(660,0.2);
  drawAudioVis();
  notify('频谱分析完成，检测到异常信号','success');
}

function showMorse(){
  $('morseResult').style.display='block';
  addClue('莫尔斯电码：检测到有规律信号');
  playBeep(880,0.1);
}

// ====== PHASE 2: 月光协议 ======
function renderPhase2(cp,scene){
  GS.scene=scene;
  const scenes=[renderP2S1,renderP2S2,renderP2S3,renderP2S4,renderP2S5];
  if(scenes[scene]) scenes[scene](cp);
}

function renderP2S1(cp){
  cp.innerHTML=`
  <h3 class="section-title">🔐 实验数据库 - 隐藏站点</h3>
  <div class="note-text">你进入了月光协议的隐藏数据库。文件已加密。</div>
  <div class="file-viewer reveal-anim">
    <div class="file-header"><span>加密文件系统</span><span>安全等级：S</span></div>
    <p style="font-size:.85em;color:var(--text2)">
      文件：<span style="color:var(--warn)">subj_wl-rb_encrypted.dat</span><br>
      大小：2.7MB | 创建日期：5247.09.16<br>
      加密方式：双密钥混合加密<br>
    </p>
    <p style="font-size:.75em;color:var(--danger);margin-top:10px">
      需要输入正确的密钥才能访问文件内容。密钥似乎与已知的公民编号有关联。
    </p>
  </div>
  ${renderHintSystem('puzzle_2_1')}
  <div style="text-align:right;margin-top:10px">
    ${sceneNavBtn('next')}
  </div>`;
}

function renderP2S2(cp){
  const logs=[
    {time:'5247.09.14 08:30',text:'对象RB和WL在第三中学2-A班正常出勤。社交距离监测：过近。'},
    {time:'5247.09.14 12:15',text:'午餐时间。RB将自己餐盒中的胡萝卜分给WL。异常行为记录。'},
    {time:'5247.09.15 09:00',text:'班主任报告：RB和WL课间总是在一起。建议评估。'},
    {time:'5247.09.15 14:00',text:'心理评估员接触RB。RB否认"恋爱关系"。心率异常。'},
    {time:'5247.09.15 16:30',text:'WL表现出焦虑行为。耳朵持续后贴。监测升级。'},
    {time:'5247.09.15 21:00',text:'夜间监测：WL嚎叫持续47分钟。RB在隔壁宿舍无法入睡。'},
    {time:'5247.09.16 07:00',text:'矫正评估委员会紧急会议。决定：启动月光协议干预程序。'},
    {time:'5247.09.16 10:00',text:'[数据损坏] ...转移...隔离...'},
    {time:'5247.09.16 14:00',text:'[数据损坏] ...RB表示...拒绝...分离...'},
    {time:'5247.09.16 18:00',text:'[被篡改] 原记录已被替换为："对象配合度良好，无需进一步干预。"'},
    {time:'5247.09.16 20:00',text:'镇静剂准备。SD-7X型。剂量：标准x2。'},
    {time:'5247.09.16 21:30',text:'[被篡改] 原记录已被替换为："例行检查，无异常。"'},
    {time:'5247.09.16 22:00',text:'执行。WL先注射。WL抵抗。RB在场。'},
    {time:'5247.09.16 22:15',text:'RB用镇静剂针管刺入自己脖子。WL目睹。WL失控。'},
    {time:'5247.09.16 22:30',text:'两名对象均已镇静。记忆消除程序启动。'},
  ];
  
  let logHtml='';
  const shuffled=[6,12,0,8,14,3,11,1,9,5,13,7,2,10,4];
  
  if(GS.puzzles['2.2_sorted']){
    logs.forEach((l,i)=>{
      const tampered=l.text.includes('[被篡改]')?'tampered':'';
      logHtml+=`<div class="log-entry placed ${tampered}">
        <div class="log-time">${l.time}</div>
        <div class="log-text">${l.text}</div>
      </div>`;
    });
    cp.innerHTML=`
    <h3 class="section-title">📋 监控日志（已排序）</h3>
    <div class="note-text success-text">日志已按时间顺序排列。篡改段落已标红。</div>
    ${logHtml}
    <div class="note-text" style="margin-top:15px">
      篡改的3段日志原始内容已被还原。<br>
      拼出信息：干预程序在事件后48小时内启动，RB试图保护WL。
    </div>
    <div style="text-align:right;margin-top:10px">
      ${sceneNavBtn('next')}
    </div>`;
  } else {
    shuffled.forEach(idx=>{
      const l=logs[idx];
      const tampered=l.text.includes('[被篡改]')?'tampered':'';
      logHtml+=`<div class="log-entry ${tampered}" data-idx="${idx}" onclick="selectLog(this,${idx})">
        <div class="log-time">${l.time}</div>
        <div class="log-text">${l.text}</div>
      </div>`;
    });
    cp.innerHTML=`
    <h3 class="section-title">📋 监控日志碎片</h3>
    <div class="note-text">15段监控日志，时间戳混乱。3段被篡改。点击日志按正确时间顺序选择。</div>
    <div id="logSortArea" class="log-sort-area">
      <div style="font-size:.75em;color:var(--text2)">已排序区域（按时间顺序点击日志）：</div>
      <div id="sortedLogs"></div>
    </div>
    <div style="font-size:.75em;color:var(--text2);margin:10px 0">待排序日志（点击加入排序区）：</div>
    <div id="unsortedLogs">${logHtml}</div>
    ${renderHintSystem('puzzle_2_2')}`;
    window._logOrder=[];
    window._logData=logs;
  }
}

function selectLog(el,idx){
  if(GS.puzzles['2.2_sorted']) return;
  const logs=window._logData;
  if(window._logOrder.includes(idx)) return;
  window._logOrder.push(idx);
  el.classList.add('placed');
  el.style.opacity='0.5';
  
  const sorted=$('sortedLogs');
  const l=logs[idx];
  const tampered=l.text.includes('[被篡改]')?'tampered':'';
  const div=document.createElement('div');
  div.className='log-entry placed '+tampered;
  div.innerHTML=`<div class="log-time">${l.time}</div><div class="log-text">${l.text}</div>`;
  sorted.appendChild(div);
  
  playBeep(550,0.05);
  
  if(window._logOrder.length===15){
    const correct=window._logOrder.every((v,i)=>v===i);
    if(correct){
      GS.puzzles['2.2_sorted']=true;
      unlockPuzzle('2.2');
      addClue('监控日志：5247年9月事件全貌');
    } else {
      notify('顺序不完全正确，请重新排列。注意有些日志的时间戳可能和其他事件矛盾...','error');
      window._logOrder=[];
      $('sortedLogs').innerHTML='';
      document.querySelectorAll('#unsortedLogs .log-entry').forEach(e=>{
        e.classList.remove('placed');e.style.opacity='1';
      });
    }
  }
}

function renderP2S3(cp){
  const chemCode={
    'C₁₈H₂₁NO₃':'S','C₈H₉NO₂':'U','C₁₀H₁₂ClNO₂':'B','C₇H₈':'J',
    'C₁₄H₁₈N₂O₅':'E','C₉H₁₃N':'C','C₆H₁₂O₆':'T','C₃H₇NO₂':'A',
    'C₁₁H₁₆N₂O':'R','C₅H₁₁NO₂':'I','C₁₂H₂₂N₂O₂':' ',
    'C₁₀H₁₅N':'W','C₆H₁₄N₂O':'H','C₅H₉NO₄':'O',
    'C₁₀H₁₂N₂O':'M','C₈H₉NO':'N','C₄H₇NO₄':'T','C₅H₇NO₂':'Y'
  };
  
  cp.innerHTML=`
  <h3 class="section-title">🧪 镇静剂配方解码</h3>
  <div class="note-text">镇静剂配方使用化学分子式编码。对照手册解码每个分子式对应的字母。</div>
  <div class="file-viewer reveal-anim">
    <div class="file-header"><span>SD-7X 配方编码</span></div>
    <p style="font-size:.9em;color:var(--accent2);letter-spacing:2px;line-height:2">
      C₁₈H₂₁NO₃ · C₈H₉NO₂ · C₁₀H₁₂ClNO₂ · C₇H₈ · C₁₄H₁₈N₂O₅ · C₉H₁₃N · C₆H₁₂O₆ · C₁₂H₂₂N₂O₂ · C₁₁H₁₆N₂O · C₃H₇NO₂ · C₁₀H₁₂ClNO₂ · C₁₀H₁₂ClNO₂ · C₅H₁₁NO₂ · C₆H₁₂O₆ · C₁₂H₂₂N₂O₂ · C₁₈H₂₁NO₃ · C₆H₁₄N₂O · C₅H₉NO₄ · C₁₀H₁₅N · C₁₈H₂₁NO₃ · C₁₂H₂₂N₂O₂ · C₅H₁₁NO₂ · C₁₀H₁₂N₂O · C₁₀H₁₂N₂O · C₈H₉NO₂ · C₈H₉NO · C₅H₁₁NO₂ · C₆H₁₂O₆ · C₅H₇NO₂
    </p>
  </div>
  <details style="margin:10px 0">
    <summary style="color:var(--accent2);cursor:pointer;font-size:.8em">展开化学名-字母对照手册</summary>
    <table class="data-table chem-table" style="margin-top:10px">
      <tr><th>分子式</th><th>字母</th><th>分子式</th><th>字母</th></tr>
      <tr><td>C₁₈H₂₁NO₃</td><td>S</td><td>C₉H₁₃N</td><td>C</td></tr>
      <tr><td>C₈H₉NO₂</td><td>U</td><td>C₆H₁₂O₆</td><td>T</td></tr>
      <tr><td>C₁₀H₁₂ClNO₂</td><td>B</td><td>C₃H₇NO₂</td><td>A</td></tr>
      <tr><td>C₇H₈</td><td>J</td><td>C₁₁H₁₆N₂O</td><td>R</td></tr>
      <tr><td>C₁₄H₁₈N₂O₅</td><td>E</td><td>C₅H₁₁NO₂</td><td>I</td></tr>
      <tr><td>C₁₂H₂₂N₂O₂</td><td>(空格)</td><td>C₁₀H₁₅N</td><td>W</td></tr>
      <tr><td>C₆H₁₄N₂O</td><td>H</td><td>C₅H₉NO₄</td><td>O</td></tr>
      <tr><td>C₁₀H₁₂N₂O</td><td>M</td><td>C₈H₉NO</td><td>N</td></tr>
      <tr><td>C₄H₇NO₄</td><td>T</td><td>C₅H₇NO₂</td><td>Y</td></tr>
    </table>
  </details>
  ${renderHintSystem('puzzle_2_3')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
    ${sceneNavBtn('next')}
  </div>`;
}

function renderP2S4(cp){
  cp.innerHTML=`
  <h3 class="section-title">📓 伊尧的秘密日记</h3>
  <div class="note-text">在伊尧宿舍枕头下找到的手写日记。纸张泛黄，边角卷起。</div>
  <div class="diary-page reveal-anim">
    <p>5247年9月13日</p>
    <p style="margin-top:15px">与萝今天又画了一幅画。月亮的画。她每个月都画。</p>
    <p style="margin-top:10px">我给她带了一只兔子玩偶。她笑了。她的笑容让我的心跳变得很快。</p>
    <p style="margin-top:10px">我知道这不对。兔族和狼族不应该...</p>
    <p style="margin-top:10px">但是我不在乎。</p>
    <p style="margin-top:20px">5247年9月15日</p>
    <p style="margin-top:15px">有人在监视我们。我知道。</p>
    <p style="margin-top:10px">与萝说她最近总是做噩梦。梦见被关在白色的房间里。</p>
    <p style="margin-top:10px">我把兔子玩偶给了她。我说如果她害怕，就抱着它。</p>
    <p style="margin-top:10px">我在玩偶里缝了一张纸条。如果有一天我们都忘了...</p>
    <p style="margin-top:10px">纸条上写着坐标。我们的秘密基地。第一次见面的地方。</p>
    <p style="margin-top:20px;color:var(--warn);font-style:italic">我记得你的背影。我不记得你是谁，但我记得我想保护你。</p>
  </div>
  <div class="file-viewer" style="margin-top:15px">
    <div style="text-align:center;padding:10px">
      <div style="font-size:.75em;color:var(--text2)">兔子玩偶标签</div>
      <div style="font-size:1.2em;color:var(--moon);margin:10px 0;font-family:'Georgia',serif">
        N 22°34' E 114°06'
      </div>
      <div style="font-size:.65em;color:var(--text2)">缝线编号：#37</div>
    </div>
  </div>
  ${renderHintSystem('puzzle_2_4')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
  </div>`;
  addClue('伊尧日记：保护与萝的意志');
}

function renderP2S5(cp){
  const questions=[
    '你最近是否感到记忆模糊？',
    '你是否对某个狼族个体产生过特殊的情感反应？',
    '你是否记得5247年9月的某个夜晚？',
    '你是否曾经梦见过月光下的奔跑？',
    '你对"月光协议"这个词有什么反应？',
    '你是否觉得有人在监视你？',
    '你是否曾经无缘无故地流泪？',
    '如果告诉你，你的记忆是被人为修改的，你会？',
    '最后一个问题：你，还记得她吗？'
  ];
  
  let qHtml='';
  questions.forEach((q,i)=>{
    qHtml+=`<div class="psych-question">
      <div class="q-text">${i+1}. ${q}</div>
      <div class="psych-options">
        <label><input type="radio" name="q${i}" value="1"> 是</label>
        <label><input type="radio" name="q${i}" value="2"> 否</label>
        <label><input type="radio" name="q${i}" value="3"> 不确定</label>
      </div>
    </div>`;
  });
  
  cp.innerHTML=`
  <h3 class="section-title">🧠 心理评估问卷</h3>
  <div class="note-text">混居区标准心理评估。请如实作答。所有回答将被记录。</div>
  <div id="psychForm">${qHtml}</div>
  <div style="text-align:center;margin-top:15px">
    <button class="tool-btn" onclick="submitPsych()" style="padding:10px 30px;font-size:.9em">提交评估</button>
  </div>
  <div id="psychResult" style="margin-top:15px"></div>`;
}

function submitPsych(){
  const result=$('psychResult');
  result.innerHTML=`<div class="file-viewer" style="border-color:var(--danger)">
    <p class="danger-text" style="font-size:1.1em">评估完成。数据已收集。</p>
    <p style="font-size:.8em;color:var(--text2);margin-top:10px">
      备注：对象显示出残余记忆痕迹。建议加强监控。<br>
      建议措施：下次镇静剂量增加15%。
    </p>
    <p style="font-size:.7em;color:var(--danger);margin-top:10px">
      [这份问卷不是为了帮助你。它是为了监控你。]
    </p>
  </div>`;
  addAnomaly();
  triggerGlitch();
  playBeep(200,0.3);
  notify('评估结果：数据已被收集...','error');
  unlockPuzzle('2.5');
}

// ====== PHASE 3: 记忆碎片 ======
function renderPhase3(cp,scene){
  GS.scene=scene;
  const scenes=[renderP3S1,renderP3S2,renderP3S3,renderP3S4,renderP3S5];
  if(scenes[scene]) scenes[scene](cp);
}

function renderP3S1(cp){
  const moonPhases=['🌑','🌒','🌓','🌔','🌕','🌖','🌗'];
  const labels=['新月','蛾眉月','上弦月','盈凸月','满月','亏凸月','下弦月'];
  
  let galleryHtml='';
  const displayOrder=[4,1,6,2,0,5,3];
  
  displayOrder.forEach((phase,i)=>{
    galleryHtml+=`<div class="painting" id="painting_${i}" data-phase="${phase}" onclick="selectPainting(${i})">
      <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:2.5em">
        ${moonPhases[phase]}
      </div>
      <div class="painting-label">${labels[phase]}</div>
      <div style="position:absolute;top:3px;right:3px;font-size:.5em;color:var(--text2)">${String.fromCharCode(65+i)}</div>
    </div>`;
  });
  
  if(GS.puzzles['3.1_arranged']){
    galleryHtml='';
    displayOrder.forEach((phase,i)=>{
      galleryHtml+=`<div class="painting selected">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:2.5em">
          ${moonPhases[i]}
        </div>
        <div class="painting-label">${labels[i]}</div>
      </div>`;
    });
    cp.innerHTML=`
    <h3 class="section-title">🎨 与萝的画作（已排列）</h3>
    <div class="note-text success-text">画作已按月亮相位周期正确排列。</div>
    <div class="painting-gallery">${galleryHtml}</div>
    <div class="file-viewer" style="margin-top:15px">
      <p style="color:var(--warn)">画作角落的符号拼出：<strong>HELP ME REMEMBER</strong></p>
      <p style="font-size:.8em;color:var(--text2);margin-top:10px">与萝试图用画作传递信息。在被镇静之前，她一直在画月亮。每幅画的角落都有一个微小的字母。</p>
    </div>`;
  } else {
    cp.innerHTML=`
    <h3 class="section-title">🎨 与萝的画作</h3>
    <div class="note-text">7幅月亮画作。每幅画的角落都有微小的字母。按正确顺序排列后，角落字母拼出信息。</div>
    <div class="painting-gallery">${galleryHtml}</div>
    <div id="paintingOrder" style="margin-top:10px;font-size:.8em;color:var(--accent2)">
      已选择：<span id="selectedOrder"></span>
    </div>
    ${renderHintSystem('puzzle_3_1')}
    <div style="margin-top:10px">
      <button class="tool-btn" onclick="checkPaintingOrder()">验证排列</button>
    </div>`;
    window._paintingOrder=[];
  }
}

function selectPainting(idx){
  if(GS.puzzles['3.1_arranged']) return;
  const el=$('painting_'+idx);
  if(!el) return;
  
  const phase=parseInt(el.dataset.phase);
  if(window._paintingOrder.includes(idx)) return;
  
  window._paintingOrder.push(idx);
  el.classList.add('selected');
  
  const labels=['A','B','C','D','E','F','G'];
  const orderText=window._paintingOrder.map(i=>{
    const p=document.getElementById('painting_'+i);
    return p ? labels[parseInt(p.dataset.phase)] : '';
  }).join(' → ');
  $('selectedOrder').textContent=orderText;
  
  playBeep(500+window._paintingOrder.length*50,0.05);
}

function checkPaintingOrder(){
  if(window._paintingOrder.length!==7){
    notify('请选择全部7幅画','error');return;
  }
  const phases=window._paintingOrder.map(i=>parseInt(document.getElementById('painting_'+i)?.dataset.phase));
  const correct=phases.every((p,i)=>p===i);
  
  if(correct){
    GS.puzzles['3.1_arranged']=true;
    unlockPuzzle('3.1');
    addClue('画作信息：HELP ME REMEMBER');
  } else {
    notify('排列顺序不正确。想想月亮的自然变化规律...','error');
    window._paintingOrder=[];
    document.querySelectorAll('.painting').forEach(p=>p.classList.remove('selected'));
    $('selectedOrder').textContent='';
  }
}

function renderP3S2(cp){
  cp.innerHTML=`
  <h3 class="section-title">✏️ 伊尧的素描</h3>
  <div class="note-text">5张重叠的素描。点击切换查看。叠加后显示隐藏内容。</div>
  <div style="text-align:center;margin:15px 0">
    <div id="sketchArea" style="width:300px;height:400px;background:var(--panel2);border:1px solid var(--accent);margin:0 auto;position:relative;cursor:pointer" onclick="cycleSketch()">
      <div id="sketchContent" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column">
        <div style="font-size:3em;opacity:0.3">📝</div>
        <div style="font-size:.8em;color:var(--text2)">素描 1/5</div>
        <div style="font-size:.7em;color:var(--text2);margin-top:5px">模糊的线条</div>
      </div>
    </div>
    <div style="font-size:.75em;color:var(--text2);margin-top:10px">点击切换素描 | 当前：<span id="sketchNum">1</span>/5</div>
  </div>
  <div id="sketchReveal" style="display:none">
    <div class="file-viewer reveal-anim" style="text-align:center">
      <p style="color:var(--moon);font-family:'Georgia','SimSun',serif;font-size:1em;line-height:2">
        5张素描叠加后，显示出一个女孩的背影。<br>
        狼的耳朵。长长的尾巴。
      </p>
      <p style="color:var(--warn);margin-top:15px;font-family:'Georgia','SimSun',serif">
        "我记得你的背影。我不记得你是谁，但我记得我想保护你。"
      </p>
    </div>
    <div class="file-viewer" style="margin-top:10px">
      <div style="text-align:center">
        <div style="font-size:.7em;color:var(--text2)">纸张背面</div>
        <div style="font-size:1.5em;color:var(--accent2);margin:10px 0;font-family:monospace">B栋307室</div>
      </div>
    </div>
  </div>
  ${renderHintSystem('puzzle_3_2')}`;
  window._sketchIdx=0;
}

const sketchData=[
  {icon:'📝',desc:'模糊的线条',extra:'一些随意的曲线'},
  {icon:'✏️',desc:'阴影轮廓',extra:'像是某种建筑'},
  {icon:'🖊️',desc:'局部细节',extra:'一扇门'},
  {icon:'🖋️',desc:'更深的阴影',extra:'走廊的透视线'},
  {icon:'✒️',desc:'完整的轮廓',extra:'一个房间'},
];

function cycleSketch(){
  window._sketchIdx=(window._sketchIdx+1)%5;
  const s=sketchData[window._sketchIdx];
  $('sketchContent').innerHTML=`
    <div style="font-size:3em;opacity:${0.3+window._sketchIdx*0.15}">${s.icon}</div>
    <div style="font-size:.8em;color:var(--text2)">素描 ${window._sketchIdx+1}/5</div>
    <div style="font-size:.7em;color:var(--text2);margin-top:5px">${s.desc}</div>
  `;
  $('sketchNum').textContent=window._sketchIdx+1;
  playBeep(400+window._sketchIdx*50,0.05);
  
  if(window._sketchIdx===4){
    setTimeout(()=>{
      $('sketchReveal').style.display='block';
      addClue('房间号：B栋307室');
      notify('素描叠加揭示了隐藏信息','success');
    },500);
  }
}

function renderP3S3(cp){
  const ciphertext='QWMLP FIKSA ZRQJV RGEVB MWCEK ZMWPP';
  
  cp.innerHTML=`
  <h3 class="section-title">📡 加密通信记录</h3>
  <div class="note-text">截获的加密通信。使用Vigenère密码加密。</div>
  <div class="file-viewer">
    <div class="file-header"><span>截获通信 - 加密内容</span></div>
    <p style="font-size:1em;color:var(--warn);letter-spacing:2px">${ciphertext}</p>
    <p style="font-size:.75em;color:var(--text2);margin-top:10px">
      发送者代号：ALPHA | 接收者代号：BETA<br>
      加密方式：Vigenère
    </p>
  </div>
  <div class="vigenere-tool">
    <div style="font-size:.8em;color:var(--accent2);margin-bottom:10px">Vigenère 解密器</div>
    <textarea id="vigCipher" placeholder="输入密文...">${ciphertext}</textarea>
    <div style="margin:10px 0;display:flex;gap:10px;align-items:center">
      <label style="font-size:.8em;color:var(--text2)">密钥：</label>
      <input type="text" id="vigKey" placeholder="输入密钥" value="">
      <button onclick="vigenereDecrypt()">解密</button>
    </div>
    <div class="result" id="vigResult">等待解密...</div>
  </div>
  ${renderHintSystem('puzzle_3_3')}`;
}

function vigenereDecrypt(){
  const text=$('vigCipher').value.toUpperCase().replace(/[^A-Z]/g,'');
  const key=$('vigKey').value.toUpperCase().replace(/[^A-Z]/g,'');
  if(!key){notify('请输入密钥','error');return}
  
  let result='';
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i)-65;
    const k=key.charCodeAt(i%key.length)-65;
    result+=String.fromCharCode((c-k+26)%26+65);
  }
  
  $('vigResult').textContent=result;
  $('vigResult').style.color='var(--warn)';
  
  if(key==='WANINGMOON'){
    GS.puzzles['3.3_decrypted']=true;
    addClue('通信解密：ALPHA与BETA讨论新月计划');
    $('vigResult').innerHTML=result+'<br><br><span style="color:var(--danger)">解密成功！通信内容揭示了"新月计划"的细节：通过镇静剂消除跨物种情感依恋记忆。</span>';
    unlockPuzzle('3.3');
  } else {
    notify('密钥不正确。再想想游戏的核心主题...','error');
  }
}

function renderP3S4(cp){
  cp.innerHTML=`
  <h3 class="section-title">🎵 与萝的歌声</h3>
  <div class="note-text">与萝经常哼唱的一首歌。歌词似乎隐藏着什么秘密。</div>
  <div class="file-viewer">
    <div class="song-lyrics">
      月亮忘记了星星的名字<br>
      星星忘记了月亮的脸<br>
      风吹过第三个窗口<br>
      棉花下面藏着思念<br>
      缝线数了三十七遍<br>
      每一个结都是一个明天
    </div>
  </div>
  <div class="audio-vis">
    <canvas id="songCanvas" width="500" height="100"></canvas>
    <div class="audio-controls">
      <button onclick="playSong()">▶ 播放原曲</button>
      <button onclick="reverseSong()">⏪ 倒放</button>
    </div>
    <div id="songResult" style="display:none;margin-top:15px;padding:15px;background:rgba(0,0,0,0.3);border:1px solid var(--accent)">
      <div style="font-size:.8em;color:var(--accent2)">倒放分析结果：</div>
      <p style="color:var(--warn);margin-top:10px;font-size:.95em">
        "兔子玩偶里有东西。在棉花下面。第37号缝线。"
      </p>
      <p style="font-size:.75em;color:var(--text2);margin-top:10px">
        与萝在歌词中编码了信息。倒放后可以听到隐藏内容。
      </p>
    </div>
  </div>
  ${renderHintSystem('puzzle_3_4')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
    ${sceneNavBtn('next')}
  </div>`;
  drawSongVis();
}

function drawSongVis(){
  const c=$('songCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='#6b8fc7';ctx.lineWidth=1.5;ctx.beginPath();
  for(let x=0;x<c.width;x++){
    const y=c.height/2+Math.sin(x*0.08)*15*Math.cos(x*0.02)+Math.sin(x*0.15)*8;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function playSong(){
  playBeep(523,0.2);setTimeout(()=>playBeep(659,0.2),250);
  setTimeout(()=>playBeep(784,0.3),500);
  notify('播放中...','');
  drawSongVis();
}

function reverseSong(){
  playBeep(784,0.2);setTimeout(()=>playBeep(659,0.2),250);
  setTimeout(()=>playBeep(523,0.3),500);
  $('songResult').style.display='block';
  addClue('倒放歌词：棉花下第37号缝线');
  notify('发现隐藏信息','success');
}

function renderP3S5(cp){
  cp.innerHTML=`
  <h3 class="section-title">🎞️ 微缩胶片 - 实验对象名单</h3>
  <div class="note-text">从旧档案室找到的微缩胶片。完整的新月计划实验对象名单。</div>
  <div class="file-viewer reveal-anim">
    <div class="file-header"><span>新月计划 - 实验对象完整名单</span><span>密级：最高</span></div>
    <table class="data-table roster-table">
      <tr><th>组别</th><th>对象A</th><th>对象B</th><th>关系类型</th><th>状态</th><th>备注</th></tr>
      <tr class="group-1">
        <td>第1组</td><td>RB-5245-1225 (兔族)</td><td>WL-5246-0317 (狼族)</td>
        <td>跨物种依恋</td><td class="processing">处理中</td><td>记忆消除不完全</td>
      </tr>
      <tr>
        <td>第2组</td><td>DX-5240-0812 (鹿族)</td><td>LX-5241-0228 (狐族)</td>
        <td>跨物种依恋</td><td class="eliminated">已消除</td><td>5249年执行</td>
      </tr>
      <tr>
        <td>第3组</td><td>NM-5238-1103 (猫族)</td><td>QH-5239-0715 (犬族)</td>
        <td>跨物种依恋</td><td class="eliminated">已消除</td><td>5248年执行</td>
      </tr>
      <tr>
        <td>第4组</td><td>YK-5242-0421 (鸟族)</td><td>FT-5243-0908 (蛇族)</td>
        <td>跨物种依恋</td><td class="processing">处理中</td><td>预定5263年</td>
      </tr>
      <tr>
        <td>第5组</td><td colspan="2" class="damaged">[数据损毁]</td>
        <td class="damaged">---</td><td class="damaged">未知</td><td class="damaged">---</td>
      </tr>
      <tr>
        <td>第6组</td><td colspan="2" class="damaged">[数据损毁]</td>
        <td class="damaged">---</td><td class="damaged">未知</td><td class="damaged">---</td>
      </tr>
      <tr>
        <td>第7组</td><td colspan="2" class="damaged">[数据损毁]</td>
        <td class="damaged">---</td><td class="damaged">未知</td><td class="damaged">---</td>
      </tr>
    </table>
  </div>
  <div class="file-viewer" style="margin-top:15px">
    <div style="font-size:.8em;color:var(--text2);line-height:2">
      <p>分析摘要：</p>
      <p>• 共7组实验对象，均为跨物种情感依恋案例</p>
      <p>• 第2、3组已"消除"（实际为永久记忆销毁+物理隔离）</p>
      <p class="highlight-text">• 第1组（伊尧与与萝）是唯一记忆消除不完全的案例</p>
      <p>• 第4组计划于5263年执行</p>
      <p>• 第5-7组数据损毁——但伊尧的日记暗示：<span class="danger-text">还有更多组别没有被记录</span></p>
    </div>
  </div>
  <div class="note-text">名单揭示了新月计划的规模。第4组即将被"处理"。</div>
  <div style="text-align:center;margin-top:15px">
    <button class="tool-btn" onclick="enterPhase4()" style="padding:10px 30px;font-size:.9em;background:var(--danger);border-color:var(--danger)">
      ⚠ 进入第四阶段 - 新月计划
    </button>
  </div>`;
}

function enterPhase4(){
  GS.phasesUnlocked[3]=true;
  GS.phase=3;
  saveGame();
  window.location.href='phase3.html';
}

function start72Countdown(){
  let total=72*60;
  if(GS.countdown72) clearInterval(GS.countdown72);
  GS.countdown72=setInterval(()=>{
    total--;
    const h=Math.floor(total/3600);
    const m=Math.floor((total%3600)/60);
    const s=total%60;
    const el=document.querySelector('.countdown-72');
    if(el) el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if(total<=0){clearInterval(GS.countdown72)}
  },1000);
}

// ====== PHASE 4: 新月计划 ======
function renderPhase4(cp,scene){
  GS.scene=scene;
  const scenes=[renderP4S1,renderP4S2,renderP4S3,renderP4S4];
  if(scenes[scene]) scenes[scene](cp);
}

function renderP4S1(cp){
  cp.innerHTML=`
  <h3 class="section-title">💻 服务器入侵</h3>
  <div class="note-text">你需要入侵天空城服务器，获取新月计划的完整文件。</div>
  <div class="terminal" id="terminal">
    <div class="output" style="color:#4ade80">MIXED-DISTRICT TERMINAL v2.1</div>
    <div class="output">连接目标：天空城中央服务器</div>
    <div class="output">需要认证和密钥...</div>
    <div class="output" style="margin-top:10px">输入命令：</div>
    <div id="termOutput"></div>
    <div style="display:flex;align-items:center;margin-top:10px">
      <span class="prompt">$ </span>
      <input type="text" id="termInput" onkeydown="if(event.key==='Enter')terminalCmd()" autofocus>
    </div>
  </div>
  ${renderHintSystem('puzzle_4_1')}`;
  window._termStep=0;
  window._termCmds=['connect sky-city-server','auth WL-5246-0317 RB-5245-1225','decrypt --key 524-3171225','find new-moon-protocol','download all'];
  setTimeout(()=>$('termInput')?.focus(),100);
}

function terminalCmd(){
  const input=$('termInput');
  const cmd=input.value.trim().toLowerCase();
  input.value='';
  if(!cmd) return;
  
  const output=$('termOutput');
  const expected=window._termCmds[window._termStep];
  
  output.innerHTML+=`<div><span class="prompt">$ </span><span class="cmd-line">${cmd}</span></div>`;
  
  if(cmd===expected){
    window._termStep++;
    playBeep(880,0.05);
    
    const responses=[
      '<div class="success">正在连接... 连接成功。延迟：47ms</div>',
      '<div class="success">身份验证通过。访问级别：S</div>',
      '<div class="success">解密完成。文件可访问。</div><div class="output">找到文件：new-moon-protocol/complete-records/</div>',
      '<div class="output">文件列表：</div><div class="output" style="margin-left:10px">├── experiment-log.dat<br>├── subject-list.dat<br>├── protocol-v7.pdf<br>├── memory-erase-procedure.doc<br>└── yi-yao-personal.dat</div>',
      '<div class="success">下载完成。所有文件已保存到本地。</div><div style="color:var(--warn)">⚠ 警告：入侵行为已被记录。你还有有限的时间。</div>'
    ];
    output.innerHTML+=responses[window._termStep-1];
    
    if(window._termStep>=5){
      GS.puzzles['4.1_done']=true;
      unlockPuzzle('4.1');
      addClue('服务器入侵成功：新月计划完整文件');
    }
  } else {
    const stepHints = [
      '连接命令格式不对。想想怎么连接到服务器...',
      '认证需要正确的编号格式...',
      '解密命令需要密钥...',
      '试试搜索或查找文件...',
      '试试下载命令...'
    ];
    output.innerHTML+=`<div class="error">命令错误。${stepHints[window._termStep] || '请重试。'}</div>`;
    playBeep(200,0.15);
  }
  
  const term=$('terminal');
  if(term) term.scrollTop=term.scrollHeight;
}

function renderP4S2(cp){
  cp.innerHTML=`
  <h3 class="section-title">📧 父亲的信</h3>
  <div class="note-text">在伊尧的个人物品中发现的一封信。来自他的父亲。写于5247年9月16日。</div>
  <div class="file-viewer reveal-anim">
    <div class="file-header"><span>私人信件 - 未编号</span></div>
    <div class="acrostic-poem">
      <p><span class="first-char">永</span>远的月光下，我写信给你</p>
      <p><span class="first-char">远</span>方的你是否能看到同一片天</p>
      <p><span class="first-char">会</span>有一天，所有的秘密都将揭晓</p>
      <p><span class="first-char">保</span>护好自己，我的孩子</p>
      <p><span class="first-char">护</span>卫你的不只是我，还有月光</p>
      <p><span class="first-char">她</span>是你生命中最重要的存在</p>
    </div>
  </div>
  ${renderHintSystem('puzzle_4_2')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
    ${sceneNavBtn('next')}
  </div>`;
  addClue('父亲的信');
}

function renderP4S3(cp){
  cp.innerHTML=`
  <h3 class="section-title">📻 频率共振</h3>
  <div class="note-text">三个音频轨道。调整频率到正确位置，白噪音中将浮现伊尧的声音。</div>
  <div class="audio-vis">
    <canvas id="freqCanvas" width="500" height="150"></canvas>
    <div class="freq-display" id="freqDisplay">0.00 Hz</div>
    <div class="freq-slider">
      <input type="range" min="0" max="1000" value="0" id="freqSlider" oninput="adjustFreq(this.value)">
    </div>
    <div style="font-size:.75em;color:var(--text2)">范围：0 - 1000 Hz | 正确频率隐藏在某个位置</div>
  </div>
  <div id="freqResult" style="display:none;margin-top:15px">
    <div class="file-viewer reveal-anim">
      <p style="color:var(--moon);font-size:1em;font-family:'Georgia','SimSun',serif;text-align:center;line-height:2">
        "与萝...我的心跳记得...<br>
        每一次心跳都在说你的名字。<br>
        我不记得你的名字。<br>
        但我记得...我的心跳。"
      </p>
    </div>
  </div>
  ${renderHintSystem('puzzle_4_3')}
  <div style="text-align:right;margin-top:10px">
    <button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>
    ${sceneNavBtn('next')}
  </div>`;
  drawFreqVis(0);
}

function adjustFreq(val){
  const freq=val*1.0;
  $('freqDisplay').textContent=freq.toFixed(2)+' Hz';
  drawFreqVis(val);
  
  if(Math.abs(val-404)<5){
    $('freqResult').style.display='block';
    if(!GS.puzzles['4.3_found']){
      GS.puzzles['4.3_found']=true;
      addClue('伊尧的心跳：每一次都在说与萝的名字');
      unlockPuzzle('4.3');
    }
  } else if(Math.abs(val-404)<30){
    $('freqDisplay').style.color='var(--warn)';
    $('freqDisplay').textContent=freq.toFixed(2)+' Hz - 信号增强中...';
  } else {
    $('freqDisplay').style.color='var(--accent2)';
  }
}

function drawFreqVis(val){
  const c=$('freqCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,c.width,c.height);
  
  ctx.strokeStyle='rgba(74,111,165,0.2)';ctx.lineWidth=1;ctx.beginPath();
  for(let x=0;x<c.width;x++){
    const y=c.height/2+(Math.random()-0.5)*60;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  
  const signalStrength=1-Math.min(Math.abs(val-404)/100,1);
  ctx.strokeStyle=`rgba(107,143,199,${0.3+signalStrength*0.7})`;
  ctx.lineWidth=2;ctx.beginPath();
  for(let x=0;x<c.width;x++){
    const y=c.height/2+Math.sin(x*0.05+val*0.01)*30*signalStrength+(Math.random()-0.5)*20*(1-signalStrength);
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  
  if(signalStrength>0.9){
    ctx.fillStyle='rgba(212,228,247,0.5)';
    ctx.font='16px Georgia';ctx.textAlign='center';
    ctx.fillText('信号锁定',c.width/2,30);
  }
}

function renderP4S4(cp){
  cp.innerHTML=`
  <h3 class="section-title">🗳️ 最终选择</h3>
  <div class="note-text">你掌握了所有信息。现在，做出你的选择。</div>
  
  <div class="countdown countdown-72" style="font-size:1.5em">72:00:00</div>
  <div style="text-align:center;font-size:.75em;color:var(--text2)">距离第4组执行还有</div>
  
  <div class="vote-section">
    <p style="color:var(--text);margin-bottom:20px;font-size:.9em">
      你手中握有新月计划的所有证据。<br>
      第4组实验对象将在72小时内被"处理"。<br>
      你必须做出选择。
    </p>
    
    <button class="vote-option" onclick="selectVote('A')">
      <strong>月出</strong> - 公开真相<br>
      <span style="font-size:.75em;color:var(--text2)">将一切公之于众，让世界知道月光协议的真相</span>
    </button>
    <button class="vote-option" onclick="selectVote('B')">
      <strong>月落</strong> - 保持沉默<br>
      <span style="font-size:.75em;color:var(--text2)">销毁证据，让一切回归"正常"</span>
    </button>
    <button class="vote-option" onclick="selectVote('C')">
      <strong>???</strong> - 未知选项<br>
      <span style="font-size:.75em;color:var(--text2)">也许还有第三种选择...</span>
    </button>
  </div>
  
  <div class="puzzle-bar" style="position:relative;background:transparent;border:none;padding:10px 0">
    <div style="width:100%">
      <div class="small-text" style="text-align:center;margin-bottom:5px">
        如果月光可以说话，它会说什么？
      </div>
      <div style="display:flex;gap:10px">
        <input type="text" id="finalInput" placeholder="..." style="flex:1">
        <button onclick="finalSubmit()">确认选择</button>
      </div>
    </div>
  </div>`;
  
  window._selectedVote=null;
}

function selectVote(v){
  window._selectedVote=v;
  document.querySelectorAll('.vote-option').forEach(b=>b.classList.remove('selected'));
  event.target.closest('.vote-option').classList.add('selected');
  playBeep(660,0.1);
}

function finalSubmit(){
  const v=($('finalInput')?.value||'').trim().toLowerCase();
  
  if(v==='moonlight'){
    GS.puzzles['4.4']=true;
    document.querySelectorAll('.screen,.ending-screen').forEach(s=>s.classList.remove('active'));
    const ec=$('endingC');if(ec)ec.classList.add('active');
    addClue('结局C：月光不灭');
    saveGame();
    return;
  }
  
  if(window._selectedVote==='A'||v==='月出'||v==='a'){
    document.querySelectorAll('.screen,.ending-screen').forEach(s=>s.classList.remove('active'));
    const ea=$('endingA');if(ea)ea.classList.add('active');
    addClue('结局A：月出');
    saveGame();
  } else if(window._selectedVote==='B'||v==='月落'||v==='b'){
    document.querySelectorAll('.screen,.ending-screen').forEach(s=>s.classList.remove('active'));
    const eb=$('endingB');if(eb)eb.classList.add('active');
    addClue('结局B：月落');
    saveGame();
  } else {
    notify('选择一个选项，或输入隐藏答案...','error');
  }
}

function handleEndingChoice(v){
  finalSubmit();
}

// ====== PHASE 5: ENDING ======
function renderEnding(cp,scene){
  renderPhase4(cp, 3);
}

// ====== WARNING OVERLAY ======
function triggerWarningOverlay(){
  GS.warningTriggered=true;
  const overlay=$('warningOverlay');
  overlay.classList.add('active');
  let count=24;
  $('warningCountdown').textContent=count;
  addAnomaly();
  triggerGlitch();
  
  const timer=setInterval(()=>{
    count--;
    $('warningCountdown').textContent=count;
    if(count%5===0) triggerGlitch();
    if(count<=0){
      clearInterval(timer);
      overlay.classList.remove('active');
      setTimeout(()=>{
        const hint=document.createElement('div');
        hint.style.cssText='font-size:.7em;color:var(--text2);text-align:center;margin-top:10px';
        hint.textContent='核验完成。继续观察。';
        const cp=$('contentPanel');
        if(cp) cp.appendChild(hint);
        addClue('系统已标记你的访问');
        notify('核验完成。继续观察。','');
      },500);
    }
  },1000);
}

// ====== GAME CLOCK ======
function startGameClock(){
  let h=3,m=17,s=0;
  setInterval(()=>{
    s++;
    if(s>=60){s=0;m++}
    if(m>=60){m=0;h++}
    if(h>=24) h=0;
    const el=$('gameTime');
    if(el) el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },1000);
}

// ====== RANDOM EFFECTS + HORROR SYSTEM ======
function startRandomEffects(){
  // --- Base glitch (always active) ---
  setInterval(()=>{
    if(Math.random()>0.92) triggerGlitch();
  },3000);
  
  // --- System status flicker ---
  setInterval(()=>{
    if(Math.random()>0.95){
      const warn=$('sysWarn');
      if(warn){
        const orig=warn.textContent;
        const msgs=['系统状态：异常波动','系统状态：检测到外部访问','系统状态：信号不稳定','⚠ ALERT ⚠','系统状态：正常运行'];
        warn.textContent=msgs[Math.floor(Math.random()*msgs.length)];
        warn.style.color=Math.random()>0.5?'var(--danger)':'var(--warn)';
        setTimeout(()=>{warn.textContent=orig;warn.style.color=''},2000);
      }
    }
  },8000);

  // ====== PHASE-ESCALATING HORROR ======
  
  // --- Ghost text (phase 0+) ---
  setInterval(()=>{
    const intensity = [0.92, 0.88, 0.82, 0.75, 0.7][GS.phase] || 0.85;
    if(Math.random() > intensity) return;
    const msgs = [
      ['你还记得吗','她还在等','月光下','不要忘记','有人在看着','第三中学','5247年9月'],
      ['你的记忆是真的吗','镇静剂起效了','他们听到了','编号RB-5245','编号WL-5246','跨物种依恋','矫正程序启动'],
      ['我记得你的背影','心跳记得','棉花下面','第37号缝线','月光协议','别让他们找到你','记忆消除中...'],
      ['新月计划启动','第4组目标确认','72小时','天空城监控中','所有证据将被清除','你已被标记','无处可逃'],
      ['月光不灭','协议永存','你记得吗','你选择什么','时间到了']
    ];
    const pool = msgs[GS.phase] || msgs[0];
    const msg = pool[Math.floor(Math.random()*pool.length)];
    const div = document.createElement('div');
    div.className = 'ghost-text';
    div.textContent = msg;
    div.style.left = (5+Math.random()*85)+'%';
    div.style.top = (10+Math.random()*70)+'%';
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 4500);
  }, 6000);

  // --- Whisper text (phase 1+) ---
  setInterval(()=>{
    if(GS.phase < 1) return;
    if(Math.random() > 0.85) return;
    const whispers = [
      'R E M E M B E R',
      'S H E   I S   W A I T I N G',
      'T H E   M O O N   S E E S',
      'Y O U   A R E   B E I N G   W A T C H E D',
      'M E M O R Y   E R A S U R E   I N   P R O G R E S S',
      'D O   N O T   F O R G E T',
      'T H E   S E D A T I V E   I S   W O R K I N G',
      'P R O T O C O L   A C T I V E',
      'S U B J E C T   D E T E C T E D',
    ];
    const msg = whispers[Math.floor(Math.random()*whispers.length)];
    const div = document.createElement('div');
    div.className = 'whisper-text';
    div.textContent = msg;
    div.style.left = (10+Math.random()*60)+'%';
    div.style.bottom = '5%';
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 8500);
  }, 10000);

  // --- Eye watching (phase 1+) ---
  setInterval(()=>{
    if(GS.phase < 1) return;
    if(Math.random() > 0.88) return;
    const eye = $('eyeWatch');
    if(!eye) return;
    eye.style.left = (5+Math.random()*85)+'%';
    eye.style.top = (5+Math.random()*85)+'%';
    eye.classList.add('active');
    const dur = 1500 + Math.random()*2000;
    setTimeout(()=>eye.classList.remove('active'), dur);
    addAnomaly();
  }, 8000);

  // --- Shadow figure (phase 2+) ---
  setInterval(()=>{
    if(GS.phase < 2) return;
    if(Math.random() > 0.85) return;
    const shadow = $('shadowFigure');
    if(!shadow) return;
    const side = Math.random() > 0.5;
    shadow.style.left = side ? '-20px' : 'auto';
    shadow.style.right = side ? 'auto' : '-20px';
    shadow.style.top = (20+Math.random()*40)+'%';
    shadow.classList.add('active');
    setTimeout(()=>shadow.classList.remove('active'), 800+Math.random()*1200);
    if(Math.random()>0.6) addAnomaly();
  }, 12000);

  // --- Horror flash (phase 2+) ---
  setInterval(()=>{
    if(GS.phase < 2) return;
    if(Math.random() > 0.9) return;
    const flash = $('horrorFlash');
    const txt = $('horrorText');
    if(!flash || !txt) return;
    const msgs = [
      '你被发现了', '别看了', '它在看着你', '快跑',
      '记忆消除中', '已检测到异常', '你不在安全区域',
      '镇静剂注入', '协议执行中', '第37号', '她在哪里',
      '你已经忘了', '别回头', '来不及了'
    ];
    txt.textContent = msgs[Math.floor(Math.random()*msgs.length)];
    flash.classList.add('active');
    document.body.classList.add('screen-shake');
    playBeep(150, 0.15);
    setTimeout(()=>{
      flash.classList.remove('active');
      document.body.classList.remove('screen-shake');
    }, 200+Math.random()*150);
  }, 15000);

  // --- Fake intrusion alert (phase 2+) ---
  setInterval(()=>{
    if(GS.phase < 2) return;
    if(Math.random() > 0.92) return;
    const alert = $('intrusionAlert');
    const title = $('intrusionTitle');
    const detail = $('intrusionDetail');
    if(!alert || !title || !detail) return;
    const titles = [
      '⚠ 未授权访问检测 ⚠',
      '⚠ 安全等级提升 ⚠',
      '⚠ 异常行为标记 ⚠',
      '⚠ 矫正程序预警 ⚠',
      '⚠ 数据泄露警报 ⚠'
    ];
    const details = [
      '访问者ID已被记录。安全小组已通知。<br>请在当前位置等待核查。',
      '检测到异常数据访问模式。<br>你的行为已被标记为"潜在风险"。<br>镇静剂储备已检查。',
      '跨物种情感依恋指标异常。<br>建议立即接受心理评估。<br>不要试图逃跑。',
      '外部访问痕迹 detected。<br>月光协议安全等级提升至S+。<br>所有相关档案正在转移。',
      '你的查询频率超出正常范围。<br>系统正在分析你的行为模式。<br>请保持冷静。'
    ];
    title.textContent = titles[Math.floor(Math.random()*titles.length)];
    detail.innerHTML = details[Math.floor(Math.random()*details.length)];
    alert.classList.add('active');
    playBeep(200, 0.3);
    addAnomaly();
    const dur = 2000 + Math.random()*1500;
    setTimeout(()=>{
      alert.classList.remove('active');
    }, dur);
  }, 20000);

  // --- Memory flashback (phase 3+) ---
  setInterval(()=>{
    if(GS.phase < 3) return;
    if(Math.random() > 0.88) return;
    const flash = $('memoryFlash');
    const txt = $('memoryText');
    if(!flash || !txt) return;
    const memories = [
      '月亮出来了<br>与萝画了一幅画<br>兔子和狼并肩坐着',
      '我记得你的背影<br>我不记得你是谁<br>但我想保护你',
      '心跳记得<br>玩偶记得<br>月光记得',
      '棉花下面<br>第37号缝线<br>有一张纸条',
      '她的眼睛从琥珀色变成了血红色<br>她咬了我<br>然后我...',
      '镇静剂针管<br>刺入了我自己的脖子<br>WL目睹',
      '你不记得她是谁<br>但你的眼眶湿了',
      '有些东西是镇静剂杀不死的'
    ];
    txt.innerHTML = memories[Math.floor(Math.random()*memories.length)];
    flash.classList.add('active');
    playBeep(330, 0.5);
    setTimeout(()=>playBeep(220, 0.3), 300);
    setTimeout(()=>flash.classList.remove('active'), 3000);
  }, 18000);

  // --- Blood vignette pulse (phase 2+, intensifies) ---
  setInterval(()=>{
    if(GS.phase < 2) return;
    const vig = $('bloodVignette');
    if(!vig) return;
    vig.classList.add('active');
    const dur = 3000 + Math.random()*4000;
    setTimeout(()=>vig.classList.remove('active'), dur);
  }, 25000);

  // --- Corruption overlay burst (phase 3+) ---
  setInterval(()=>{
    if(GS.phase < 3) return;
    if(Math.random() > 0.85) return;
    const overlay = $('corruptionOverlay');
    if(!overlay) return;
    overlay.classList.add('active');
    document.body.classList.add('screen-shake');
    setTimeout(()=>{
      overlay.classList.remove('active');
      document.body.classList.remove('screen-shake');
    }, 300+Math.random()*400);
  }, 14000);

  // --- Static noise burst (phase 1+) ---
  setInterval(()=>{
    if(GS.phase < 1) return;
    if(Math.random() > 0.88) return;
    const noise = $('staticNoise');
    if(!noise) return;
    noise.classList.add('active');
    const dur = 200 + Math.random()*300;
    setTimeout(()=>noise.classList.remove('active'), dur);
  }, 11000);

  // --- Data leak (phase 2+) ---
  setInterval(()=>{
    if(GS.phase < 2) return;
    if(Math.random() > 0.87) return;
    const fragments = [
      'SUBJ_RB: memory_erase_status=INCOMPLETE\nSUBJ_WL: emotional_residue=DETECTED\nNOTE: increase sedative dose +15%',
      'PROTOCOL_WANING_MOON v7.2\nSTATUS: ACTIVE\nSUBJECTS_REMAINING: 4\nTIME_TO_EXECUTION: 71:42:17',
      'LOG_5247.09.16_22:15\nEVENT: RB_SELF_INJECTION\nWITNESS: WL\nRESPONSE: UNCONTAINED_HOWLING',
      'CLASSIFIED//NEED_TO_KNOW\nPROJECT: NEW_MOON\nGROUPS: 7\nELIMINATED: 2\nPROCESSING: 2\nPLANNED: 3',
      'ERR_NULL_CITIZEN detected\nACCESS_LEVEL: OVERRIDE\nWARNING: This access pattern\nmatches Subject RB-5245'
    ];
    const div = document.createElement('div');
    div.className = 'data-leak';
    div.textContent = fragments[Math.floor(Math.random()*fragments.length)];
    div.style.left = (5+Math.random()*70)+'%';
    div.style.top = (20+Math.random()*50)+'%';
    div.style.maxWidth = '250px';
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 5500);
  }, 13000);

  // --- Page text corruption (phase 3+) ---
  setInterval(()=>{
    if(GS.phase < 3) return;
    if(Math.random() > 0.9) return;
    const allText = document.querySelectorAll('.content-panel p, .content-panel td, .content-panel div');
    if(allText.length === 0) return;
    const target = allText[Math.floor(Math.random()*allText.length)];
    if(!target || !target.textContent || target.textContent.length < 3) return;
    const orig = target.textContent;
    const corruptChars = '█▓░▒╳╱╲▲▼◆◇●○';
    let corrupted = '';
    for(let i=0;i<orig.length;i++){
      if(Math.random()>0.7 && orig[i]!==' '){
        corrupted += corruptChars[Math.floor(Math.random()*corruptChars.length)];
      } else {
        corrupted += orig[i];
      }
    }
    target.textContent = corrupted;
    target.style.color = 'var(--danger)';
    setTimeout(()=>{
      target.textContent = orig;
      target.style.color = '';
    }, 400+Math.random()*300);
  }, 9000);

  // --- Idle horror (when user hasn't interacted for a while) ---
  let lastInteraction = Date.now();
  document.addEventListener('mousemove', ()=>{lastInteraction=Date.now()});
  document.addEventListener('keydown', ()=>{lastInteraction=Date.now()});
  document.addEventListener('click', ()=>{lastInteraction=Date.now()});
  
  setInterval(()=>{
    const idle = Date.now() - lastInteraction;
    if(idle < 15000) return; // 15 seconds idle
    if(Math.random() > 0.7) return;
    const idleMsgs = [
      '你还在吗？',
      '它在等你回头',
      '时间不多了',
      '你听到了吗',
      '别停下来',
      '她还在等你',
      '月光快要消失了'
    ];
    const msg = idleMsgs[Math.floor(Math.random()*idleMsgs.length)];
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      color:rgba(192,57,43,0.5);font-size:1.5em;font-family:'Georgia',serif;
      z-index:9700;pointer-events:none;text-align:center;
      text-shadow:0 0 20px rgba(192,57,43,0.3);
      animation:ghostFade 3s ease-in-out forwards`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 3500);
  }, 8000);

  // --- Ambient heartbeat sound (phase 3+) ---
  setInterval(()=>{
    if(GS.phase < 3) return;
    if(!GS.audioCtx) return;
    if(Math.random() > 0.8) return;
    // Simulate heartbeat with two low thumps
    playBeep(60, 0.08);
    setTimeout(()=>playBeep(55, 0.06), 150);
  }, 5000);

  // --- Original eye cursor (phase 1+) ---
  setInterval(()=>{
    if(GS.phase>=1 && Math.random()>0.9){
      const eye=$('eyeCursor');
      if(eye){
        eye.style.left=(Math.random()*80+10)+'%';
        eye.style.top=(Math.random()*80+10)+'%';
        eye.classList.add('visible');
        setTimeout(()=>eye.classList.remove('visible'),800);
      }
    }
  },5000);

  // --- Original flicker (always) ---
  setInterval(()=>{
    if(Math.random()>0.97){
      document.body.style.opacity='0';
      setTimeout(()=>{document.body.style.opacity='1'},100);
    }
  },15000);

  // --- Phase-specific creepy messages ---
  setInterval(()=>{
    if(GS.phase>=2 && Math.random()>0.93){
      const msgs=['它在看着你','你确定你还在控制中吗？','别回头','记忆是假的','月光下没有影子','你的编号不存在','镇静剂对你无效','她画了最后一幅画','第37号缝线松了'];
      const msg=msgs[Math.floor(Math.random()*msgs.length)];
      const div=document.createElement('div');
      div.style.cssText='position:fixed;bottom:10%;left:'+(20+Math.random()*60)+'%;color:rgba(192,57,43,0.4);font-size:.8em;z-index:9000;pointer-events:none;transition:opacity 2s';
      div.textContent=msg;
      document.body.appendChild(div);
      setTimeout(()=>{div.style.opacity='0';setTimeout(()=>div.remove(),2000)},1500);
    }
  },12000);
}

// ====== SCENE NAVIGATION ======
function sceneNavBtn(direction){
  if(direction==='prev') return `<button class="tool-btn" onclick="prevScene()">◀ 上一场景</button>`;
  // Check if current puzzle is solved
  const puzzleKey=(GS.phase+1)+'.'+(GS.scene+1);
  const specialUnlock={
    '1.2':()=>GS.puzzles['1.2_a']&&GS.puzzles['1.2_b']&&GS.puzzles['1.2_c'],
    '2.2':()=>GS.puzzles['2.2_sorted'],
    '3.1':()=>GS.puzzles['3.1_arranged'],
    '3.3':()=>GS.puzzles['3.3_decrypted'],
    '4.1':()=>GS.puzzles['4.1_done'],
    '4.3':()=>GS.puzzles['4.3_found'],
  };
  const solved = GS.puzzles[puzzleKey] || (specialUnlock[puzzleKey]&&specialUnlock[puzzleKey]());
  if(solved){
    return `<button class="tool-btn" onclick="nextScene()">下一场景 ▶</button>`;
  }else{
    return `<button class="tool-btn" style="opacity:0.4;cursor:not-allowed" disabled title="解开当前谜题后解锁">🔒 下一场景</button>`;
  }
}
function nextScene(){
  const maxScenes=[3,4,4,3];
  // Check if current puzzle is solved before allowing next scene
  const puzzleKey=(GS.phase+1)+'.'+(GS.scene+1);
  const specialUnlock={
    '1.2':()=>GS.puzzles['1.2_a']&&GS.puzzles['1.2_b']&&GS.puzzles['1.2_c'],
    '2.2':()=>GS.puzzles['2.2_sorted'],
    '3.1':()=>GS.puzzles['3.1_arranged'],
    '3.3':()=>GS.puzzles['3.3_decrypted'],
    '4.1':()=>GS.puzzles['4.1_done'],
    '4.3':()=>GS.puzzles['4.3_found'],
  };
  const solved = GS.puzzles[puzzleKey] || (specialUnlock[puzzleKey]&&specialUnlock[puzzleKey]());
  if(!solved){
    notify('请先解开当前谜题再前进','error');
    playBeep(200,0.15);
    return;
  }
  if(GS.scene<maxScenes[GS.phase]){
    GS.scene++;
    renderPhase(GS.phase,GS.scene);
    saveGame();
  }
}
function prevScene(){
  if(GS.scene>0){
    GS.scene--;
    renderPhase(GS.phase,GS.scene);
    saveGame();
  }
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded',()=>{
  const page = getCurrentPage();
  
  const bar=$('puzzleBar');
  if(bar){
    const nav=document.createElement('div');
    nav.style.cssText='display:flex;gap:5px;margin-left:10px';
    nav.innerHTML=`
      <button onclick="prevScene()" style="background:var(--panel2);color:var(--text);border:1px solid var(--accent);padding:8px 12px;cursor:pointer;font-family:inherit;font-size:.8em">◀</button>
      <button onclick="nextScene()" style="background:var(--panel2);color:var(--text);border:1px solid var(--accent);padding:8px 12px;cursor:pointer;font-family:inherit;font-size:.8em">▶</button>
    `;
    bar.appendChild(nav);
  }
  
  if(page === 'index'){
    return;
  }
  
  initGame();
  
  if(page === 'phase3'){
    const saved = localStorage.getItem('waningmoon_save');
    if(saved){
      try {
        const s = JSON.parse(saved);
        if(s.phase === 3) start72Countdown();
      } catch(e){}
    }
  }
});