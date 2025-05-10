const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const shootBtn = document.getElementById('shoot-btn');

    // 游戏状态
    let score = 0;
    let lives = 3;
    let gameRunning = true;
    let lastShotTime = 0;
    let enemySpawnRate = 60; // 初始敌人生成频率
    let lastShotFrame = 0; // 新增：记录上次射击的帧数
    let frameCount = 0; // 新增：全局帧计数器

// 玩家角色
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 60,
    speed: 5,
    color: '#00F',
    isShooting: false,
    direction: 'right'
};

// 子弹数组
let bullets = [];
const bulletSpeed = 10;
const bulletSize = 5;

// 敌人数组
let enemies = [];
let enemySpawnTimer = 0;

// 键盘状态
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// 事件监听
document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
        if (e.code === 'Space') {
            player.isShooting = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
        if (e.code === 'Space') {
            player.isShooting = false;
        }
    }
});

// 触摸按钮事件
shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    player.isShooting = true;
    console.log('shootBtn touchstart, player:', player, 'enemies:', enemies);
});

shootBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    player.isShooting = false;
    console.log('shootBtn touchend, player:', player, 'enemies:', enemies);
});

shootBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    player.isShooting = true;
    console.log('shootBtn mousedown, player:', player, 'enemies:', enemies);
});

shootBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    e.stopPropagation();
    player.isShooting = false;
    console.log('shootBtn mouseup, player:', player, 'enemies:', enemies);
});

shootBtn.addEventListener('mouseleave', (e) => {
    e.stopPropagation();
    player.isShooting = false;
    console.log('shootBtn mouseleave, player:', player, 'enemies:', enemies);
});

// 游戏主循环
function gameLoop() {
    if (!gameRunning) return;
    frameCount++; // 新增：每帧递增
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 更新游戏状态
    updatePlayer();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    // 圆形炮台敌人逻辑
    if (window.turretModule) {
        window.turretModule.updateTurretsAndBullets(player, Date.now(), () => {
            lives--;
            livesElement.textContent = `生命: ${lives}`;
            if (lives <= 0) {
                bgMusic.pause();
                gameOver();
            }
        });
    }
    checkCollisions();
    // 绘制游戏元素
    drawPlayer();
    drawBullets();
    drawEnemies();
    // 绘制圆形炮台及其子弹
    if (window.turretModule) {
        window.turretModule.drawTurrets(ctx);
        window.turretModule.drawTurretBullets(ctx);
    }
    requestAnimationFrame(gameLoop);
}

// 更新玩家位置
function updatePlayer() {
    if (keys.ArrowUp && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
        player.direction = 'right';
    }
    if (player.isShooting && frameCount - lastShotFrame >= 10) {
        shoot();
        lastShotFrame = frameCount;
    }
}

// 射击函数
// 射击函数新增错误处理
function shoot() {
    bullets.push({
        x: player.direction === 'right' ? player.x + player.width : player.x,
        y: player.y + player.height / 2,
        direction: player.direction
    });
    
    const shootAudio = document.getElementById('shoot-audio');
    if (shootAudio) {
        try {
            shootAudio.currentTime = 0;
            shootAudio.play().catch(() => {
                console.warn('射击音效播放失败');
            });
        } catch (error) {
            console.error('音频播放错误:', error);
        }
    }
}

// 更新子弹位置
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.direction === 'right') {
            bullet.x += bulletSpeed;
        } else {
            bullet.x -= bulletSpeed;
        }
        
        // 移除超出屏幕的子弹
        if (bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
}

