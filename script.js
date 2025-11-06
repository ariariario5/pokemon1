// ポケモンデータ（リアルなステータス付き）
const pokemonData = {
    hitokage: {
        name: "ヒトカゲ",
        type: "ほのお",
        hp: 20,
        attack: 12,      // 物理攻撃力
        defense: 8,      // 物理防御力
        spAttack: 14,    // 特殊攻撃力
        spDefense: 10,   // 特殊防御力
        speed: 15,       // すばやさ
        moves: [
            { name: "ひのこ", power: 40, type: "ほのお", category: "special", pp: 25, accuracy: 100, effect: "burn", effectChance: 10 },
            { name: "たいあたり", power: 30, type: "ノーマル", category: "physical", pp: 35, accuracy: 100 },
            { name: "ひっかく", power: 35, type: "ノーマル", category: "physical", pp: 35, accuracy: 90 },
            { name: "なきごえ", power: 0, type: "ノーマル", category: "status", pp: 40, accuracy: 100, effect: "attack-down", stages: 1 }
        ]
    },
    fushigidane: {
        name: "フシギダネ",
        type: "くさ",
        hp: 22,
        attack: 10,      // 物理攻撃力
        defense: 10,     // 物理防御力
        spAttack: 12,    // 特殊攻撃力
        spDefense: 12,   // 特殊防御力
        speed: 12,       // すばやさ
        moves: [
            { name: "はっぱカッター", power: 45, type: "くさ", category: "physical", pp: 25, accuracy: 95 },
            { name: "たいあたり", power: 30, type: "ノーマル", category: "physical", pp: 35, accuracy: 100 },
            { name: "つるのムチ", power: 35, type: "くさ", category: "physical", pp: 25, accuracy: 100 },
            { name: "どくのこな", power: 0, type: "くさ", category: "status", pp: 35, accuracy: 75, effect: "poison" }
        ]
    }
};

// タイプ相性テーブル（攻撃タイプ→防御タイプ）
const typeChart = {
    "ノーマル": { "ノーマル": 1.0, "ほのお": 1.0, "みず": 1.0, "くさ": 1.0, "でんき": 1.0 },
    "ほのお": { "ノーマル": 1.0, "ほのお": 0.5, "みず": 0.5, "くさ": 2.0, "でんき": 1.0 },
    "みず": { "ノーマル": 1.0, "ほのお": 2.0, "みず": 0.5, "くさ": 0.5, "でんき": 1.0 },
    "くさ": { "ノーマル": 1.0, "ほのお": 0.5, "みず": 2.0, "くさ": 0.5, "でんき": 1.0 },
    "でんき": { "ノーマル": 1.0, "ほのお": 1.0, "みず": 2.0, "くさ": 0.5, "でんき": 0.5 }
};

// ゲーム状態（拡張版）
let gameState = {
    player: {
        pokemon: { ...pokemonData.hitokage },
        level: 5,
        currentHp: 20,
        exp: 0,
        expToNext: 100,
        statStages: {
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0,
            speed: 0
        },
        statusCondition: null, // burn, poison, paralysis, freeze, sleep
        statusTurns: 0
    },
    enemy: {
        pokemon: { ...pokemonData.fushigidane },
        level: 5,
        currentHp: 22,
        exp: 0,
        expToNext: 100,
        statStages: {
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0,
            speed: 0
        },
        statusCondition: null,
        statusTurns: 0
    },
    turn: "player",
    battlePhase: "menu", // menu, move-select, battle, message
    turnOrder: [], // 先攻後攻の順番
    battleLog: [], // 戦闘ログ
    messageQueue: [],
    currentMessage: 0
};

// 初期化
gameState.player.currentHp = gameState.player.pokemon.hp;
gameState.enemy.currentHp = gameState.enemy.pokemon.hp;

// サウンドエフェクト (簡素化版)
let audioContext;
let masterVolume = 0.3;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio not supported');
        audioContext = null;
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(masterVolume * 0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Sound playback failed');
    }
}

