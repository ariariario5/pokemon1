// ====== ポケモンバトルシステム完全版 ======

// ゲーム状態管理
let currentScene = 'title';
let dialogIndex = 0;
let gameState = {
  player: null,
  enemy: null,
  currentMenu: 'main',
  battlePhase: 'select',
  sfxEnabled: true,
  bgmEnabled: false
};

// ポケモンデータベース
const pokemonData = {
  bulbasaur: {
    name: 'フシギダネ',
    type1: 'grass',
    type2: 'poison',
    baseStats: { hp: 45, attack: 49, defense: 49, speed: 45 },
    moves: ['tackle', 'vineWhip', 'growl', 'leechSeed'],
    color: '#78C850'
  },
  charmander: {
    name: 'ヒトカゲ',
    type1: 'fire',
    type2: null,
    baseStats: { hp: 39, attack: 52, defense: 43, speed: 65 },
    moves: ['tackle', 'ember', 'growl', 'scratch'],
    color: '#F08030'
  },
  squirtle: {
    name: 'ゼニガメ',
    type1: 'water',
    type2: null,
    baseStats: { hp: 44, attack: 48, defense: 65, speed: 43 },
    moves: ['tackle', 'bubble', 'tailWhip', 'withdraw'],
    color: '#6890F0'
  }
};

// 技データベース
const moveData = {
  tackle: { name: 'たいあたり', type: 'normal', power: 40, accuracy: 100, pp: 35 },
  ember: { name: 'ひのこ', type: 'fire', power: 40, accuracy: 100, pp: 25 },
  bubble: { name: 'あわ', type: 'water', power: 40, accuracy: 100, pp: 30 },
  vineWhip: { name: 'つるのムチ', type: 'grass', power: 45, accuracy: 100, pp: 25 },
  scratch: { name: 'ひっかく', type: 'normal', power: 40, accuracy: 100, pp: 35 },
  growl: { name: 'なきごえ', type: 'normal', power: 0, accuracy: 100, pp: 40 },
  tailWhip: { name: 'しっぽをふる', type: 'normal', power: 0, accuracy: 100, pp: 30 },
  leechSeed: { name: 'やどりぎのタネ', type: 'grass', power: 0, accuracy: 90, pp: 10 },
  withdraw: { name: 'からにこもる', type: 'water', power: 0, accuracy: 100, pp: 40 }
};

// タイプ相性
const typeChart = {
  fire: { grass: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5, water: 0.5 },
  grass: { water: 2, fire: 0.5, grass: 0.5 },
  normal: {}
};

// 導入メッセージ
const introMessages = [
  'ポケモンの世界へようこそ！',
  'きみは新人トレーナーだ。',
  'さあ、最初のポケモンを選んで冒険を始めよう！',
  'やせいのポケモンが現れた！'
];

// ====== ポケモンクラス ======
class Pokemon {
  constructor(data, level = 5) {
    this.name = data.name;
    this.type1 = data.type1;
    this.type2 = data.type2;
    this.level = level;
    this.color = data.color;

    // ステータス計算
    this.maxHP = Math.floor((data.baseStats.hp * 2 * level / 100) + level + 10);
    this.currentHP = this.maxHP;
    this.attack = Math.floor((data.baseStats.attack * 2 * level / 100) + 5);
    this.defense = Math.floor((data.baseStats.defense * 2 * level / 100) + 5);
    this.speed = Math.floor((data.baseStats.speed * 2 * level / 100) + 5);

    // 技とPP
    this.moves = data.moves.slice(0, 4);
    this.movePP = {};
    this.moves.forEach(move => {
      this.movePP[move] = moveData[move].pp;
    });

    this.experience = Math.floor(Math.random() * 100);
  }

  takeDamage(damage) {
    this.currentHP = Math.max(0, this.currentHP - damage);
    return this.currentHP === 0;
  }

  useMove(moveId) {
    if (this.movePP[moveId] > 0) {
      this.movePP[moveId]--;
      return moveData[moveId];
    }
    return null;
  }

  canUseMove(moveId) {
    return this.movePP[moveId] > 0;
  }
}

// ====== ユーティリティ関数 ======
function $(id) {
  return document.getElementById(id);
}

function show(elementId) {
  const element = $(elementId);
  if (element) element.classList.remove('hidden');
}

function hide(elementId) {
  const element = $(elementId);
  if (element) element.classList.add('hidden');
}

function switchScene(sceneName) {
  // 全シーンを隠す
  hide('title-screen');
  hide('intro-screen');
  hide('battle-screen');

  // 指定シーンを表示
  show(sceneName + '-screen');
  currentScene = sceneName;

  // シーン固有の初期化
  if (sceneName === 'intro') {
    dialogIndex = 0;
    showDialog();
  } else if (sceneName === 'battle') {
    initializeBattle();
  }
}

