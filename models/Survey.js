
const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  name: String,
  satisfaction: String,
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Survey', SurveySchema);
