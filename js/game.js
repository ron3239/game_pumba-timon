// game.js - основной файл игры с текстурами

// Инициализация игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

// Текстуры
const textures = {
    player: {
        timon: new Image(),
        pumbaa: new Image()
    },
    hyena: new Image(),
    caterpillar: new Image(),
    platform: new Image(),
    background: new Image(),
};

// Загрузка текстур
function loadTextures() {
    // Загрузка текстур персонажей
    textures.player.timon.src = 'assets/images/timon.png';
    textures.player.pumbaa.src = 'assets/images/pumbaa.png';
    
    // Загрузка текстур врагов и окружения
    textures.hyena.src = 'assets/images/hyena.png';
    textures.caterpillar.src = 'assets/images/caterpillar.png';
    textures.platform.src = 'assets/images/platform.png';
    textures.background.src = 'assets/images/background.png';
    
    // Ожидание загрузки всех текстур
    return Promise.all([
        new Promise(resolve => { textures.player.timon.onload = resolve; }),
        new Promise(resolve => { textures.player.pumbaa.onload = resolve; }),
        new Promise(resolve => { textures.hyena.onload = resolve; }),
        new Promise(resolve => { textures.caterpillar.onload = resolve; }),
        new Promise(resolve => { textures.platform.onload = resolve; }),
        new Promise(resolve => { textures.background.onload = resolve; }),
    ]);
}

// Игровые переменные
const player = {
    x: 50,
    y: 400,
    width: 50,
    height: 70,
    speed: 5,
    jumpForce: 15,
    isJumping: false,
    isHidden: false,
    HP: 100,
    score: 0,
    velocityY: 0,
    facingRight: true,
    invulnerable: false,
    frame: 0,
    frameCount: 0,
    frames: 4 // количество кадров анимации
};

// Состояние игры
let platforms = [];
let hyenas = [];
let caterpillars = [];
let gameTime = 0;
let isPaused = false;
let gameOver = false;
let cameraOffset = 0;
let lastHyenaSpawn = 0;
let lastCaterpillarSpawn = 0;
let keys = {};
let bgMusic = document.getElementById('bgMusic');
let gameStartTime = 0;
let texturesLoaded = false;

// Константы
const GRAVITY = 0.5;
const HYENA_SPAWN_RATE = 3000; // мс
const CATERPILLAR_SPAWN_RATE = 5000; // мс
const GROUND_LEVEL = 450;

// Локальное хранилище результатов
const GameStorage = {
    saveResult(result) {
        const results = this.getResults();
        results.push(result);
        const sorted = results.sort((a, b) => b.score - a.score).slice(0, 100);
        localStorage.setItem('gameResults', JSON.stringify(sorted));
        localStorage.setItem('lastGameResult', JSON.stringify(result));
        return result;
    },
    
    getResults(limit = 10) {
        const data = localStorage.getItem('gameResults');
        return data ? JSON.parse(data).slice(0, limit) : [];
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    },
    
    calculateScore(timeSeconds, caterpillars) {
        return Math.max(0, 1000 - timeSeconds + caterpillars * 10);
    }
};

// Генерация платформ
function generatePlatforms() {
    platforms = [];
    for (let i = 0; i < 15; i++) {
        platforms.push({
            x: i * 300 + Math.random() * 200,
            y: 300 + Math.random() * 100,
            width: 100 + Math.random() * 100,
            height: 20
        });
    }
}

// Основной игровой цикл
function gameLoop() {
    if (gameOver) return;
    
    if (!isPaused && texturesLoaded) {
        updateGame();
    }
    
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Обновление игрового состояния
function updateGame() {
    handleMovement();
    
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    if (player.y > GROUND_LEVEL - player.height) {
        player.y = GROUND_LEVEL - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    checkPlatformCollision();
    spawnEnemies();
    checkCollisions();
    updateCamera();
    
    // Обновление анимации
    player.frameCount++;
    if (player.frameCount > 10) {
        player.frame = (player.frame + 1) % player.frames;
        player.frameCount = 0;
    }
}

// Обработка движения игрока
function handleMovement() {
    if (player.isHidden) return;
    
    if (keys['ArrowLeft']) {
        player.x = Math.max(0, player.x - player.speed);
        player.facingRight = false;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.facingRight = true;
    }
    if (keys['ArrowUp'] && !player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
    }
    if (keys['ArrowDown']) {
        player.isHidden = true;
        setTimeout(() => { player.isHidden = false; }, 2000);
    }
}

// Проверка столкновений с платформами
function checkPlatformCollision() {
    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height &&
            player.velocityY > 0) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }
}

