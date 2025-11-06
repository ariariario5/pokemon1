// ポケモンデータ
const pokemonData = {
    hitokage: {
        name: "ヒトカゲ",
        type: "ほのお",
        hp: 20,
        attack: 12,
        defense: 8,
        moves: [
            { name: "ひのこ", power: 8, type: "ほのお", pp: 25 },
            { name: "たいあたり", power: 6, type: "ノーマル", pp: 35 },
            { name: "ひっかく", power: 7, type: "ノーマル", pp: 35 },
            { name: "なきごえ", power: 0, type: "ノーマル", pp: 40, effect: "defense-down" }
        ]
    },
    fushigidane: {
        name: "フシギダネ",
        type: "くさ",
        hp: 22,
        attack: 10,
        defense: 10,
        moves: [
            { name: "はっぱカッター", power: 9, type: "くさ", pp: 25 },
            { name: "たいあたり", power: 6, type: "ノーマル", pp: 35 },
            { name: "つるのムチ", power: 8, type: "くさ", pp: 25 },
            { name: "なきごえ", power: 0, type: "ノーマル", pp: 40, effect: "defense-down" }
        ]
    }
};

// ゲーム状態
let gameState = {
    player: {
        pokemon: { ...pokemonData.hitokage },
        currentHp: 20
    },
    enemy: {
        pokemon: { ...pokemonData.fushigidane },
        currentHp: 22
    },
    turn: "player",
    battlePhase: "menu", // menu, move-select, battle, message
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

// ダメージ計算
function calculateDamage(attacker, defender, move) {
    if (move.power === 0) return 0;

    const baseDamage = Math.floor(
        ((2 * 5 + 10) / 250) * (attacker.attack / defender.defense) * move.power + 2
    );

    // ランダム要素 (85-100%)
    const randomFactor = (Math.random() * 0.15 + 0.85);

    return Math.max(1, Math.floor(baseDamage * randomFactor));
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
    gameState.battlePhase = "battle";

    showMessage(`${gameState.player.pokemon.name}の ${move.name}！`, () => {
        playAttackAnimation(true, () => {
            if (move.power > 0) {
                const damage = calculateDamage(
                    gameState.player.pokemon,
                    gameState.enemy.pokemon,
                    move
                );

                gameState.enemy.currentHp = Math.max(0, gameState.enemy.currentHp - damage);
                updateHpBars();

                playDamageAnimation(false, damage, () => {
                    if (gameState.enemy.currentHp <= 0) {
                        showMessage(`てきの ${gameState.enemy.pokemon.name}は たおれた！`, () => {
                            playVictorySound(); // 勝利音を追加
                            showMessage("しょうぶに かった！", () => {
                                resetBattle();
                            });
                        });
                    } else {
                        enemyTurn();
                    }
                });
            } else if (move.effect === "defense-down") {
                gameState.enemy.pokemon.defense = Math.max(1, gameState.enemy.pokemon.defense - 1);
                showMessage(`てきの ${gameState.enemy.pokemon.name}の ぼうぎょが さがった！`, () => {
                    enemyTurn();
                });
            }
        });
    });
}

// 敵のターン
function enemyTurn() {
    const availableMoves = gameState.enemy.pokemon.moves.filter(move => move.pp > 0);
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];

    setTimeout(() => {
        showMessage(`てきの ${gameState.enemy.pokemon.name}の ${randomMove.name}！`, () => {
            playAttackAnimation(false, () => {
                if (randomMove.power > 0) {
                    const damage = calculateDamage(
                        gameState.enemy.pokemon,
                        gameState.player.pokemon,
                        randomMove
                    );

                    gameState.player.currentHp = Math.max(0, gameState.player.currentHp - damage);
                    updateHpBars();

                    playDamageAnimation(true, damage, () => {
                        if (gameState.player.currentHp <= 0) {
                            showMessage(`${gameState.player.pokemon.name}は たおれた！`, () => {
                                playDefeatSound(); // 敗北音を追加
                                showMessage("しょうぶに まけた...", () => {
                                    resetBattle();
                                });
                            });
                        } else {
                            playerTurn();
                        }
                    });
                } else if (randomMove.effect === "defense-down") {
                    gameState.player.pokemon.defense = Math.max(1, gameState.player.pokemon.defense - 1);
                    showMessage(`${gameState.player.pokemon.name}の ぼうぎょが さがった！`, () => {
                        playerTurn();
                    });
                }
            });
        });
    }, 1000);
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
    gameState.player.pokemon.defense = pokemonData.hitokage.defense;
    gameState.enemy.pokemon.defense = pokemonData.fushigidane.defense;

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
        if (e.target.classList.contains('menu-option')) {
            playMenuSound(); // メニュー音を追加
            const moveIndex = Array.from(elements.movesMenu.children).indexOf(e.target);
            elements.movesMenu.style.display = 'none';
            playerAttack(moveIndex);
        }
    });

    // 初期メッセージ表示後即座にバトル開始
    showMessage("やせいの フシギダネが とびだしてきた！", () => {
        playerTurn();
    });
});