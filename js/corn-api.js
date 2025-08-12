/* js/corn-api.js
   - 고정 서버: Render 배포 API ↔ Mongo
   - 카카오 로그인(localStorage kakaoId/nickname) 확인 → /api/userdata 로 자원 로드
   - 배경/미니 이미지: 항상 'img/파일명', 모바일은 'a_' 우선 시도(실패 시 기본)
   - 액션: 씨앗 심기, 물/거름 사용, 수확(등급), 뻥튀기(소금1+설탕1+30토큰), 팝콘↔거름 1:1 교환
*/

(function(){
  'use strict';

  /* ===== 환경 ===== */
  const BASE_API = 'https://orcax-survey-3060.onrender.com';
  const $ = id => document.getElementById(id);
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  /* ===== 상태 ===== */
  const S = Object.assign({
    online:false,
    // 성장/레벨
    g:0, phase:'IDLE', level:1, exp:0,
    // 인벤토리
    water:0, fertilizer:0, corn:0, popcorn:0, salt:0, sugar:0, orcx:0,
    // 등급 보유 통계(선택)
    gradeInv:{A:0,B:0,C:0,D:0,E:0,F:0}
  }, safeParse(localStorage.getItem('corn_state')) || {});

  function save(){ try{ localStorage.setItem('corn_state', JSON.stringify(S)); }catch(e){} }
  function safeParse(j){ try{ return JSON.parse(j); }catch(e){ return null; } }

  /* ===== DOM ===== */
  const dom = {
    bg: $('bg'),
    netDot: $('netDot'), netTxt: $('netTxt'), diag: $('diag'),
    r:{ water:$('r-water'), fert:$('r-fert'), corn:$('r-corn'), pop:$('r-pop'), salt:$('r-salt'), sugar:$('r-sugar'), orcx:$('r-orcx') },
    levelIcon:$('levelIcon'), levelIconMini:$('levelIconMini'), levelText:$('levelText'), expBar:$('expBar'), expText:$('expText'),
    miniImg:$('miniImg'), miniCap:$('miniCap'),
    btnPlant:$('btn-plant'), btnWater:$('btn-water'), btnFert:$('btn-fert'), btnHarv:$('btn-harv'), btnPop:$('btn-pop'), btnEx:$('btn-ex'),
    toast: $('toast')
  };
  function toast(msg){ dom.toast.textContent = msg; dom.toast.classList.add('show'); setTimeout(()=>dom.toast.classList.remove('show'), 1400); }

  /* ===== 로그인 확인 ===== */
  const kakaoId  = localStorage.getItem('kakaoId');
  const nickname = localStorage.getItem('nickname') || localStorage.getItem('kakaoNickname');

  function needLogin(){
    if(!kakaoId || !nickname){
      dom.netDot.classList.remove('ok'); dom.netTxt.textContent='로그인 필요';
      toast('로그인이 필요합니다. (메인/감자농장에서 로그인)');
      return true;
    }
    return false;
  }

  /* ===== API 공통 ===== */
  async function j(path, body={}, method='POST'){
    const url = `${BASE_API}${path}`;
    dom.diag.textContent = `${method} ${url}`;
    const r = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: method==='GET'? undefined : JSON.stringify(body),
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    const d = await r.json().catch(()=> ({}));
    if(!r.ok) throw d;
    return d;
  }

  /* ===== 유저/인벤토리 로드 ===== */
  async function loadUser(){
    if(needLogin()) return;
    try{
      const data = await j('/api/userdata', { kakaoId });            // ← 서버는 /api/userdata 에서 전체 자원 리턴
      const u = data?.user || data?.data?.user || {};

      S.online = true; dom.netDot.classList.add('ok'); dom.netTxt.textContent='온라인';

      // 자원
      S.orcx = (u.wallet?.orcx ?? u.orcx ?? S.orcx) | 0;
      S.water = (u.inventory?.water ?? S.water) | 0;
      S.fertilizer = (u.inventory?.fertilizer ?? S.fertilizer) | 0;
      S.corn = (u.agri?.corn ?? S.corn) | 0;
      S.popcorn = (u.food?.popcorn ?? S.popcorn) | 0;
      S.salt = (u.additives?.salt ?? S.salt) | 0;
      S.sugar = (u.additives?.sugar ?? S.sugar) | 0;

      // 성장/레벨(옵션)
      S.phase = (u.agri?.phase || S.phase || 'IDLE');
      S.g     = Number.isFinite(u.agri?.g) ? u.agri.g : (S.g||0);
      S.level = Math.max(1, Number(u.level ?? u.profile?.level ?? S.level || 1));
      S.exp   = Math.max(0, Number(u.profile?.exp ?? S.exp || 0));

      // 등급 보유
      if(u.agri?.gradeInv) S.gradeInv = Object.assign({A:0,B:0,C:0,D:0,E:0,F:0}, u.agri.gradeInv);

      renderAll(); save();
    }catch(err){
      dom.netDot.classList.remove('ok'); dom.netTxt.textContent='오프라인/연결 실패';
      renderAll();
    }
  }

  /* ===== 액션 ===== */
  async function plant(){
    if(needLogin()) return;
    try{
      await j('/api/corn/plant', { kakaoId });
      S.phase='GROW'; S.g=0; gainExp(8);
      await loadUser();
      toast('씨앗 심기 완료');
    }catch(e){
      S.phase='GROW'; S.g=0; gainExp(8); renderAll(); save();
      toast('씨앗 심기(로컬)');
    }
  }
  async function useRes(kind){ // 'water' | 'fertilizer'
    if(needLogin()) return;
    const type = (kind==='water'?'water':'fertilizer');
    if(S[type]<=0){ toast((type==='water'?'물':'거름')+'이 부족합니다'); return; }
    try{
      await j('/api/user/inventory/use', { kakaoId, type, amount:1 });
      gainGrowth(5); gainExp(3);
      await loadUser();
      toast((type==='water'?'물':'거름')+' -1');
    }catch(e){
      S[type]--; gainGrowth(5); gainExp(3); renderAll(); save();
      toast('임시 차감(오프라인)');
    }
  }
  function gradeFromStreak(streak){
    if(streak>=5) return 'A';
    if(streak===4) return 'B';
    if(streak===3) return 'C';
    if(streak===2) return 'D';
    if(streak===1) return 'E';
    return 'F';
  }
  async function harvest(){
    if(needLogin()) return;
    if(!(S.phase==='GROW' && S.g>=100)){ toast('아직 수확 단계가 아닙니다'); return; }
    const streak = (S.workStreak|0)+1; S.workStreak = streak;
    const grade = gradeFromStreak(streak);
    try{
      await j('/api/corn/harvest', { kakaoId, grade });
      S.phase='STUBBLE'; S.g=0; gainExp(12);
      await loadUser();
      toast(`수확 완료 · 등급 ${grade}`);
    }catch(e){
      const gain = 5 + Math.floor(Math.random()*3);
      S.corn += gain; S.gradeInv[grade]=(S.gradeInv[grade]|0)+gain; S.phase='STUBBLE'; S.g=0; gainExp(12);
      renderAll(); save();
      toast(`수확(로컬) · 등급 ${grade}`);
    }
  }
  function popcornChance(grade){ return ({A:.9,B:.75,C:.6,D:.4,E:.2,F:.1})[grade] ?? .5; }
  async function pop(){
    if(needLogin()) return;
    if(S.corn<1){ toast('옥수수가 없습니다'); return; }
    if(S.salt<1 || S.sugar<1){ toast('소금/설탕이 부족합니다(각 1개)'); return; }
    if(S.orcx<30){ toast('토큰이 부족합니다(30)'); return; }
    const lastGrade = (['A','B','C','D','E','F'].find(g=> (S.gradeInv[g]|0)>0) || 'C');
    try{
      await j('/api/corn/pop', { kakaoId, use:{salt:1,sugar:1}, tokenCost:30, grade:lastGrade });
      gainExp(2);
      await loadUser();
      toast('뻥튀기 완료(서버)');
    }catch(e){
      // 로컬 폴백
      S.corn -= 1; S.salt -= 1; S.sugar -= 1; S.orcx -= 30;
      if(Math.random()<popcornChance(lastGrade)){ S.popcorn += 1; toast('🍿 팝콘 +1'); }
      else{ const t=[1,2,3,5][Math.floor(Math.random()*4)]; S.orcx += t; toast(`🪙 토큰 +${t}`); }
      gainExp(2); renderAll(); save();
    }
  }
  async function exchangePopToFert(){
    if(needLogin()) return;
    if(S.popcorn<1){ toast('팝콘이 부족합니다'); return; }
    try{
      await j('/api/corn/exchange', { kakaoId, from:'popcorn', to:'fertilizer', qty:1 });
      await loadUser();
      toast('팝콘→거름 1:1 교환 완료');
    }catch(e){
      S.popcorn -= 1; S.fertilizer += 1; renderAll(); save();
      toast('교환(로컬)');
    }
  }

  /* ===== 성장/레벨/렌더 ===== */
  function gainGrowth(d){ S.g = Math.max(0, Math.min(100, (S.g||0)+d)); }
  function gainExp(n){
    S.exp = (S.exp||0) + n;
    while(S.exp>=100){ S.exp-=100; S.level=(S.level||1)+1; try{ j('/api/user/exp', { kakaoId, expGain:n, level:S.level }); }catch(e){} toast(`레벨 업! Lv.${S.level}`); }
    renderLevel(); save();
  }
  function levelIconPath(lv){ const n=Math.max(1,Math.min(10,Math.floor(lv||1))); return `img/mark_${String(n).padStart(2,'0')}.png`; }
  function renderLevel(){
    const icon = levelIconPath(S.level);
    dom.levelIcon.src = icon; dom.levelIconMini.src = icon;
    dom.levelText.textContent = `Lv.${S.level}`;
    const p = Math.max(0, Math.min(99, S.exp|0));
    dom.expBar.style.width = p + '%'; dom.expText.textContent = p + '%';
  }

  /* ===== 이미지 경로: 항상 img/파일명. 모바일은 a_ 우선, 실패시 기본 ===== */
  function setImg(el, file){
    const base = 'img/' + file;
    if(!isMobile()){ el.src = base; return; }
    const trial = 'img/a_' + file;
    const probe = new Image();
    probe.onload = ()=>{ el.src = trial; };
    probe.onerror= ()=>{ el.src = base;  };
    probe.src = trial;
  }
  function setBg(file){
    const base = `img/${file}`;
    if(!isMobile()){ dom.bg.style.backgroundImage = `url('${base}')`; return; }
    const trial = `img/a_${file}`;
    const probe = new Image();
    probe.onload = ()=>{ dom.bg.style.backgroundImage = `url('${trial}')`; };
    probe.onerror= ()=>{ dom.bg.style.backgroundImage = `url('${base}')`;  };
    probe.src = trial;
  }

  function pickBgFile(){
    const g = S.g|0;
    if(g<=29) return 'farm_05.png';
    if(g<=59) return 'farm_07.png';
    if(g<=79) return 'farm_09.png';
    if(g<=94) return 'farm_10.png';
    return 'farm_12.png';
  }
  function applyBg(){ setBg(pickBgFile()); }

  function pickMini(){
    const g=S.g|0;
    if(g<20) return {file:'corn_06_02.png', cap:'발아'};
    if(g<40) return {file:'corn_04_02.png', cap:'유묘'};
    if(g<60) return {file:'corn_02_02.png', cap:'생장'};
    if(g<80) return {file:'corn_03_01.png', cap:'성숙 전'};
    if(g<95) return {file:'corn_03_03.png', cap:'이삭'};
    return {file:'corn_01_01.png', cap:'수확 직전'};
  }
  function renderMini(){
    const m = pickMini();
    setImg(dom.miniImg, m.file);
    dom.miniImg.alt = m.cap;
    dom.miniCap.textContent = m.cap;
  }

  function renderRes(){
    dom.r.water.textContent = S.water|0;
    dom.r.fert .textContent = S.fertilizer|0;
    dom.r.corn .textContent = S.corn|0;
    dom.r.pop  .textContent = S.popcorn|0;
    dom.r.salt .textContent = S.salt|0;
    dom.r.sugar.textContent = S.sugar|0;
    dom.r.orcx .textContent = S.orcx|0;

    dom.btnHarv.disabled = !(S.phase==='GROW' && S.g>=100);
    dom.btnPop .disabled = !(S.corn>=1 && S.salt>=1 && S.sugar>=1 && S.orcx>=30);
  }
  function renderAll(){ renderLevel(); applyBg(); renderMini(); renderRes(); }

  /* ===== 이벤트 바인딩 & 부팅 ===== */
  function bind(){
    dom.btnPlant.onclick = plant;
    dom.btnWater.onclick = ()=>useRes('water');
    dom.btnFert .onclick = ()=>useRes('fertilizer');
    dom.btnHarv .onclick = harvest;
    dom.btnPop  .onclick = pop;
    dom.btnEx   .onclick = exchangePopToFert;
    window.addEventListener('resize', ()=>{ applyBg(); renderMini(); }); // 모바일/PC 전환시 a_ 반영
  }

  (async function boot(){
    renderAll();
    bind();
    await loadUser();                 // ← 서버에서 자원 먼저 로드
  })();

})();