function playAttackSound() {
    // シンプルな攻撃音
    playSound(300, 0.2, 'square');
}

function playDamageSound() {
    // ダメージ音
    playSound(150, 0.3, 'sawtooth');
}

function playMenuSound() {
    // メニュー選択音
    playSound(800, 0.1, 'square');
}

function playVictorySound() {
    // 勝利のファンファーレ (より長く豪華に)
    const victoryMelody = [
        {note: 523, duration: 0.15}, // C
        {note: 659, duration: 0.15}, // E
        {note: 784, duration: 0.15}, // G
        {note: 1047, duration: 0.25}, // C (高)
        {note: 784, duration: 0.15}, // G
        {note: 1047, duration: 0.15}, // C (高)
        {note: 1319, duration: 0.4}  // E (高)
    ];

    let currentTime = 0;
    victoryMelody.forEach(({note, duration}) => {
        setTimeout(() => {
            playSound(note, duration, 'sine', 1.5);
        }, currentTime * 1000);
        currentTime += duration;
    });
}

function playDefeatSound() {
    // 敗北の短いジングル
    const defeatMelody = [
        {note: 392, duration: 0.3}, // G
        {note: 349, duration: 0.3}, // F
        {note: 311, duration: 0.3}, // Eb
        {note: 262, duration: 0.6}  // C
    ];

    let currentTime = 0;
    defeatMelody.forEach(({note, duration}) => {
        setTimeout(() => {
            playSound(note, duration, 'sine', 1.2);
        }, currentTime * 1000);
        currentTime += duration;
    });
}

function playLevelUpSound() {
    // レベルアップファンファーレ
    const levelUpMelody = [
        {note: 523, duration: 0.2}, // C
        {note: 659, duration: 0.2}, // E
        {note: 784, duration: 0.2}, // G
        {note: 1047, duration: 0.2}, // C (高)
        {note: 1319, duration: 0.5}  // E (高)
    ];

    let currentTime = 0;
    levelUpMelody.forEach(({note, duration}) => {
        setTimeout(() => {
            playSound(note, duration, 'triangle', 1.0);
        }, currentTime * 1000);
        currentTime += duration;
    });
}

// 経験値・レベルアップ システム
function gainExperience(pokemon, expGained) {
    pokemon.exp += expGained;

    if (pokemon.exp >= pokemon.expToNext) {
        return levelUp(pokemon);
    }
    return false;
}

function levelUp(pokemon) {
    pokemon.level++;
    pokemon.exp -= pokemon.expToNext;
    pokemon.expToNext = Math.floor(pokemon.expToNext * 1.2); // 次のレベルに必要な経験値増加

    // ステータス上昇
    const hpIncrease = Math.floor(Math.random() * 3) + 2; // 2-4上昇
    const statIncrease = Math.floor(Math.random() * 2) + 1; // 1-2上昇

    pokemon.pokemon.hp += hpIncrease;
    pokemon.pokemon.attack += statIncrease;
    pokemon.pokemon.defense += statIncrease;
    pokemon.pokemon.spAttack += statIncrease;
    pokemon.pokemon.spDefense += statIncrease;
    pokemon.pokemon.speed += statIncrease;

    // 現在HPも回復
    pokemon.currentHp += hpIncrease;

    return {
        hpIncrease,
        statIncrease,
        newLevel: pokemon.level
    };
}