// Спавн врагов
function spawnEnemies() {
    const now = Date.now();
    
    if (now - lastHyenaSpawn > HYENA_SPAWN_RATE && hyenas.length < 3) {
        hyenas.push({
            x: cameraOffset + canvas.width + 100,
            y: GROUND_LEVEL - 60,
            width: 60,
            height: 60,
            direction: 'left',
            speed: 2,
            spawnX: cameraOffset + canvas.width + 100
        });
        lastHyenaSpawn = now;
    }
    
    if (now - lastCaterpillarSpawn > CATERPILLAR_SPAWN_RATE && caterpillars.length < 2) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        caterpillars.push({
            x: platform.x + Math.random() * (platform.width - 30),
            y: platform.y - 30,
            width: 30,
            height: 30
        });
        lastCaterpillarSpawn = now;
    }
}

// Проверка столкновений с врагами
function checkCollisions() {
    // Гиены
    for (let i = 0; i < hyenas.length; i++) {
        const hyena = hyenas[i];
        
        if (hyena.direction === 'right') {
            hyena.x += hyena.speed;
            if (hyena.x > hyena.spawnX + 500) hyena.direction = 'left';
        } else {
            hyena.x -= hyena.speed;
            if (hyena.x < hyena.spawnX - 500) hyena.direction = 'right';
        }
        
        if (!player.invulnerable && !player.isHidden &&
            player.x < hyena.x + hyena.width &&
            player.x + player.width > hyena.x &&
            player.y < hyena.y + hyena.height &&
            player.y + player.height > hyena.y) {
            player.HP = Math.max(0, player.HP - 30);
            updateHPDisplay();
            player.invulnerable = true;
            setTimeout(() => { player.invulnerable = false; }, 1000);
            
            if (player.HP <= 0) endGame(false);
        }
    }
    
    // Гусеницы
    for (let i = 0; i < caterpillars.length; i++) {
        const caterpillar = caterpillars[i];
        
        if (player.x < caterpillar.x + caterpillar.width &&
            player.x + player.width > caterpillar.x &&
            player.y < caterpillar.y + caterpillar.height &&
            player.y + player.height > caterpillar.y) {
            player.HP = Math.min(100, player.HP + 5);
            player.score++;
            document.getElementById('caterpillarCount').textContent = player.score;
            caterpillars.splice(i, 1);
            i--;
        }
    }
}

// Обновление камеры
function updateCamera() {
    if (player.x > canvas.width / 2) {
        cameraOffset = player.x - canvas.width / 2;
    }
    
    if (player.x > platforms[platforms.length - 1].x + 300) {
        endGame(true);
    }
}

