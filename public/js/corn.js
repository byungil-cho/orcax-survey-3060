// public/js/corn.js
(function () {
  const BASE = '/api/corn';

  async function req(url, opt) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opt,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function upsert(kakaoId, nickname = '') {
    return req(`${BASE}/upsert`, {
      method: 'POST',
      body: JSON.stringify({ kakaoId, nickname }),
    });
  }

  async function status(kakaoId) {
    const q = new URLSearchParams({ kakaoId }).toString();
    return req(`${BASE}/status?${q}`);
  }

  async function overview(kakaoId) {
    const q = new URLSearchParams({ kakaoId }).toString();
    return req(`${BASE}/overview?${q}`);
  }

  // inc: { 'seedCorn': 1, 'additives.salt': -1, 'corn': 3 }
  // set: { nickname: '고래잡이선장' } (옵션)
  async function update(kakaoId, { inc = {}, set = {} } = {}) {
    return req(`${BASE}/update`, {
      method: 'POST',
      body: JSON.stringify({ kakaoId, inc, set }),
    });
  }

  async function resetAdditives(kakaoId) {
    return req(`${BASE}/reset-additives`, {
      method: 'POST',
      body: JSON.stringify({ kakaoId }),
    });
  }

  // 전역 노출 (기존 코드 건드리지 않고 필요할 때만 호출)
  window.CornAPI = {
    upsert, status, overview, update, resetAdditives
  };
})();
