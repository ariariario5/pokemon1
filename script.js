// 新しいメインスクリプト - Original Pokemon Battle System v4.0

// サウンドシステム（既存から継承）
let audioContext;
let masterVolume = 0.3;
let bgmIsPlaying = false;
let bgmInterval;

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

// サウンドエフェクト関数
function playAttackSound() {
    playSound(300, 0.2, 'square');
}

function playDamageSound() {
    playSound(150, 0.3, 'sawtooth');
}

function playMenuSound() {
    playSound(800, 0.1, 'square');
}

function playVictorySound() {
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

// BGM
function playBattleBGM() {
    if (bgmIsPlaying || !audioContext) return;
    bgmIsPlaying = true;

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

// アニメーション関数
function playAttackAnimation(isPlayer, callback) {
    const sprite = isPlayer ?
        document.getElementById('player-sprite-img') :
        document.getElementById('enemy-sprite-img');

    if (!sprite) return callback?.();

    sprite.classList.add('shake');
    playAttackSound();

    setTimeout(() => {
        sprite.classList.remove('shake');
        callback?.();
    }, 500);
}

function playDamageAnimation(isPlayer, damage, callback) {
    const sprite = isPlayer ?
        document.getElementById('player-sprite-img') :
        document.getElementById('enemy-sprite-img');
    const gameContainer = document.querySelector('.game-container');

    if (!sprite) return callback?.();

    sprite.classList.add('flash');
    gameContainer?.classList.add('screen-shake');
    playDamageSound();

    // 画面振動を停止
    setTimeout(() => {
        gameContainer?.classList.remove('screen-shake');
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
        callback?.();
    }, 1000);
}

function showLevelUpAnimation(pokemon, levelUpData, callback) {
    playLevelUpSound();

    const sprite = pokemon === battleManager.getActivePlayerPokemon() ?
        document.querySelector('.player-sprite') :
        document.querySelector('.enemy-sprite');

    if (sprite) {
        sprite.classList.add('level-up-jump');
        setTimeout(() => {
            sprite.classList.remove('level-up-jump');
        }, 1000);
    }

    // レベルアップメッセージ表示
    uiManager.showMessage(`${pokemon.name}は レベル${pokemon.level}に あがった！`, () => {
        uiManager.showMessage(`HP が ${levelUpData.hpGain} あがった！`, () => {
            uiManager.showMessage(`ステータスが あがった！`, callback);
        });
    });
}

// メインゲームループ
class Game {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('Initializing Pokemon Battle Game v4.0...');

        // データ読み込み
        const dataLoaded = await gameData.loadAllData();
        if (!dataLoaded) {
            console.error('Failed to load game data');
            return false;
        }

        // オーディオ初期化
        initAudio();

        // UI初期化
        uiManager.initialize();

        // テスト用のバトル開始
        const playerParty = ['mon004', 'mon001', 'mon007']; // ヒトカゲ、フシギダネ、ゼニガメ
        const enemyParty = ['mon001', 'mon016', 'mon019']; // フシギダネ、ポッポ、コラッタ

        battleManager.initializeBattle(playerParty, enemyParty);
        uiManager.initializeBattle();

        this.setupAudioControls();

        this.initialized = true;
        console.log('Game initialized successfully');

        // 初期メッセージ
        uiManager.showMessage("やせいの フシギダネが とびだしてきた！", () => {
            uiManager.showMessage(`いけ！ ${battleManager.getActivePlayerPokemon().name}！`, () => {
                uiManager.showMainMenu();
            });
        });

        return true;
    }

    setupAudioControls() {
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
    }
}

// グローバル関数（UIManagerから呼び出される）
window.playMenuSound = playMenuSound;
window.playAttackSound = playAttackSound;
window.playDamageSound = playDamageSound;
window.playVictorySound = playVictorySound;
window.playDefeatSound = playDefeatSound;
window.playLevelUpSound = playLevelUpSound;
window.playAttackAnimation = playAttackAnimation;
window.playDamageAnimation = playDamageAnimation;
window.showLevelUpAnimation = showLevelUpAnimation;

// ゲーム開始
const game = new Game();

// DOM読み込み完了後にゲーム初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting game initialization...');
    await game.initialize();
});