function showLevelUpAnimation(pokemon, levelUpData, callback) {
    playLevelUpSound();

    // レベルアップログ追加
    addToBattleLog(`${pokemon.pokemon.name}がレベル${levelUpData.newLevel}にアップ！`, 'system');
    addToBattleLog(`HP+${levelUpData.hpIncrease} ステータス+${levelUpData.statIncrease}`, 'system');

    // ポケモンスプライトにジャンプアニメーション
    const sprite = pokemon === gameState.player ?
        document.querySelector('.player-sprite') :
        document.querySelector('.enemy-sprite');

    sprite.classList.add('level-up-jump');

    setTimeout(() => {
        sprite.classList.remove('level-up-jump');
    }, 1000);

    // レベル表示更新
    if (pokemon === gameState.player && elements.playerLevel) {
        elements.playerLevel.textContent = `Lv. ${levelUpData.newLevel}`;
    }

    updateExpBar();

    // レベルアップメッセージ表示
    showMessage(`${pokemon.pokemon.name}は レベル${levelUpData.newLevel}に あがった！`, () => {
        showMessage(`HP が ${levelUpData.hpIncrease} あがった！`, () => {
            showMessage(`ステータスが あがった！`, callback);
        });
    });
}

// バトルBGM (簡素化版)
let bgmIsPlaying = false;
let bgmInterval;

function playBattleBGM() {
    if (bgmIsPlaying || !audioContext) return;
    bgmIsPlaying = true;

    // シンプルなメロディーループ
    const notes = [330, 392, 330, 294, 262];
    let noteIndex = 0;

    bgmInterval = setInterval(() => {
        if (!bgmIsPlaying) return;

        playSound(notes[noteIndex], 0.3, 'square');
        noteIndex = (noteIndex + 1) % notes.length;
    }, 500);
}

