// api/db.js

const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:3060/orcaxFarm"; // 몽고DB 3060포트 사용
const client = new MongoClient(uri, { useUnifiedTopology: true });

let db;

async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db();
      console.log("🔌 MongoDB 연결 완료");
    } catch (err) {
      console.error("❌ MongoDB 연결 실패:", err);
    }
  }
  return db;
}

module.exports = connectDB;