// Отрисовка игры
function drawGame() {
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!texturesLoaded) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Загрузка текстур...', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Фон с текстурой
    ctx.drawImage(textures.background, 
                 -cameraOffset % canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(textures.background, 
                 (-cameraOffset % canvas.width) + canvas.width, 0, canvas.width, canvas.height);
    
    // Земля (просто коричневая, без текстуры)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_LEVEL, canvas.width, canvas.height - GROUND_LEVEL);
    
    // Платформы с текстурой
    platforms.forEach(platform => {
        if (platform.x + platform.width > cameraOffset && platform.x < cameraOffset + canvas.width) {
            const platformPattern = ctx.createPattern(textures.platform, 'repeat');
            ctx.fillStyle = platformPattern;
            ctx.fillRect(platform.x - cameraOffset, platform.y, platform.width, platform.height);
        }
    });
    
    // Гусеницы с текстурой
    caterpillars.forEach(caterpillar => {
        if (caterpillar.x + caterpillar.width > cameraOffset && caterpillar.x < cameraOffset + canvas.width) {
            ctx.drawImage(textures.caterpillar, 
                        caterpillar.x - cameraOffset, caterpillar.y, 
                        caterpillar.width, caterpillar.height);
        }
    });
    
    // Гиены с текстурой (всегда зеркальные)
    hyenas.forEach(hyena => {
        if (hyena.x + hyena.width > cameraOffset && hyena.x < cameraOffset + canvas.width) {
            // Всегда отражаем изображение гиены
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(textures.hyena, 
                        -(hyena.x - cameraOffset + hyena.width), hyena.y, 
                        hyena.width, hyena.height);
            ctx.restore();
        }
    });
    
    // Игрок с текстурой (без анимации)
    if (!player.isHidden) {
        const playerImg = textures.player[player.character] || textures.player.timon;
        
        if (player.invulnerable) {
            ctx.globalAlpha = 0.5;
        }
        
        if (player.facingRight) {
            // Берем только первый кадр (без анимации)
            ctx.drawImage(playerImg, 
                        0, 0, playerImg.width, playerImg.height,
                        player.x - cameraOffset, player.y, 
                        player.width, player.height);
        } else {
            // Отражаем изображение если смотрит влево
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, 
                        0, 0, playerImg.width, playerImg.height,
                        -(player.x - cameraOffset + player.width), player.y, 
                        player.width, player.height);
            ctx.restore();
        }
        
        ctx.globalAlpha = 1.0;
    }
}

// Обновление таймера
function updateTimer() {
    if (!isPaused && !gameOver) {
        gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
        const seconds = (gameTime % 60).toString().padStart(2, '0');
        document.querySelector('.timer').textContent = `${minutes}:${seconds}`;
        setTimeout(updateTimer, 1000);
    }
}

// Обновление отображения HP
function updateHPDisplay() {
    const hpFill = document.querySelector('.hp-fill');
    hpFill.style.width = `${player.HP}%`;
    hpFill.style.backgroundColor = player.HP > 50 ? '#4CAF50' : player.HP > 20 ? '#FFC107' : '#F44336';
}

// Завершение игры
function endGame(success) {
    gameOver = true;
    bgMusic.pause();
    
    const timeSeconds = gameTime;
    const formattedTime = GameStorage.formatTime(timeSeconds);
    const score = GameStorage.calculateScore(timeSeconds, player.score);
    
    const result = {
        name: player.name,
        score: score,
        time: formattedTime,
        caterpillars: player.score,
        date: new Date().toISOString()
    };
    
    GameStorage.saveResult(result);
    
    setTimeout(() => {
        window.location.href = 'results.html';
    }, 1500);
}

// Обработка клавиш
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'Escape') {
        isPaused = !isPaused;
        if (isPaused) {
            bgMusic.pause();
        } else {
            bgMusic.play();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Инициализация игры
function initGame() {
    player.name = localStorage.getItem('playerName') || 'Игрок';
    player.character = localStorage.getItem('character') || 'timon';
    document.getElementById('playerNameDisplay').textContent = player.name;
    
    // Загрузка текстур перед началом игры
    loadTextures().then(() => {
        texturesLoaded = true;
        generatePlatforms();
        
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log("Автовоспроизведение заблокировано"));
        
        gameStartTime = Date.now();
        updateTimer();
        
        gameLoop();
        
        setInterval(() => {
            if (!isPaused && !gameOver) {
                player.HP = Math.max(0, player.HP - 1);
                updateHPDisplay();
                if (player.HP <= 0) endGame(false);
            }
        }, 1000);
    }).catch(error => {
        console.error('Ошибка загрузки текстур:', error);
        // Если текстуры не загрузились, используем простые фигуры
        texturesLoaded = true;
        generatePlatforms();
        gameStartTime = Date.now();
        updateTimer();
        gameLoop();
    });
}

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    initGame();
});