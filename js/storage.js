// storage.js - модуль для работы с локальными данными
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, 'results.json');

// Инициализация файла, если его нет
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
}

function saveResult(result) {
  const results = getResults();
  results.push(result);
  
  // Сортируем по убыванию очков и сохраняем топ-100
  const sorted = results.sort((a, b) => b.score - a.score).slice(0, 100);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(sorted, null, 2));
  
  return result;
}

function getResults(limit = 10) {
  const data = fs.readFileSync(RESULTS_FILE);
  const results = JSON.parse(data);
  return results.slice(0, limit);
}

module.exports = {
  saveResult,
  getResults
};