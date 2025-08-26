/* ===================== 🌱 씨앗 심기 ===================== */
app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) {
      return res.status(400).json({ error: 'kakaoId 필요' });
    }

    const corn = await ensureCornDoc(kakaoId);
    if (!corn) {
      return res.status(404).json({ error: 'Corn data not found' });
    }

    // 🚫 이미 심어져 있는 상태라면 막기
    if (corn.phase === "GROW") {
      return res.status(400).json({ error: '이미 심어진 옥수수가 있습니다.' });
    }

    // 🚫 씨앗 부족
    if ((corn.seed || 0) < 1) {
      return res.status(400).json({ error: '씨앗 부족' });
    }

    // ✅ 심기 진행
    corn.seed -= 1;
    corn.phase = "GROW";
    corn.plantedAt = new Date();

    await corn.save();

    res.json({
      ok: true,
      seeds: corn.seed || 0,
      phase: corn.phase,
      plantedAt: corn.plantedAt
    });
  } catch (e) {
    console.error('[POST /api/corn/plant] error:', e);
    res.status(500).json({ error: 'server error' });
  }
});   // 🌟 반드시 이렇게 닫기


/* ===================== 🌽 수확 ===================== */
app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) {
      return res.status(400).json({ error: 'kakaoId 필요' });
    }

    const corn = await ensureCornDoc(kakaoId);

    // 간단 로직: 5~8개 수확
    const gain = 5 + Math.floor(Math.random() * 4);
    corn.corn = (corn.corn || 0) + gain;
    corn.phase = "IDLE"; // 🌟 수확 후 상태 초기화
    await corn.save();

    res.json({
      ok: true,
      gain,
      agri: { corn: corn.corn || 0 }
    });
  } catch (e) {
    console.error('[POST /api/corn/harvest] error:', e);
    res.status(500).json({ error: 'server error' });
  }
});   // 🌟 이것도 닫기















