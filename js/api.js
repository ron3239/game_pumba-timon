/**
 * Модуль для работы с API игры
 * Реализует сохранение результатов и получение таблицы лидеров
 * Использует localStorage как fallback при отсутствии сервера
 */

const API_BASE_URL = 'https://your-game-api.com/v1';
const LOCAL_STORAGE_KEY = 'timon_pumba_leaderboard';

export const GameAPI = {
  /**
   * Сохраняет результат игры на сервер
   * @param {string} playerName - Имя игрока
   * @param {number} score - Количество очков
   * @param {string} time - Время игры (формат mm:ss)
   * @param {number} caterpillars - Количество съеденных гусениц
   * @returns {Promise<Object>} - Ответ сервера
   */
  async saveResult(playerName, score, time, caterpillars) {
    const resultData = {
      name: playerName,
      score,
      time,
      caterpillars,
      date: new Date().toISOString()
    };

    try {
      // Пытаемся отправить на сервер
      const response = await fetch(`${API_BASE_URL}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData)
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      
      // Сохраняем локально на случай ошибок
      this.saveToLocalStorage(resultData);
      
      return data;
    } catch (error) {
      // Если сервер недоступен, сохраняем только локально
      console.error('API error, using localStorage fallback:', error);
      return this.saveToLocalStorage(resultData);
    }
  },

  /**
   * Получает таблицу лидеров
   * @param {number} limit - Количество записей (по умолчанию 10)
   * @returns {Promise<Array>} - Массив результатов
   */
  async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      
      // Обновляем локальную копию
      if (data.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      console.error('API error, using localStorage fallback:', error);
      return this.getLocalLeaderboard(limit);
    }
  },

  /**
   * Сохраняет результат в localStorage
   * @param {Object} resultData - Данные результата
   * @returns {Object} - Сохраненные данные
   */
  saveToLocalStorage(resultData) {
    const leaderboard = this.getLocalLeaderboard();
    leaderboard.push(resultData);
    
    // Сортируем по очкам (по убыванию) и сохраняем топ-100
    const sorted = leaderboard.sort((a, b) => b.score - a.score);
    const top100 = sorted.slice(0, 100);
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(top100));
    return resultData;
  },

  /**
   * Получает таблицу лидеров из localStorage
   * @param {number} limit - Количество записей
   * @returns {Array} - Массив результатов
   */
  getLocalLeaderboard(limit = 10) {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const leaderboard = data ? JSON.parse(data) : [];
    return leaderboard.slice(0, limit);
  },

  /**
   * Рассчитывает очки по формуле игры
   * @param {number} timeSeconds - Время в секундах
   * @param {number} caterpillars - Количество гусениц
   * @returns {number} - Количество очков
   */
  calculateScore(timeSeconds, caterpillars) {
    return 1000 - timeSeconds + caterpillars * 10;
  },

  /**
   * Форматирует время из секунд в mm:ss
   * @param {number} seconds - Время в секундах
   * @returns {string} - Отформатированное время
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
};

// Пример использования:
// GameAPI.saveResult('Player1', 950, '02:30', 15)
//   .then(console.log)
//   .catch(console.error);

// GameAPI.getLeaderboard()
//   .then(leaderboard => console.table(leaderboard));