function showDialog() {
  if (dialogIndex < introMessages.length) {
    typeText($('dialog-text'), introMessages[dialogIndex]);
  } else {
    switchScene('battle');
  }
}

function typeText(element, text, speed = 50) {
  if (!element) return;
  element.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(timer);
    }
  }, speed);
}

// ====== ポケモンスプライト生成 ======
function createPokemonSprite(pokemon, isPlayer = false) {
  const svg = `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad${isPlayer ? 'Player' : 'Enemy'}" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${pokemon.color}" stop-opacity="1"/>
          <stop offset="70%" stop-color="${pokemon.color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${pokemon.color}" stop-opacity="0.6"/>
        </radialGradient>
        <filter id="shadow${isPlayer ? 'Player' : 'Enemy'}">
          <feDropShadow dx="3" dy="6" stdDeviation="4" flood-opacity="0.4"/>
        </filter>
      </defs>
      <ellipse cx="75" cy="130" rx="40" ry="15" fill="rgba(0,0,0,0.2)"/>
      <circle cx="75" cy="75" r="45" fill="url(#grad${isPlayer ? 'Player' : 'Enemy'})" filter="url(#shadow${isPlayer ? 'Player' : 'Enemy'})"/>
      <circle cx="60" cy="65" r="6" fill="#000"/>
      <circle cx="90" cy="65" r="6" fill="#000"/>
      <circle cx="62" cy="63" r="2" fill="#fff"/>
      <circle cx="92" cy="63" r="2" fill="#fff"/>
      <ellipse cx="75" cy="85" rx="10" ry="6" fill="rgba(0,0,0,0.3)"/>
      ${pokemon.type1 === 'grass' ? '<rect x="65" y="45" width="20" height="8" rx="4" fill="#2E7D32"/>' : ''}
      ${pokemon.type1 === 'fire' ? '<polygon points="75,40 80,50 70,50" fill="#D84315"/>' : ''}
      ${pokemon.type1 === 'water' ? '<circle cx="75" cy="50" r="8" fill="#1565C0" opacity="0.7"/>' : ''}
    </svg>
  `;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ====== バトルシステム ======
function initializeBattle() {
  // ポケモン初期化
  gameState.player = new Pokemon(pokemonData.charmander);
  gameState.enemy = new Pokemon(pokemonData.bulbasaur);

  // スプライト設定
  const playerSprite = $('player-sprite');
  const enemySprite = $('enemy-sprite');
  
  if (playerSprite) playerSprite.src = createPokemonSprite(gameState.player, true);
  if (enemySprite) enemySprite.src = createPokemonSprite(gameState.enemy, false);

  updateUI();
  logMessage(`やせいの ${gameState.enemy.name} が とびだしてきた！`);
  logMessage(`いけ！ ${gameState.player.name}！`);
}

function updateUI() {
  // プレイヤー情報更新
  const playerName = $('player-name');
  const playerLevel = $('player-level');
  const playerHPCurrent = $('player-hp-current');
  const playerHPMax = $('player-hp-max');
  
  if (playerName) playerName.textContent = gameState.player.name;
  if (playerLevel) playerLevel.textContent = gameState.player.level;
  if (playerHPCurrent) playerHPCurrent.textContent = gameState.player.currentHP;
  if (playerHPMax) playerHPMax.textContent = gameState.player.maxHP;

  // 敵情報更新
  const enemyName = $('enemy-name');
  const enemyLevel = $('enemy-level');
  const enemyHPCurrent = $('enemy-hp-current');
  const enemyHPMax = $('enemy-hp-max');
  
  if (enemyName) enemyName.textContent = gameState.enemy.name;
  if (enemyLevel) enemyLevel.textContent = gameState.enemy.level;
  if (enemyHPCurrent) enemyHPCurrent.textContent = gameState.enemy.currentHP;
  if (enemyHPMax) enemyHPMax.textContent = gameState.enemy.maxHP;

  // HPバー更新
  updateHPBar('player', gameState.player);
  updateHPBar('enemy', gameState.enemy);

  // EXPバー更新
  const expBar = $('exp-bar');
  if (expBar) expBar.style.width = `${gameState.player.experience}%`;

  // 技メニュー更新
  updateMovesMenu();
}

function updateHPBar(type, pokemon) {
  const hpBar = $(type + '-hp-bar');
  if (!hpBar) return;
  
  const hpPercentage = (pokemon.currentHP / pokemon.maxHP) * 100;

  hpBar.style.width = `${hpPercentage}%`;
  hpBar.className = 'hp-bar';

  if (hpPercentage <= 20) {
    hpBar.classList.add('critical');
  } else if (hpPercentage <= 50) {
    hpBar.classList.add('low');
  }
}

function updateMovesMenu() {
  const moveButtons = document.querySelectorAll('.move-btn');

  gameState.player.moves.forEach((moveId, index) => {
    if (moveButtons[index]) {
      const move = moveData[moveId];
      const currentPP = gameState.player.movePP[moveId];
      const maxPP = move.pp;

      moveButtons[index].innerHTML = `${move.name}<span class="pp">${currentPP}/${maxPP}</span>`;
      moveButtons[index].dataset.move = moveId;
      moveButtons[index].disabled = currentPP === 0;
    }
  });
}

function logMessage(message) {
  const log = $('battle-log');
  if (!log) return;
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function calculateDamage(attacker, defender, move) {
  if (move.power === 0) return 0;

  const level = attacker.level;
  const attack = attacker.attack;
  const defense = defender.defense;
  const power = move.power;

  // 基本ダメージ計算
  let damage = Math.floor(((2 * level / 5 + 2) * power * attack / defense / 50 + 2));

  // タイプ相性
  const effectiveness = getTypeEffectiveness(move.type, defender.type1, defender.type2);
  damage = Math.floor(damage * effectiveness);

  // 乱数（85-100%）
  damage = Math.floor(damage * (Math.random() * 0.15 + 0.85));

  // タイプ一致ボーナス
  if (attacker.type1 === move.type || attacker.type2 === move.type) {
    damage = Math.floor(damage * 1.5);
  }

  return Math.max(1, damage);
}

function getTypeEffectiveness(moveType, defenderType1, defenderType2) {
  let effectiveness = 1;

  if (typeChart[moveType] && typeChart[moveType][defenderType1]) {
    effectiveness *= typeChart[moveType][defenderType1];
  }

  if (defenderType2 && typeChart[moveType] && typeChart[moveType][defenderType2]) {
    effectiveness *= typeChart[moveType][defenderType2];
  }

  return effectiveness;
}

function showEffectiveness(effectiveness) {
  const effectDiv = $('effectiveness');
  if (!effectDiv) return;

  if (effectiveness > 1) {
    effectDiv.textContent = 'こうかは ばつぐんだ！';
    effectDiv.className = 'effectiveness super-effective';
  } else if (effectiveness < 1 && effectiveness > 0) {
    effectDiv.textContent = 'こうかは いまひとつのようだ...';
    effectDiv.className = 'effectiveness not-very-effective';
  } else if (effectiveness === 0) {
    effectDiv.textContent = 'こうかが ないようだ...';
    effectDiv.className = 'effectiveness no-effect';
  }

  effectDiv.classList.remove('hidden');
  setTimeout(() => {
    effectDiv.classList.add('hidden');
  }, 2000);
}

async function executeMove(attacker, defender, moveId) {
  const move = attacker.useMove(moveId);
  if (!move) {
    logMessage(`${attacker.name} の ${moveData[moveId].name} は PPが たりない！`);
    return;
  }

  playSound('select');
  logMessage(`${attacker.name} の ${move.name}！`);

  // アニメーション
  const attackerSprite = attacker === gameState.player ? $('player-sprite') : $('enemy-sprite');
  const defenderSprite = attacker === gameState.player ? $('enemy-sprite') : $('player-sprite');

  if (attackerSprite) {
    attackerSprite.classList.add('attack-animation');
    setTimeout(() => attackerSprite.classList.remove('attack-animation'), 600);
  }

  await sleep(400);

  if (move.power > 0) {
    const damage = calculateDamage(attacker, defender, move);
    const effectiveness = getTypeEffectiveness(move.type, defender.type1, defender.type2);

    playSound('attack');
    if (defenderSprite) {
      defenderSprite.classList.add('damage-animation');
      setTimeout(() => defenderSprite.classList.remove('damage-animation'), 400);
    }

    const fainted = defender.takeDamage(damage);
    updateUI();

    logMessage(`${defender.name} に ${damage} ダメージ！`);

    if (effectiveness !== 1) {
      showEffectiveness(effectiveness);
      await sleep(1000);
    }

    if (fainted) {
      logMessage(`${defender.name} は たおれた！`);
      if (defender === gameState.enemy) {
        logMessage('プレイヤーの勝利！');
        gameState.player.experience = Math.min(100, gameState.player.experience + 25);
        updateUI();
      } else {
        logMessage('プレイヤーの敗北...');
      }
      return;
    }
  } else {
    // 補助技の処理
    logMessage(`${defender.name} の能力が変化した！`);
  }
}

async function enemyTurn() {
  const availableMoves = gameState.enemy.moves.filter(move => gameState.enemy.canUseMove(move));
  if (availableMoves.length === 0) {
    logMessage(`${gameState.enemy.name} は 使える技がない！`);
    return;
  }

  const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  await executeMove(gameState.enemy, gameState.player, selectedMove);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ====== 音声システム ======
function playSound(type) {
  if (!gameState.sfxEnabled) return;

  const soundMap = {
    select: 'sound-select',
    attack: 'sound-attack',
    damage: 'sound-damage'
  };

  const audio = $(soundMap[type]);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {}); // エラーを無視
  }
}

function toggleBGM() {
  const bgm = $('background-music');
  const btn = $('bgm-btn');
  if (!bgm || !btn) return;

  if (gameState.bgmEnabled) {
    bgm.pause();
    btn.textContent = 'BGM ▶';
    gameState.bgmEnabled = false;
  } else {
    bgm.play().catch(() => {});
    btn.textContent = 'BGM ⏸';
    gameState.bgmEnabled = true;
  }
}

function toggleSFX() {
  const btn = $('sfx-btn');
  if (!btn) return;
  
  gameState.sfxEnabled = !gameState.sfxEnabled;
  btn.textContent = gameState.sfxEnabled ? 'SFX ⏸' : 'SFX ▶';
}

// ====== イベントリスナー ======
document.addEventListener('DOMContentLoaded', () => {
  // タイトル画面
  const startBtn = $('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      playSound('select');
      switchScene('intro');
    });
  }

  // 導入画面
  const continueBtn = $('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      playSound('select');
      dialogIndex++;
      if (dialogIndex >= introMessages.length) {
        switchScene('battle');
      } else {
        showDialog();
      }
    });
  }

  // 音声コントロール
  const bgmBtn = $('bgm-btn');
  const sfxBtn = $('sfx-btn');
  
  if (bgmBtn) bgmBtn.addEventListener('click', toggleBGM);
  if (sfxBtn) sfxBtn.addEventListener('click', toggleSFX);

  const volumeSlider = $('volume');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value;
      const bgm = $('background-music');
      if (bgm) bgm.volume = volume;
      
      document.querySelectorAll('audio:not(#background-music)').forEach(audio => {
        audio.volume = volume;
      });
    });
  }

  // バトルメニュー
  document.addEventListener('click', async (e) => {
    if (currentScene !== 'battle') return;

    // メインメニュー
    if (e.target.classList.contains('menu-btn')) {
      const action = e.target.dataset.action;
      playSound('select');

      if (action === 'fight') {
        hide('main-menu');
        show('moves-menu');
        gameState.currentMenu = 'moves';
      } else if (action === 'pokemon') {
        logMessage('他に戦えるポケモン がいない！');
      } else if (action === 'bag') {
        logMessage('道具を持っていない！');
      } else if (action === 'run') {
        logMessage('うまく逃げられた！');
      }
    }

    // 技選択
    else if (e.target.classList.contains('move-btn') && !e.target.disabled) {
      const moveId = e.target.dataset.move;
      playSound('select');

      show('main-menu');
      hide('moves-menu');
      gameState.currentMenu = 'main';

      // プレイヤーターン
      await executeMove(gameState.player, gameState.enemy, moveId);

      // バトル継続チェック
      if (gameState.enemy.currentHP > 0 && gameState.player.currentHP > 0) {
        await sleep(1000);
        await enemyTurn();
      }
    }

    // 戻るボタン
    else if (e.target.id === 'back-btn') {
      playSound('select');
      show('main-menu');
      hide('moves-menu');
      gameState.currentMenu = 'main';
    }
  });

  // キーボードサポート
  document.addEventListener('keydown', (e) => {
    if (currentScene === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      const startBtn = $('start-btn');
      if (startBtn) startBtn.click();
    } else if (currentScene === 'intro' && (e.key === 'Enter' || e.key === ' ')) {
      const continueBtn = $('continue-btn');
      if (continueBtn) continueBtn.click();
    } else if (currentScene === 'battle') {
      if (gameState.currentMenu === 'main') {
        const actions = ['fight', 'pokemon', 'bag', 'run'];
        const key = parseInt(e.key);
        if (key >= 1 && key <= 4) {
          const btn = document.querySelector(`[data-action="${actions[key-1]}"]`);
          if (btn) btn.click();
        }
      } else if (gameState.currentMenu === 'moves') {
        const key = parseInt(e.key);
        if (key >= 1 && key <= 4) {
          const moveBtn = document.querySelectorAll('.move-btn')[key - 1];
          if (moveBtn && !moveBtn.disabled) moveBtn.click();
        } else if (e.key === 'Escape') {
          const backBtn = $('back-btn');
          if (backBtn) backBtn.click();
        }
      }
    }
  });

  // 初期音量設定
  const volumeSlider = $('volume');
  if (volumeSlider) {
    const volume = volumeSlider.value;
    document.querySelectorAll('audio').forEach(audio => {
      audio.volume = volume;
    });
  }
});
