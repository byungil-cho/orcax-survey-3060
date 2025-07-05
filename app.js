const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const seedRoutes = require('./routes/seed');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost/gamjaFarm'); // 너 몽고 주소로 바꿔

app.use('/api/seed', seedRoutes);

app.listen(3000, () => console.log('서버 실행 중: http://localhost:3000'));
