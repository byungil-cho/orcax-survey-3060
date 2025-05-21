
const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');

// GET
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).send('조회 실패');
  }
});

// POST
router.post('/', async (req, res) => {
  try {
    const newSurvey = new Survey(req.body);
    await newSurvey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(500).send('등록 실패');
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Survey.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send('해당 설문 없음');
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('삭제 실패');
  }
});

module.exports = router;
