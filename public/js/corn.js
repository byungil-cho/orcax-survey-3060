// public/js/corn.js
(function(){
  const BASE = '/api/corn';

  async function req(url, opt){
    const res = await fetch(url, { headers:{'Content-Type':'application/json'}, credentials:'include', ...opt });
    const data = await res.json().catch(()=>({}));
    if(!res.ok || data.ok===false) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  const upsert  = (kakaoId, nickname='') => req(`${BASE}/upsert`, { method:'POST', body:JSON.stringify({ kakaoId, nickname }) });
  const status  = (kakaoId) => req(`${BASE}/status?`+new URLSearchParams({ kakaoId }));
  const overview= (kakaoId) => req(`${BASE}/overview?`+new URLSearchParams({ kakaoId }));
  const update  = (kakaoId, { inc={}, set={} }={}) => req(`${BASE}/update`, { method:'POST', body:JSON.stringify({ kakaoId, inc, set }) });
  const resetAdditives = (kakaoId) => req(`${BASE}/reset-additives`, { method:'POST', body:JSON.stringify({ kakaoId }) });

  window.CornAPI = { upsert, status, overview, update, resetAdditives };
})();
