/* js/corn-api.js
   - 카카오 연동 → Mongo 서버 연동(ngrok) → 자원/레벨/게이지/등급/팝콘 로직
   - 배경 자동 교체 + 미니 성장 이미지
   - 팝콘↔거름 1:1 교환(간단거래)
*/

(function(){
  'use strict';

  /* ====== 환경/도구 ====== */
  const BASE_API = 'https://climbing-wholly-grouper.jp.ngrok.io';
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const $ = id => document.getElementById(id);
  const toastEl = $('toast');
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1400); }

  // 이미지 경로 규칙: 항상 img/파일명, 모바일은 a_ 접두(존재할 때만)
  function img(file){
    // 파일이 a_ 시리즈로 존재한다는 전제 하에 모바일은 a_ 접두 사용
    return `img/${isMobile()? ('a_'+file) : file}`;
  }

  // 상태(로컬 보조 저장)
  const S = Object.assign({
    online:false,
    level:1, exp:0,                // 캐릭터 레벨/경험치
    g:0, phase:'IDLE',             // 성장 게이지/단계
    workStreak:0,                  // 연속 작업일 (등급용)
    gradeInv:{A:0,B:0,C:0,D:0,E:0,F:0}, // 등급별 보유량
    // 인벤토리
    water:0, fertilizer:0, corn:0, popcorn:0, salt:0, sugar:0, orcx:0
  }, safeParse(localStorage.getItem('corn_state')) || {});

  function save(){ try{ localStorage.setItem('corn_state', JSON.stringify(S)); }catch(e){} }
  function safeParse(j){ try{ return JSON.parse(j); }catch(e){ return null; } }

  // DOM 연결
  const dom = {
    netDot: $('netDot'), netTxt: $('netTxt'),
    r: {
      water:$('r-water'), fert:$('r-fert'), corn:$('r-corn'), pop:$('r-pop'),
      salt:$('r-salt'), sugar:$('r-sugar'), orcx:$('r-orcx')
    },
    levelIcon:$('levelIcon'), levelText:$('levelText'),
    levelIconMini:$('levelIconMini'), expBar:$('expBar'), expText:$('expText'),
    miniImg:$('miniImg'), miniCap:$('miniCap'),
    bg:$('bg'),
    btnPlant:$('btn-plant'), btnWater:$('btn-water'), btnFert:$('btn-fert'),
    btnHarv:$('btn-harv'), btnPop:$('btn-pop'), btnEx:$('btn-exchange')
  };

  /* ====== 서버 ====== */
  const kakaoId  = localStorage.getItem('kakaoId');
  const nickname = localStorage.getItem('nickname') || localStorage.getItem('kakaoNickname');

  function needLogin(){
    if(!kakaoId || !nickname){
      dom.netDot.classList.remove('ok');
      dom.netTxt.textContent = '로그인 필요';
      alert('로그인이 필요합니다. (감자 농장/메인에서 로그인)');
      return true;
    }
    return false;
  }

  async function j(path, body={}, method='POST'){
    const r = await fetch(`${BASE_API}${path}`, {
      method, headers:{'Content-Type':'application/json'},
      body: method==='GET'? undefined : JSON.stringify(body),
      mode:'cors', cache:'no-store'
    });
    const d = await r.json().catch(()=> ({}));
    if(!r.ok) throw d;
    return d;
  }

  async function loadUser(){
    if(needLogin()) return;
    try{
      const data = await j('/api/userdata', { kakaoId });
      const u = data?.user || data?.data?.user || {};
      S.online = true; dom.netDot.classList.add('ok'); dom.netTxt.textContent='온라인';

      // 자원
      S.orcx = (u.wallet?.orcx ?? u.orcx ?? S.orcx)|0;
      S.water = (u.inventory?.water ?? S.water)|0;
      S.fertilizer = (u.inventory?.fertilizer ?? S.fertilizer)|0;
      S.corn = (u.agri?.corn ?? S.corn)|0;
      S.popcorn = (u.food?.popcorn ?? S.popcorn)|0;
      S.salt = (u.additives?.salt ?? S.salt)|0;
      S.sugar = (u.additives?.sugar ?? S.sugar)|0;

      // 레벨/경험치
      const lvl = Number(u.level ?? u.profile?.level ?? S.level || 1);
      const exp = Number(u.profile?.exp ?? S.exp || 0);
      S.level = Math.max(1,lvl);
      S.exp   = Math.max(0, Math.min(99, exp));

      // 성장상태(없으면 로컬 유지)
      S.phase = (u.agri?.phase || S.phase || 'IDLE');
      S.g     = Number.isFinite(u.agri?.g) ? u.agri.g : (S.g||0);

      // 등급 인벤토리(서버에 있으면 반영)
      if(u.agri?.gradeInv){
        S.gradeInv = Object.assign({A:0,B:0,C:0,D:0,E:0,F:0}, u.agri.gradeInv);
      }

      renderAll(); save();
    }catch(e){
      S.online=false; dom.netDot.classList.remove('ok'); dom.netTxt.textContent='오프라인/연결 실패';
      renderAll();
    }
  }

  async function useResource(kind){ // 'water' | 'fertilizer'
    if(needLogin()) return;
    const field = (kind==='water' ? 'water' : 'fertilizer');
    if(S[field] <= 0){ toast((field==='water'?'물':'거름')+'이 없습니다'); return; }
    try{
      const res = await j('/api/user/inventory/use', { kakaoId, type: field, amount: 1 });
      if(typeof res?.inventory?.water === 'number') S.water = res.inventory.water;
      if(typeof res?.inventory?.fertilizer === 'number') S.fertilizer = res.inventory.fertilizer;
      // 성장 게이지 + EXP
      gainGrowth(+5);
      gainExp(3);
      await loadUser();
      toast((field==='water'?'물':'거름')+' -1 (서버)');
    }catch(e){
      // 폴백(오프라인)
      S[field]--; gainGrowth(+5); gainExp(3); renderAll(); save();
      toast('임시 차감(오프라인)');
    }
  }

  async function plant(){
    if(needLogin()) return;
    try{
      const res = await j('/api/corn/plant', { kakaoId });
      S.phase = 'GROW'; S.g = 0; gainExp(8);
      await loadUser();
      toast('씨앗 심기 완료');
    }catch(e){
      // 폴백
      S.phase='GROW'; S.g=0; gainExp(8); renderAll(); save();
      toast('씨앗 심기(로컬)');
    }
  }

  function gradeFromStreak(days){
    if(days>=5) return 'A';
    if(days===4) return 'B';
    if(days===3) return 'C';
    if(days===2) return 'D';
    if(days===1) return 'E';
    return 'F';
  }

  async function harvest(){
    if(needLogin()) return;
    if(!(S.phase==='GROW' && S.g>=100)){ toast('아직 수확 단계가 아닙니다'); return; }
    // 연속일(가정: 서버에 누적/반환 존재하면 사용, 없으면 로컬 S.workStreak++)
    S.workStreak = (S.workStreak|0) + 1;
    const grade = gradeFromStreak(S.workStreak);
    try{
      const res = await j('/api/corn/harvest', { kakaoId, grade });
      const gain = (res?.gain ?? 0)|0;
      S.corn = (res?.agri?.corn ?? (S.corn + gain))|0;
      S.gradeInv[grade] = (S.gradeInv[grade]|0) + (gain||1); // 수확 수량 기준으로 누적(미정이면 1)
      S.phase='STUBBLE'; S.g=0; gainExp(12);
      await loadUser();
      toast(`수확 완료 · 등급 ${grade}`);
    }catch(e){
      // 폴백
      const gain = 5 + Math.floor(Math.random()*3);
      S.corn += gain;
      S.gradeInv[grade] = (S.gradeInv[grade]|0) + gain;
      S.phase='STUBBLE'; S.g=0; gainExp(12);
      renderAll(); save();
      toast(`수확 완료(로컬) · 등급 ${grade}`);
    }
  }

  // 팝콘: 옥수수1 + 소금1 + 설탕1 (30토큰 소모) → 팝콘 결과(또는 토큰 보상) / 확률은 등급 영향
  function popcornChance(grade){
    return ({A:.9,B:.75,C:.6,D:.4,E:.2,F:.1})[grade] ?? .5;
  }

  async function pop(){
    if(needLogin()) return;
    if(S.corn<1){ toast('옥수수가 없습니다'); return; }
    if(S.salt<1 || S.sugar<1){ toast('소금/설탕이 부족합니다(1:1 필요)'); return; }
    if(S.orcx < 30){ toast('토큰이 부족합니다(30)'); return; }

    // 최근 등급(없으면 C 가정)
    const lastGrade = (['A','B','C','D','E','F'].find(g=> (S.gradeInv[g]|0)>0) || 'C');
    const prob = popcornChance(lastGrade);

    try{
      const res = await j('/api/corn/pop', { kakaoId, use:{salt:1,sugar:1}, tokenCost:30, grade:lastGrade });
      // 서버 결과 반영(있으면): popcorn or token drop
      await loadUser();
      gainExp(2);
      toast('뻥튀기 처리(서버)');
    }catch(e){
      // 폴백
      S.corn -= 1; S.salt -= 1; S.sugar -= 1; S.orcx -= 30;
      if(Math.random() < prob){
        S.popcorn += 1; toast('🍿 팝콘 +1');
      }else{
        const drop = [1,2,3,5][Math.floor(Math.random()*4)];
        S.orcx += drop; toast(`🪙 토큰 +${drop}`);
      }
      gainExp(2); renderAll(); save();
    }
  }

  // 간단거래: 팝콘 1 ↔ 거름 1 (마켓 미사용)
  async function exchangePopToFert(){
    if(needLogin()) return;
    if(S.popcorn<1){ toast('팝콘이 부족합니다'); return; }
    try{
      const res = await j('/api/corn/exchange', { kakaoId, from:'popcorn', to:'fertilizer', qty:1 });
      await loadUser();
      toast('팝콘→거름 교환(서버)');
    }catch(e){
      // 폴백
      S.popcorn -= 1; S.fertilizer += 1; renderAll(); save();
      toast('팝콘→거름 교환(로컬)');
    }
  }

  /* ====== 성장/레벨/배경/미니 ====== */
  function gainGrowth(d){ S.g = Math.max(0, Math.min(100, (S.g||0)+d)); }
  function gainExp(n){
    S.exp = (S.exp||0) + n;
    while(S.exp >= 100){
      S.exp -= 100; S.level = (S.level||1)+1;
      try{ j('/api/user/exp', { kakaoId, expGain:n, level:S.level }); }catch(e){}
      toast(`레벨 업! Lv.${S.level}`);
    }
    renderLevel(); save();
  }

  function levelIconPath(lv){
    const n = Math.max(1, Math.min(10, Math.floor(lv||1)));
    return `img/mark_${String(n).padStart(2,'0')}.png`;
  }

  function renderLevel(){
    const icon = levelIconPath(S.level);
    dom.levelIcon.src = icon;
    dom.levelIconMini.src = icon;
    dom.levelText.textContent = `Lv.${S.level}`;
    dom.expBar.style.width = `${Math.max(0,Math.min(99,S.exp))}%`;
    dom.expText.textContent = `${Math.max(0,Math.min(99,S.exp))}%`;
  }

  // 배경: 게이지/시간대 기반 (모바일은 a_ 접두 자동)
 function pickBg(){
    const g = S.g|0;
    let file = 'farm_05.png';
    if(g<=29) file='farm_05.png';
    else if(g<=59) file='farm_07.png';
    else if(g<=79) file='farm_09.png';
    else if(g<=94) file='farm_10.png';
    else file='farm_12.png';

    const basePath = 'img/';
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    let bgPath = basePath + file;

    if(isMobile){
        const aFile = 'a_' + file;
        const aPath = basePath + aFile;
        // a_ 이미지 존재 여부 확인 후 교체
        fetch(aPath, {method: 'HEAD'})
            .then(res => {
                if(res.ok) {
                    document.getElementById('bg').style.backgroundImage = `url(${aPath})`;
                } else {
                    document.getElementById('bg').style.backgroundImage = `url(${bgPath})`;
                }
            })
            .catch(() => {
                document.getElementById('bg').style.backgroundImage = `url(${bgPath})`;
            });
    } else {
        document.getElementById('bg').style.backgroundImage = `url(${bgPath})`;
    }
}


    // 시간대 오버레이 효과(간단): 저녁/밤엔 어두운 컷 선호 시 여기에 파일 바꾸는 룰 추가 가능
    return img(file);
  }

  function applyBg(){ dom.bg.style.backgroundImage = `url('${pickBg()}')`; }

  function pickMini(){
    const g = S.g|0;
    // 성장 스냅샷 (기존 리소스 사용)
    if(g<20) return {file:'corn_06_02.png', cap:'발아'};
    if(g<40) return {file:'corn_04_02.png', cap:'유묘'};
    if(g<60) return {file:'corn_02_02.png', cap:'생장'};
    if(g<80) return {file:'corn_03_01.png', cap:'성숙 전'};
    if(g<95) return {file:'corn_03_03.png', cap:'이삭'};
    return {file:'corn_01_01.png', cap:'수확 직전'};
  }

  function renderMini(){
    const row = pickMini();
    dom.miniImg.src = img(row.file);
    dom.miniImg.alt = row.cap;
    dom.miniCap.textContent = row.cap;
  }

  function renderRes(){
    dom.r.water.textContent = S.water|0;
    dom.r.fert.textContent  = S.fertilizer|0;
    dom.r.corn.textContent  = S.corn|0;
    dom.r.pop.textContent   = S.popcorn|0;
    dom.r.salt.textContent  = S.salt|0;
    dom.r.sugar.textContent = S.sugar|0;
    dom.r.orcx.textContent  = S.orcx|0;

    dom.btnHarv.disabled = !(S.phase==='GROW' && S.g>=100);
    dom.btnPop.disabled  = !(S.corn>=1 && S.salt>=1 && S.sugar>=1 && S.orcx>=30);
  }

  function renderAll(){ renderLevel(); renderMini(); applyBg(); renderRes(); }

  /* ====== 바인딩 ====== */
  function bind(){
    dom.btnPlant.onclick = plant;
    dom.btnWater.onclick = ()=>useResource('water');
    dom.btnFert.onclick  = ()=>useResource('fertilizer');
    dom.btnHarv.onclick  = harvest;
    dom.btnPop.onclick   = pop;
    dom.btnEx.onclick    = exchangePopToFert;
    // 주기적 자연 성장/감쇠(선택): 5초마다 물/거름 상태로 g 조정할 때 사용 가능
    setInterval(()=>{ if(S.phase==='GROW'){ /* 확장시 */ } }, 5000);
    window.addEventListener('resize', ()=>{ applyBg(); renderMini(); }); // 모바일/PC 전환시 a_ 리소스 반영
  }

  /* ====== 부팅 ====== */
  (async function boot(){
    renderAll();
    bind();
    await loadUser();
  })();

})();
