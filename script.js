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

// ゲーム状態（拡張版）
let gameState = {
    player: {
        pokemon: { ...pokemonData.hitokage },
        currentHp: 20,
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
        currentHp: 22,
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
    playerHp: document.getElementById('player-hp'),
    enemyHp: document.getElementById('enemy-hp'),
    playerCurrentHp: document.getElementById('player-current-hp'),
    playerMaxHp: document.getElementById('player-max-hp'),
    battleMessage: document.getElementById('battle-message'),
    mainMenu: document.getElementById('main-menu'),
    movesMenu: document.getElementById('moves-menu'),
    playerSprite: document.getElementById('player-sprite-img'),
    enemySprite: document.getElementById('enemy-sprite-img')
};

// 初期表示更新
function initializeDisplay() {
    elements.playerName.textContent = gameState.player.pokemon.name;
    elements.enemyName.textContent = gameState.enemy.pokemon.name;
    elements.playerCurrentHp.textContent = gameState.player.currentHp;
    elements.playerMaxHp.textContent = gameState.player.pokemon.hp;
    updateHpBars();

    // すべてを表示状態にして即座にゲーム開始
    const enemySprite = document.querySelector('.enemy-sprite');
    const playerSprite = document.querySelector('.player-sprite');
    const enemyPokemon = document.querySelector('.enemy-pokemon');
    const playerPokemon = document.querySelector('.player-pokemon');

    if (enemySprite) enemySprite.style.opacity = '1';
    if (playerSprite) playerSprite.style.opacity = '1';
    if (enemyPokemon) enemyPokemon.style.opacity = '1';
    if (playerPokemon) playerPokemon.style.opacity = '1';
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

// ダメージ計算（物理/特殊分け）
function calculateDamage(attacker, attackerData, defender, defenderData, move) {
    if (move.power === 0) return 0;

    // 命中判定
    if (Math.random() * 100 > move.accuracy) {
        return -1; // 外れ
    }

    let attackStat, defenseStat;

    if (move.category === 'physical') {
        attackStat = getEffectiveStat(attacker.pokemon, 'attack', attacker.statStages);
        defenseStat = getEffectiveStat(defender.pokemon, 'defense', defender.statStages);
    } else if (move.category === 'special') {
        attackStat = getEffectiveStat(attacker.pokemon, 'spAttack', attacker.statStages);
        defenseStat = getEffectiveStat(defender.pokemon, 'spDefense', defender.statStages);
    } else {
        return 0; // ステータス技
    }

    // やけど状態は物理攻撃力半減
    if (attacker.statusCondition === 'burn' && move.category === 'physical') {
        attackStat = Math.floor(attackStat / 2);
    }

    const baseDamage = Math.floor(
        ((2 * 5 + 10) / 250) * (attackStat / defenseStat) * move.power + 2
    );

    // ランダム要素 (85-100%)
    const randomFactor = (Math.random() * 0.15 + 0.85);

    return Math.max(1, Math.floor(baseDamage * randomFactor));
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
            const damage = calculateDamage(attacker, attacker, defender, defender, move);

            if (damage === -1) {
                showMessage(`${attacker.pokemon.name}の こうげきは はずれた！`, callback);
                return;
            }

            defender.currentHp = Math.max(0, defender.currentHp - damage);
            updateHpBars();

            // 追加効果判定
            let statusApplied = false;
            if (move.effect && move.effectChance) {
                statusApplied = applyStatusEffect(defender, move.effect, move.effectChance);
            }

            playDamageAnimation(defender === gameState.player, damage, () => {
                if (defender.currentHp <= 0) {
                    if (defender === gameState.enemy) {
                        showMessage(`てきの ${defender.pokemon.name}は たおれた！`, () => {
                            playVictorySound();
                            showMessage("しょうぶに かった！", () => {
                                resetBattle();
                            });
                        });
                    } else {
                        showMessage(`${defender.pokemon.name}は たおれた！`, () => {
                            playDefeatSound();
                            showMessage("しょうぶに まけた...", () => {
                                resetBattle();
                            });
                        });
                    }
                } else if (statusApplied) {
                    const statusMsg = move.effect === 'burn' ? `${defender.pokemon.name}は やけどを おった！` :
                                     move.effect === 'poison' ? `${defender.pokemon.name}は どく状態になった！` : '';
                    showMessage(statusMsg, callback);
                } else {
                    callback();
                }
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

    // 初期メッセージ表示後即座にバトル開始
    showMessage("やせいの フシギダネが とびだしてきた！", () => {
        playerTurn();
    });
});