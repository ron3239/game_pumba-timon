document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('playerName');
    const startBtn = document.getElementById('startBtn');
    const characters = document.querySelectorAll('.character');
    let selectedCharacter = 'timon';

    // Анимация инструкций
    const instructions = document.querySelector('.instructions');
    setInterval(() => {
        instructions.style.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }, 1000);

    // Выбор персонажа
    characters.forEach(char => {
        char.addEventListener('click', () => {
            characters.forEach(c => c.classList.remove('selected'));
            char.classList.add('selected');
            selectedCharacter = char.dataset.char;
        });
    });

    // Активация кнопки при вводе имени
    playerNameInput.addEventListener('input', () => {
        startBtn.disabled = playerNameInput.value.trim() === '';
    });

    // Начало игры
    startBtn.addEventListener('click', () => {
        localStorage.setItem('playerName', playerNameInput.value.trim());
        localStorage.setItem('character', selectedCharacter);
        window.location.href = 'game.html';
    });
});