// 生成敌人
function spawnEnemies() {
    enemySpawnTimer++;
    // 每1000分敌人数量翻倍
    const difficultyLevel = Math.floor(score / 1000);
    const currentSpawnRate = Math.max(10, enemySpawnRate / Math.pow(2, difficultyLevel));
    // 新增：生成圆形炮台敌人（调用diren.js中的spawnTurret）
    if (window.turretModule && Math.random() < 0.01) {
        if (typeof window.turretModule.spawnTurret === 'function') {
            window.turretModule.spawnTurret();
        }
    }
    if (enemySpawnTimer % currentSpawnRate === 0) {
        const enemyType = Math.random();
        let color, health;
        if (enemyType < 0.1) { // 10% 深红色敌人
            color = '#C00';
            health = 3;
        } else if (enemyType < 0.4) { // 30% 淡红色敌人
            color = '#F66';
            health = 2;
        } else { // 普通敌人
            color = '#FFF';
            health = 1;
        }
        enemies.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 40),
            width: 40,
            height: 40,
            speed: 2 + Math.random() * 2,
            color: color,
            maxHealth: health,
            health: health
        });
    }
}

// 更新敌人位置
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x -= enemy.speed;
        
        // 移除超出屏幕的敌人
        if (enemy.x < -enemy.width) {
            enemies.splice(i, 1);
        }
    }
}

// 碰撞检测
function checkCollisions() {
    // 子弹与炮台碰撞
    bullets.forEach((bullet, index) => {
        if (window.turretModule?.checkTurretCollision(bullet)) {
            bullets.splice(index, 1);
            // 击中圆形炮台奖励1000分
            score += 1000;
            scoreElement.textContent = `分数: ${score}`;
        }
    });
    // 子弹与敌人碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (
                bullet.x > enemy.x &&
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y &&
                bullet.y < enemy.y + enemy.height
            ) {
                // 击中敌人
                bullets.splice(i, 1);
                enemy.health--;
                
                if (enemy.health <= 0) {
                    // 根据敌人类型奖励不同分数
                    let reward = 100;
                    if (enemy.color === '#C00') { // 深红色
                        reward = 300;
                    } else if (enemy.color === '#F66') { // 浅红色
                        reward = 200;
                    } else if (enemy.color === '#FFF' || enemy.color === '#FFFFFF' || enemy.color === 'white') { // 白色
                        reward = 100;
                    }
                    enemies.splice(j, 1);
                    score += reward;
                    scoreElement.textContent = `分数: ${score}`;
                }
                break;
            }
        }
    }
    
        // 玩家与炮台碰撞
    window.turretModule?.turrets?.forEach(turret => {
        const dx = player.x + player.width/2 - turret.x;
        const dy = player.y + player.height/2 - turret.y;
        if (Math.sqrt(dx*dx + dy*dy) < turret.radius + Math.max(player.width, player.height)/2) {
            lives--;
            livesElement.textContent = `生命: ${lives}`;
            if (lives <= 0) gameOver();
        }
    });

    // 玩家与敌人碰撞
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // 玩家被击中
            enemies.splice(i, 1);
            lives--;
            livesElement.textContent = `生命: ${lives}`;
            
            if (lives <= 0) {
                bgMusic.pause();
                gameOver();
            }
        }
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    
    // 持续绘制游戏结束界面
    const drawGameOver = () => {
        // 半透明黑色遮罩层
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 游戏结束文字
        ctx.fillStyle = '#FFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 40);
        
        // 最终分数
        ctx.font = '24px Arial';
        ctx.fillText(`最终分数: ${score}`, canvas.width / 2, canvas.height / 2);
        
        // 重新开始按钮
        const btnWidth = 200;
        const btnHeight = 50;
        const btnX = canvas.width / 2 - btnWidth / 2;
        const btnY = canvas.height / 2 + 40;
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('重新开始', canvas.width / 2, btnY + btnHeight / 2 + 8);
    };
    
    // 注册点击事件（支持触摸）
    const handleInteraction = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        const btnX = canvas.width / 2 - 100;
        const btnY = canvas.height / 2 + 40;
        
        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            canvas.removeEventListener('click', handleInteraction);
            canvas.removeEventListener('touchstart', handleInteraction);
            resetGame();
        }
    };
    
    canvas.addEventListener('click', handleInteraction);
    canvas.addEventListener('touchstart', handleInteraction);
    
    // 持续重绘界面
    const gameOverLoop = () => {
        if (!gameRunning) {
            drawGameOver();
            requestAnimationFrame(gameOverLoop);
        }
    };
    gameOverLoop();
}