function stopBattleBGM() {
    bgmIsPlaying = false;
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

// DOM要素の取得
const elements = {
    playerName: document.getElementById('player-name'),
    enemyName: document.getElementById('enemy-name'),
    playerLevel: document.getElementById('player-level'),
    enemyLevel: document.getElementById('enemy-level'),
    playerHp: document.getElementById('player-hp'),
    enemyHp: document.getElementById('enemy-hp'),
    playerCurrentHp: document.getElementById('player-current-hp'),
    playerMaxHp: document.getElementById('player-max-hp'),
    playerExp: document.getElementById('player-exp'),
    playerExpCurrent: document.getElementById('player-exp-current'),
    playerExpNext: document.getElementById('player-exp-next'),
    battleMessage: document.getElementById('battle-message'),
    mainMenu: document.getElementById('main-menu'),
    movesMenu: document.getElementById('moves-menu'),
    playerSprite: document.getElementById('player-sprite-img'),
    enemySprite: document.getElementById('enemy-sprite-img'),
    battleLog: document.getElementById('battle-log'),
    logContent: document.getElementById('log-content'),
    logToggle: document.getElementById('log-toggle'),
    logClose: document.getElementById('log-close')
};

// バトルログ システム
function addToBattleLog(message, type = 'system') {
    gameState.battleLog.push({ message, type, timestamp: Date.now() });

    // ログエントリを作成
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;

    if (elements.logContent) {
        elements.logContent.appendChild(logEntry);
        // 自動スクロール
        elements.logContent.scrollTop = elements.logContent.scrollHeight;
    }
}

function toggleBattleLog() {
    if (elements.battleLog) {
        const isVisible = elements.battleLog.style.display !== 'none';
        elements.battleLog.style.display = isVisible ? 'none' : 'block';
        playMenuSound();
    }
}

// 経験値バー更新
function updateExpBar() {
    if (elements.playerExp && elements.playerExpCurrent && elements.playerExpNext) {
        const expPercent = (gameState.player.exp / gameState.player.expToNext) * 100;
        elements.playerExp.style.width = expPercent + '%';
        elements.playerExpCurrent.textContent = gameState.player.exp;
        elements.playerExpNext.textContent = gameState.player.expToNext;
    }
}

// 初期表示更新
function initializeDisplay() {
    elements.playerName.textContent = gameState.player.pokemon.name;
    elements.enemyName.textContent = gameState.enemy.pokemon.name;

    if (elements.playerLevel) elements.playerLevel.textContent = `Lv. ${gameState.player.level}`;
    if (elements.enemyLevel) elements.enemyLevel.textContent = `Lv. ${gameState.enemy.level}`;

    elements.playerCurrentHp.textContent = gameState.player.currentHp;
    elements.playerMaxHp.textContent = gameState.player.pokemon.hp;

    updateHpBars();
    updateExpBar();

    // すべてを表示状態にして即座にゲーム開始
    const enemySprite = document.querySelector('.enemy-sprite');
    const playerSprite = document.querySelector('.player-sprite');
    const enemyPokemon = document.querySelector('.enemy-pokemon');
    const playerPokemon = document.querySelector('.player-pokemon');

    if (enemySprite) enemySprite.style.opacity = '1';
    if (playerSprite) playerSprite.style.opacity = '1';
    if (enemyPokemon) enemyPokemon.style.opacity = '1';
    if (playerPokemon) playerPokemon.style.opacity = '1';

    // バトルログ初期化
    addToBattleLog('バトル開始！', 'system');
}


// HPバー更新
function updateHpBars() {
    const playerHpPercent = (gameState.player.currentHp / gameState.player.pokemon.hp) * 100;
    const enemyHpPercent = (gameState.enemy.currentHp / gameState.enemy.pokemon.hp) * 100;

    elements.playerHp.style.width = playerHpPercent + '%';
    elements.enemyHp.style.width = enemyHpPercent + '%';

    elements.playerCurrentHp.textContent = gameState.player.currentHp;

    // HPバーの色変更
    if (playerHpPercent <= 20) {
        elements.playerHp.style.background = '#F44336';
    } else if (playerHpPercent <= 50) {
        elements.playerHp.style.background = '#FFC107';
    } else {
        elements.playerHp.style.background = '#4CAF50';
    }

    if (enemyHpPercent <= 20) {
        elements.enemyHp.style.background = '#F44336';
    } else if (enemyHpPercent <= 50) {
        elements.enemyHp.style.background = '#FFC107';
    } else {
        elements.enemyHp.style.background = '#4CAF50';
    }
}

// メッセージ表示
function showMessage(message, callback) {
    elements.battleMessage.textContent = message;

    // バトルログにも追加
    if (message !== "どうする？" && message !== "どの わざを つかう？") {
        addToBattleLog(message);
    }

    // メッセージボックスクリックでメッセージ進行
    const messageBox = document.querySelector('.message-box');
    const handleClick = () => {
        messageBox.removeEventListener('click', handleClick);
        if (callback) callback();
    };

    setTimeout(() => {
        messageBox.addEventListener('click', handleClick);
    }, 500);
}

// ステータス計算（ランク補正込み）
function getEffectiveStat(pokemon, statName, statStages) {
    const baseStat = pokemon[statName];
    const stage = statStages[statName];

    // ポケモンの能力ランク補正
    let modifier = 1.0;
    if (stage > 0) {
        modifier = (2 + stage) / 2;
    } else if (stage < 0) {
        modifier = 2 / (2 + Math.abs(stage));
    }

    return Math.floor(baseStat * modifier);
}

// 先攻後攻判定
function determineTurnOrder(playerMove, enemyMove) {
    const playerSpeed = getEffectiveStat(gameState.player.pokemon, 'speed', gameState.player.statStages);
    const enemySpeed = getEffectiveStat(gameState.enemy.pokemon, 'speed', gameState.enemy.statStages);

    // まひ状態はすばやさ1/4
    const finalPlayerSpeed = gameState.player.statusCondition === 'paralysis' ? Math.floor(playerSpeed / 4) : playerSpeed;
    const finalEnemySpeed = gameState.enemy.statusCondition === 'paralysis' ? Math.floor(enemySpeed / 4) : enemySpeed;

    if (finalPlayerSpeed > finalEnemySpeed) {
        return ['player', 'enemy'];
    } else if (finalEnemySpeed > finalPlayerSpeed) {
        return ['enemy', 'player'];
    } else {
        // 同速の場合はランダム
        return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
    }
}

// タイプ相性計算
function getTypeEffectiveness(moveType, defenderType) {
    return typeChart[moveType]?.[defenderType] || 1.0;
}

// クリティカル判定
function checkCriticalHit() {
    return Math.random() < (1/16); // 1/16確率
}

// レベル補正ステータス計算
function getLevelAdjustedStat(baseStat, level) {
    return Math.floor(baseStat * (1 + (level - 1) * 0.1));
}

// 高度なダメージ計算式
function calculateDamage(attacker, defender, move) {
    if (move.power === 0) return { damage: 0, isCritical: false, effectiveness: 1.0 };

    // 命中判定
    if (Math.random() * 100 > move.accuracy) {
        return { damage: -1, isCritical: false, effectiveness: 1.0 }; // 外れ
    }

    let attackStat, defenseStat;

    // レベル補正付きステータス取得
    if (move.category === 'physical') {
        const baseAttack = getLevelAdjustedStat(attacker.pokemon.attack, attacker.level);
        const baseDefense = getLevelAdjustedStat(defender.pokemon.defense, defender.level);
        attackStat = getEffectiveStat({ attack: baseAttack }, 'attack', attacker.statStages);
        defenseStat = getEffectiveStat({ defense: baseDefense }, 'defense', defender.statStages);
    } else if (move.category === 'special') {
        const baseSpAttack = getLevelAdjustedStat(attacker.pokemon.spAttack, attacker.level);
        const baseSpDefense = getLevelAdjustedStat(defender.pokemon.spDefense, defender.level);
        attackStat = getEffectiveStat({ spAttack: baseSpAttack }, 'spAttack', attacker.statStages);
        defenseStat = getEffectiveStat({ spDefense: baseSpDefense }, 'spDefense', defender.statStages);
    } else {
        return { damage: 0, isCritical: false, effectiveness: 1.0 }; // ステータス技
    }

    // やけど状態は物理攻撃力半減
    if (attacker.statusCondition === 'burn' && move.category === 'physical') {
        attackStat = Math.floor(attackStat / 2);
    }

    // クリティカル判定
    const isCritical = checkCriticalHit();
    let criticalMultiplier = isCritical ? 2.0 : 1.0;

    // タイプ相性
    const effectiveness = getTypeEffectiveness(move.type, defender.pokemon.type);

    // 基本ダメージ計算（レベル補正込み）
    const levelFactor = (2 * attacker.level + 10) / 250;
    const baseDamage = Math.floor(
        levelFactor * (attackStat / defenseStat) * move.power + 2
    );

    // ランダム要素 (85-100%)
    const randomFactor = (Math.random() * 0.15 + 0.85);

    // 最終ダメージ
    let finalDamage = Math.floor(baseDamage * criticalMultiplier * effectiveness * randomFactor);
    finalDamage = Math.max(1, finalDamage);

    return {
        damage: finalDamage,
        isCritical: isCritical,
        effectiveness: effectiveness
    };
}

// 状態異常関連
function applyStatusEffect(target, effect, effectChance = 100) {
    if (target.statusCondition !== null) return false; // 既に状態異常

    if (Math.random() * 100 <= effectChance) {
        target.statusCondition = effect;
        target.statusTurns = 0;
        return true;
    }
    return false;
}

function applyStatStageChange(target, stat, stages) {
    const currentStage = target.statStages[stat];
    const newStage = Math.max(-6, Math.min(6, currentStage + stages));
    target.statStages[stat] = newStage;
    return newStage !== currentStage;
}

function processStatusDamage(target) {
    let damage = 0;
    if (target.statusCondition === 'burn') {
        damage = Math.max(1, Math.floor(target.pokemon.hp / 16));
    } else if (target.statusCondition === 'poison') {
        damage = Math.max(1, Math.floor(target.pokemon.hp / 8));
    }

    if (damage > 0) {
        target.currentHp = Math.max(0, target.currentHp - damage);
        addToBattleLog(`${target.pokemon.name}は${target.statusCondition === 'burn' ? 'やけど' : 'どく'}で${damage}ダメージ`, 'status');
        return damage;
    }
    return 0;
}

function getStatusMessage(pokemon, status) {
    const messages = {
        burn: `${pokemon.name}は やけどで くるしんでいる！`,
        poison: `${pokemon.name}は どくで くるしんでいる！`,
        paralysis: `${pokemon.name}は からだが しびれて うごけない！`
    };
    return messages[status] || '';
}

// バトルアニメーション
function playAttackAnimation(isPlayer, callback) {
    const sprite = isPlayer ? elements.playerSprite : elements.enemySprite;
    sprite.classList.add('shake');
    playAttackSound(); // 攻撃音を追加

    setTimeout(() => {
        sprite.classList.remove('shake');
        if (callback) callback();
    }, 500);
}

function playDamageAnimation(isPlayer, damage, callback) {
    const sprite = isPlayer ? elements.playerSprite : elements.enemySprite;
    const gameContainer = document.querySelector('.game-container');

    sprite.classList.add('flash');
    gameContainer.classList.add('screen-shake'); // 画面振動を追加
    playDamageSound(); // ダメージ音を追加

    // 画面振動を停止
    setTimeout(() => {
        gameContainer.classList.remove('screen-shake');
    }, 300);

    // ダメージ数値表示
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.textContent = `-${damage}`;

    const rect = sprite.getBoundingClientRect();
    damageText.style.position = 'absolute';
    damageText.style.left = (rect.left + rect.width / 2) + 'px';
    damageText.style.top = rect.top + 'px';

    document.body.appendChild(damageText);

    setTimeout(() => {
        sprite.classList.remove('flash');
        damageText.remove();
        if (callback) callback();
    }, 1000);
}

// プレイヤーの攻撃
function playerAttack(moveIndex) {
    const move = gameState.player.pokemon.moves[moveIndex];

    // 敵の技をランダム選択
    const availableEnemyMoves = gameState.enemy.pokemon.moves.filter(m => m.pp > 0);
    const enemyMove = availableEnemyMoves[Math.floor(Math.random() * availableEnemyMoves.length)];

    // 先攻後攻を決定
    const turnOrder = determineTurnOrder(move, enemyMove);
    gameState.turnOrder = [
        { type: turnOrder[0], move: turnOrder[0] === 'player' ? move : enemyMove },
        { type: turnOrder[1], move: turnOrder[1] === 'player' ? move : enemyMove }
    ];

    gameState.battlePhase = "battle";
    executeTurn(0); // 最初のターンを実行
}

function executeTurn(turnIndex) {
    if (turnIndex >= gameState.turnOrder.length) {
        // ターン終了処理
        endTurn();
        return;
    }

    const currentTurn = gameState.turnOrder[turnIndex];
    const isPlayer = currentTurn.type === 'player';
    const attacker = isPlayer ? gameState.player : gameState.enemy;
    const defender = isPlayer ? gameState.enemy : gameState.player;

    // まひ状態での行動不能チェック
    if (attacker.statusCondition === 'paralysis' && Math.random() < 0.25) {
        showMessage(getStatusMessage(attacker.pokemon, 'paralysis'), () => {
            executeTurn(turnIndex + 1);
        });
        return;
    }

    const move = currentTurn.move;
    showMessage(`${attacker.pokemon.name}の ${move.name}！`, () => {
        executeMove(attacker, defender, move, () => {
            executeTurn(turnIndex + 1);
        });
    });
}

function executeMove(attacker, defender, move, callback) {
    playAttackAnimation(attacker === gameState.player, () => {
        if (move.category === 'status') {
            // ステータス技の処理
            if (move.effect === 'attack-down') {
                if (applyStatStageChange(defender, 'attack', -move.stages)) {
                    showMessage(`${defender.pokemon.name}の こうげきが さがった！`, callback);
                } else {
                    showMessage(`${defender.pokemon.name}の こうげきは もう さがらない！`, callback);
                }
            } else if (move.effect === 'poison') {
                if (applyStatusEffect(defender, 'poison')) {
                    showMessage(`${defender.pokemon.name}は どく状態になった！`, callback);
                } else {
                    showMessage(`こうかが なかった...`, callback);
                }
            }
        } else {
            // 攻撃技の処理
            const damageResult = calculateDamage(attacker, defender, move);

            if (damageResult.damage === -1) {
                showMessage(`${attacker.pokemon.name}の こうげきは はずれた！`, callback);
                return;
            }

            // ダメージログを追加
            addToBattleLog(`${defender.pokemon.name}に ${damageResult.damage}のダメージ！`, 'damage');

            // クリティカル・タイプ相性メッセージ
            let battleMessages = [];

            if (damageResult.isCritical) {
                battleMessages.push("きゅうしょに あたった！");
            }

            if (damageResult.effectiveness > 1) {
                battleMessages.push("こうかは ばつぐんだ！");
            } else if (damageResult.effectiveness < 1) {
                battleMessages.push("こうかは いまひとつのようだ...");
            }

            defender.currentHp = Math.max(0, defender.currentHp - damageResult.damage);
            updateHpBars();

            // クリティカルエフェクト
            if (damageResult.isCritical) {
                const sprite = defender === gameState.player ? elements.playerSprite : elements.enemySprite;
                sprite.classList.add('critical-hit');
                setTimeout(() => sprite.classList.remove('critical-hit'), 500);
            }

            // 追加効果判定
            let statusApplied = false;
            if (move.effect && move.effectChance) {
                statusApplied = applyStatusEffect(defender, move.effect, move.effectChance);
            }

            playDamageAnimation(defender === gameState.player, damageResult.damage, () => {
                function showBattleMessages(index) {
                    if (index >= battleMessages.length) {
                        // バトル終了チェック
                        if (defender.currentHp <= 0) {
                            if (defender === gameState.enemy) {
                                // 経験値獲得
                                const expGained = Math.floor(defender.level * 15 + Math.random() * 10);
                                const levelUpResult = gainExperience(gameState.player, expGained);

                                showMessage(`てきの ${defender.pokemon.name}は たおれた！`, () => {
                                    showMessage(`${expGained}の けいけんちを かくとく！`, () => {
                                        if (levelUpResult) {
                                            showLevelUpAnimation(gameState.player, levelUpResult, () => {
                                                playVictorySound();
                                                showMessage("しょうぶに かった！", () => resetBattle());
                                            });
                                        } else {
                                            playVictorySound();
                                            showMessage("しょうぶに かった！", () => resetBattle());
                                        }
                                    });
                                });
                            } else {
                                showMessage(`${defender.pokemon.name}は たおれた！`, () => {
                                    playDefeatSound();
                                    showMessage("しょうぶに まけた...", () => resetBattle());
                                });
                            }
                        } else if (statusApplied) {
                            const statusMsg = move.effect === 'burn' ? `${defender.pokemon.name}は やけどを おった！` :
                                             move.effect === 'poison' ? `${defender.pokemon.name}は どく状態になった！` : '';
                            showMessage(statusMsg, callback);
                        } else {
                            callback();
                        }
                        return;
                    }

                    showMessage(battleMessages[index], () => {
                        showBattleMessages(index + 1);
                    });
                }

                showBattleMessages(0);
            });
        }
    });
}

function endTurn() {
    // 状態異常ダメージ処理
    let statusMessages = [];

    const playerStatusDamage = processStatusDamage(gameState.player);
    const enemyStatusDamage = processStatusDamage(gameState.enemy);

    if (playerStatusDamage > 0) {
        statusMessages.push(getStatusMessage(gameState.player.pokemon, gameState.player.statusCondition));
    }
    if (enemyStatusDamage > 0) {
        statusMessages.push(getStatusMessage(gameState.enemy.pokemon, gameState.enemy.statusCondition));
    }

    function showStatusMessages(index) {
        if (index >= statusMessages.length) {
            updateHpBars();
            // 状態異常で倒れていないかチェック
            if (gameState.player.currentHp <= 0) {
                showMessage(`${gameState.player.pokemon.name}は たおれた！`, () => {
                    showMessage("しょうぶに まけた...", () => resetBattle());
                });
            } else if (gameState.enemy.currentHp <= 0) {
                showMessage(`てきの ${gameState.enemy.pokemon.name}は たおれた！`, () => {
                    showMessage("しょうぶに かった！", () => resetBattle());
                });
            } else {
                playerTurn();
            }
            return;
        }

        showMessage(statusMessages[index], () => {
            showStatusMessages(index + 1);
        });
    }

    if (statusMessages.length > 0) {
        showStatusMessages(0);
    } else {
        playerTurn();
    }
}


// プレイヤーのターン
function playerTurn() {
    gameState.battlePhase = "menu";
    elements.mainMenu.style.display = 'grid';
    elements.movesMenu.style.display = 'none';
    showMessage("どうする？", null);
}

// バトルリセット
function resetBattle() {
    gameState.player.currentHp = gameState.player.pokemon.hp;
    gameState.enemy.currentHp = gameState.enemy.pokemon.hp;

    // ステータス変化リセット
    gameState.player.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    gameState.enemy.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };

    // 状態異常リセット
    gameState.player.statusCondition = null;
    gameState.player.statusTurns = 0;
    gameState.enemy.statusCondition = null;
    gameState.enemy.statusTurns = 0;

    updateHpBars();
    playerTurn();
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game initializing...');

    // オーディオ初期化
    initAudio();

    // BGMコントロール設定
    const bgmToggle = document.getElementById('bgm-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');

    if (bgmToggle) {
        bgmToggle.addEventListener('click', () => {
            if (!audioContext) initAudio();

            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }

            if (bgmIsPlaying) {
                stopBattleBGM();
                bgmToggle.textContent = '🎵 OFF';
                bgmToggle.classList.add('off');
            } else {
                playBattleBGM();
                bgmToggle.textContent = '🎵 ON';
                bgmToggle.classList.remove('off');
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            masterVolume = e.target.value / 100;
            if (volumeDisplay) volumeDisplay.textContent = e.target.value;
        });
    }

    // 初期化を実行
    initializeDisplay();

    // メインメニューのクリックイベント
    elements.mainMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-option')) {
            playMenuSound(); // メニュー音を追加
            const action = e.target.dataset.action;

            switch(action) {
                case 'fight':
                    elements.mainMenu.style.display = 'none';
                    elements.movesMenu.style.display = 'grid';
                    showMessage("どの わざを つかう？", null);
                    break;
                case 'pokemon':
                    showMessage("ほかに せんとうできる ポケモンが いない！", null);
                    break;
                case 'bag':
                    showMessage("どうぐを つかった！", () => {
                        showMessage("...しかし なにも おこらなかった", () => {
                            enemyTurn();
                        });
                    });
                    break;
                case 'run':
                    showMessage("うまく にげきれた！", () => {
                        resetBattle();
                    });
                    break;
            }
        }
    });

    // 技メニューのクリックイベント
    elements.movesMenu.addEventListener('click', (e) => {
        const menuOption = e.target.closest('.menu-option');
        if (menuOption) {
            playMenuSound(); // メニュー音を追加
            const moveIndex = parseInt(menuOption.dataset.move);
            elements.movesMenu.style.display = 'none';
            playerAttack(moveIndex);
        }
    });

    // バトルログのイベントリスナー
    if (elements.logToggle) {
        elements.logToggle.addEventListener('click', toggleBattleLog);
    }

    if (elements.logClose) {
        elements.logClose.addEventListener('click', toggleBattleLog);
    }

    // 初期メッセージ表示後即座にバトル開始
    showMessage("やせいの フシギダネが とびだしてきた！", () => {
        playerTurn();
    });
});