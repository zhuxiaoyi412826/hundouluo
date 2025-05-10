// 圆形炮台敌人及其子弹逻辑
let turrets = [];
let turretBullets = [];
let lastTurretSpawn = 0;
let lastTurretFire = 0;
const TURRET_FIRE_INTERVAL = 2000; // 2秒
const TURRET_RADIUS = 25 * 1.25;
const TURRET_BULLET_SPEED = 5;
const TURRET_BULLET_RADIUS = 6;
const TURRET_MOVE_SPEED = 1; // 与普通敌人速度一致

// 生成圆形炮台
function spawnTurret() {
    if (turrets.length > 0) return; // 保证同一时刻只有一个炮台
    const x = 800 + TURRET_RADIUS;
    const y = Math.random() * (400 - 2 * TURRET_RADIUS) + TURRET_RADIUS;
    turrets.push({ 
        x, y, 
        radius: TURRET_RADIUS,
        health: 10, // 初始生命值
        maxHealth: 10,
        miniCircles: Array(10).fill(true) // 10个小圆圈状态
    });
    lastTurretFire = Date.now(); // 记录生成时间
}

// 炮台发射子弹
function fireTurretBullets(player) {
    // 播放音效
    let audio = new Audio('./resourecs/11.wav');
    audio.play();
    turrets.forEach(turret => {
        // 计算朝向玩家当前位置的速度分量
        const dx = player.x + player.width / 1 - turret.x;
        const dy = player.y + player.height / 1 - turret.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / len) * TURRET_BULLET_SPEED;
        const vy = (dy / len) * TURRET_BULLET_SPEED;
        turretBullets.push({ x: turret.x, y: turret.y, vx, vy });
    });
}

// 更新炮台子弹
function updateTurretBullets() {
    for (let i = turretBullets.length - 1; i >= 0; i--) {
        const b = turretBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        // 超出边界移除
        if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 400) {
            turretBullets.splice(i, 1);
        }
    }
}

// 绘制炮台
function drawTurrets(ctx) {
    turrets.forEach(turret => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, turret.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FF9800';
        ctx.stroke();
        // 绘制10个小圆圈
        const miniRadius = turret.radius * 0.25;
        for (let i = 0; i < 10; i++) {
            if (turret.miniCircles && turret.miniCircles[i]) {
                const angle = (2 * Math.PI / 10) * i;
                const cx = turret.x + Math.cos(angle) * (turret.radius + miniRadius + 2);
                const cy = turret.y + Math.sin(angle) * (turret.radius + miniRadius + 2);
                ctx.beginPath();
                ctx.arc(cx, cy, miniRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#FF9800';
                ctx.fill();
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        ctx.restore();
    });
}

// 绘制炮台子弹
function drawTurretBullets(ctx) {
    turretBullets.forEach(b => {
        ctx.save();
        // 计算子弹方向
        const len = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const dx = (b.vx / len) * 50;
        const dy = (b.vy / len) * 50;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - dx, b.y - dy);
        ctx.strokeStyle = '#00FFFF'; // 亮色光线
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 50;
        ctx.stroke();
        ctx.restore();
    });
}

// 检查炮台子弹与玩家碰撞
function checkTurretCollision(bullet) {
    for (let i = turrets.length - 1; i >= 0; i--) {
        const turret = turrets[i];
        const dx = bullet.x - turret.x;
        const dy = bullet.y - turret.y;
        if (dx * dx + dy * dy < turret.radius * turret.radius) {
            // 命中小圆圈优先
            if (turret.miniCircles) {
                for (let j = 0; j < turret.miniCircles.length; j++) {
                    if (turret.miniCircles[j]) {
                        turret.miniCircles[j] = false;
                        break;
                    }
                }
                // 判断是否所有小圆圈都消失
                if (turret.miniCircles.every(c => !c)) {
                    turrets.splice(i, 1);
                    return 'killed'; // 返回击杀状态
                }
                // 命中但未全部消灭时不加分
                return 'hit';
            } else {
                turret.health--;
                if (turret.health <= 0) {
                    turrets.splice(i, 1);
                    return 'killed';
                }
            }
            return 'hit';
        }
    }
    return false;
}

function checkTurretBulletCollision(player, onHit) {
    for (let i = turretBullets.length - 1; i >= 0; i--) {
        const b = turretBullets[i];
        // 圆与矩形碰撞
        const closestX = Math.max(player.x, Math.min(b.x, player.x + player.width));
        const closestY = Math.max(player.y, Math.min(b.y, player.y + player.height));
        const dx = b.x - closestX;
        const dy = b.y - closestY;
        if (dx * dx + dy * dy < TURRET_BULLET_RADIUS * TURRET_BULLET_RADIUS) {
            turretBullets.splice(i, 1);
            onHit();
        }
    }
}

// 游戏主循环中调用的炮台相关逻辑
function updateTurretsAndBullets(player, now, onPlayerHit) {
    // 8秒生成一个炮台
    if (now - lastTurretSpawn > 8000 && turrets.length === 0) {
        spawnTurret();
        lastTurretSpawn = now;
    }
    // 炮台向左移动
    for (let i = turrets.length - 1; i >= 0; i--) {
        turrets[i].x -= TURRET_MOVE_SPEED;
        // 超出屏幕移除
        if (turrets[i].x < -TURRET_RADIUS) {
            turrets.splice(i, 1);
        }
    }
    // 1秒所有炮台发射一次
    if (turrets.length > 0 && now - lastTurretFire > TURRET_FIRE_INTERVAL) {
        fireTurretBullets(player);
        lastTurretFire = now;
    }
    updateTurretBullets();
    checkTurretBulletCollision(player, onPlayerHit);
    // 保证turrets数组长度不超过1
    if (turrets.length > 1) {
        turrets.splice(1);
    }
}

// 新增：重置炮台敌人和子弹的函数
function resetTurrets() {
    turrets = [];
    turretBullets = [];
    lastTurretSpawn = 0;
    lastTurretFire = 0;
}
// 玩家掉落动画
function playerDrop(player, callback) {
    const startY = player.y;
    const targetY = startY;
    player.y = -player.height;
    const dropStart = Date.now();
    function animate() {
        const t = (Date.now() - dropStart) / 2000;
        if (t < 1) {
            player.y = -player.height + (targetY + player.height) * t;
            requestAnimationFrame(animate);
        } else {
            player.y = targetY;
            if (callback) callback();
        }
    }
    animate();
}

// 更换背景音乐
function switchBgMusic() {
    const bg = document.getElementById('bg-music');
    if (bg) {
        bg.src = './resourecs/11.';
        bg.load();
        bg.play();
    }
}

// 导出接口
window.turretModule = {
    updateTurretsAndBullets,
    drawTurrets,
    drawTurretBullets,
    playerDrop,
    switchBgMusic,
    spawnTurret,
    checkTurretCollision
};