// 重置游戏
function resetGame() {
    score = 0;
    lives = 3;
    bullets = [];
    enemies = [];
    enemySpawnTimer = 0;
    lastShotTime = 0;
    lastShotFrame = 0; // 新增：重置帧计数
    frameCount = 0; // 新增：重置帧计数
    gameRunning = true;
    canvas.onclick = null;
    
    // 重置玩家位置
    player.x = 100;
    player.y = 300;
    player.direction = 'right';
    player.isShooting = false;
    
    // 重置UI
    scoreElement.textContent = `分数: 0`;
    livesElement.textContent = `生命: 3`;
    
    // 重新开始音乐
    bgMusic.currentTime = 0;
    bgMusic.play();
    
    // 重新开始游戏循环
    gameLoop();
}

// 绘制玩家
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制枪
    ctx.fillStyle = '#888';
    if (player.direction === 'right') {
        ctx.fillRect(player.x + player.width, player.y + player.height / 2 - 2, 20, 4);
    } else {
        ctx.fillRect(player.x - 20, player.y + player.height / 2 - 2, 20, 4);
    }
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = '#FF0';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bulletSize, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        // 绘制敌人主体
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // 绘制血条（特殊敌人）
        if (enemy.maxHealth > 1) {
            const healthBarWidth = enemy.width;
            const healthBarHeight = 5;
            const healthPercentage = enemy.health / enemy.maxHealth;
            
            // 背景血条
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, healthBarHeight);
            
            // 当前血量
            ctx.fillStyle = '#0F0';
            ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth * healthPercentage, healthBarHeight);
        }
    });
}

// 开始游戏
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    gameRunning = true;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusic.play().catch(error => {
        console.error('音频播放失败:', error);
        alert('请点击页面任意位置后重试');
    });
    startBtn.style.display = 'none';
    gameLoop();
});

// 在全局变量中添加音频引用
const bgMusic = document.getElementById('bg-music');
bgMusic.autoplay = false;
bgMusic.preload = 'auto';
bgMusic.addEventListener('error', () => {
    console.error('音频加载失败，请检查文件路径');
});
bgMusic.play();

// 游戏配置对象，统一管理分数奖励、敌人生成概率等
const GAME_CONFIG = {
    enemySpawnRate: 60,
    reward: {
        turret: 1000,
        enemy: {
            normal: 100,
            lightRed: 200,
            darkRed: 300,
            white: 100
        }
    },
    player: {
        speed: 5,
        width: 40,
        height: 60,
        color: '#00F',
        initX: 100,
        initY: 300
    },
    bullet: {
        speed: 10,
        size: 5
    }
};

// 玩家类
class Player {
    constructor() {
        this.x = GAME_CONFIG.player.initX;
        this.y = GAME_CONFIG.player.initY;
        this.width = GAME_CONFIG.player.width;
        this.height = GAME_CONFIG.player.height;
        this.speed = GAME_CONFIG.player.speed;
        this.color = GAME_CONFIG.player.color;
        this.isShooting = false;
        this.direction = 'right';
    }
    reset() {
        this.x = GAME_CONFIG.player.initX;
        this.y = GAME_CONFIG.player.initY;
        this.direction = 'right';
        this.isShooting = false;
    }
}

// 子弹类
class Bullet {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
    }
    update() {
        if (this.direction === 'right') {
            this.x += GAME_CONFIG.bullet.speed;
        } else {
            this.x -= GAME_CONFIG.bullet.speed;
        }
    }
    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width;
    }
}

// 敌人类
class Enemy {
    constructor(x, y, width, height, speed, color, health, maxHealth) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
        this.health = health;
        this.maxHealth = maxHealth;
    }
    update() {
        this.x -= this.speed;
    }
    isOutOfBounds() {
        return this.x < -this.width;
    }
}