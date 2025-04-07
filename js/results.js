document.addEventListener('DOMContentLoaded', () => {
    const leaderboardTable = document.getElementById('leaderboard').querySelector('tbody');
    const playAgainBtn = document.getElementById('playAgain');
    const exportBtn = document.getElementById('exportBtn');
    
    // Получаем последний результат
    const lastGameResult = JSON.parse(localStorage.getItem('lastGameResult')) || {
        name: 'Игрок',
        score: 0,
        time: '00:00',
        caterpillars: 0
    };
    
    // Получаем все результаты
    const results = JSON.parse(localStorage.getItem('gameResults')) || [];
    
    // Отображаем таблицу лидеров
    renderLeaderboard(results, lastGameResult);
    
    // Кнопка "Играть снова"
    playAgainBtn.addEventListener('click', () => {
        window.location.href = 'game.html';
    });
    
    // Кнопка "Экспорт результатов"
    if (exportBtn) {
        exportBtn.addEventListener('click', exportResults);
    }
    
    function renderLeaderboard(results, currentResult) {
        leaderboardTable.innerHTML = '';
        
        let currentPlayerInTop = false;
        const displayCount = results.findIndex(item => 
            item.name === currentResult.name && item.score === currentResult.score
        ) < 9 ? 10 : 9;
        
        for (let i = 0; i < Math.min(results.length, displayCount); i++) {
            const player = results[i];
            const isCurrent = player.name === currentResult.name && player.score === currentResult.score;
            
            if (isCurrent) currentPlayerInTop = true;
            
            const row = document.createElement('tr');
            if (isCurrent) row.classList.add('current-player');
            
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${player.name}</td>
                <td>${player.score}</td>
                <td>${player.time}</td>
                <td>${player.caterpillars}</td>
            `;
            
            leaderboardTable.appendChild(row);
        }
        
        if (!currentPlayerInTop) {
            const playerIndex = results.findIndex(item => 
                item.name === currentResult.name && item.score === currentResult.score
            );
            
            if (playerIndex !== -1) {
                const row = document.createElement('tr');
                row.classList.add('current-player', 'highlight');
                
                row.innerHTML = `
                    <td>${playerIndex + 1}</td>
                    <td>${currentResult.name}</td>
                    <td>${currentResult.score}</td>
                    <td>${currentResult.time}</td>
                    <td>${currentResult.caterpillars}</td>
                `;
                
                leaderboardTable.appendChild(row);
            }
        }
    }
    
    function exportResults() {
        const results = JSON.parse(localStorage.getItem('gameResults')) || [];
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportName = 'game_results.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
    }
});