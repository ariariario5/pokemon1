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
      baseStats: { hp: 45, attack: 49, defense: 49,
  speed: 45 },
      moves: ['tackle', 'vineWhip', 'growl',
  'leechSeed'],
      color: '#78C850'
    },
    charmander: {
      name: 'ヒトカゲ',
      type1: 'fire',
      type2: null,
      baseStats: { hp: 39, attack: 52, defense: 43,
  speed: 65 },
      moves: ['tackle', 'ember', 'growl', 'scratch'],
      color: '#F08030'
    },
    squirtle: {
      name: 'ゼニガメ',
      type1: 'water',
      type2: null,
      baseStats: { hp: 44, attack: 48, defense: 65,
  speed: 43 },
      moves: ['tackle', 'bubble', 'tailWhip',
  'withdraw'],
      color: '#6890F0'
    }
  };

  // 技データベース
  const moveData = {
    tackle: { name: 'たいあたり', type: 'normal', power:
   40, accuracy: 100, pp: 35 },
    ember: { name: 'ひのこ', type: 'fire', power: 40,
  accuracy: 100, pp: 25 },
    bubble: { name: 'あわ', type: 'water', power: 40,
  accuracy: 100, pp: 30 },
    vineWhip: { name: 'つるのムチ', type: 'grass',
  power: 45, accuracy: 100, pp: 25 },
    scratch: { name: 'ひっかく', type: 'normal', power:
  40, accuracy: 100, pp: 35 },
    growl: { name: 'なきごえ', type: 'normal', power: 0,
   accuracy: 100, pp: 40 },
    tailWhip: { name: 'しっぽをふる', type: 'normal',
  power: 0, accuracy: 100, pp: 30 },
    leechSeed: { name: 'やどりぎのタネ', type: 'grass',
  power: 0, accuracy: 90, pp: 10 },
    withdraw: { name: 'からにこもる', type: 'water',
  power: 0, accuracy: 100, pp: 40 }
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
      this.maxHP = Math.floor((data.baseStats.hp * 2 *
  level / 100) + level + 10);
      this.currentHP = this.maxHP;
      this.attack = Math.floor((data.baseStats.attack *
  2 * level / 100) + 5);
      this.defense = Math.floor((data.baseStats.defense
  * 2 * level / 100) + 5);
      this.speed = Math.floor((data.baseStats.speed * 2
  * level / 100) + 5);

      // 技とPP
      this.moves = data.moves.slice(0, 4);
      this.movePP = {};
      this.moves.forEach(move => {
        this.movePP[move] = moveData[move].pp;
      });

      this.experience = Math.floor(Math.random() * 100);
    }

    takeDamage(damage) {
      this.currentHP = Math.max(0, this.currentHP -
  damage);
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
    $(elementId).classList.remove('hidden');
  }

  function hide(elementId) {
    $(elementId).classList.add('hidden');
  }

  function switchScene(sceneName) {
    // 全シーンを隠す
    $('title-screen').classList.add('hidden');
    $('intro-screen').classList.add('hidden');
    $('battle-screen').classList.add('hidden');

    // 指定シーンを表示
    $(sceneName + '-screen').classList.remove('hidden');
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
      typeText($('dialog-text'),
  introMessages[dialogIndex]);
    } else {
      switchScene('battle');
    }
  }

  function typeText(element, text, speed = 50) {
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
  function createPokemonSprite(pokemon, isPlayer =
  false) {
    const svg = `
      <svg width="150" height="150" viewBox="0 0 150
  150">
        <defs>
          <radialGradient id="grad${isPlayer ? 'Player'
  : 'Enemy'}" cx="50%" cy="30%" r="70%">
            <stop offset="0%"
  stop-color="${pokemon.color}" stop-opacity="1"/>
            <stop offset="70%"
  stop-color="${pokemon.color}" stop-opacity="0.8"/>
            <stop offset="100%"
  stop-color="${pokemon.color}" stop-opacity="0.6"/>
          </radialGradient>
          <filter id="shadow${isPlayer ? 'Player' :
  'Enemy'}">
            <feDropShadow dx="3" dy="6" stdDeviation="4"
   flood-opacity="0.4"/>
          </filter>
        </defs>
        <!-- 影 -->
        <ellipse cx="75" cy="130" rx="40" ry="15"
  fill="rgba(0,0,0,0.2)"/>
        <!-- 体 -->
        <circle cx="75" cy="75" r="45"
  fill="url(#grad${isPlayer ? 'Player' : 'Enemy'})"
  filter="url(#shadow${isPlayer ? 'Player' :
  'Enemy'})"/>
        <!-- 目 -->
        <circle cx="60" cy="65" r="6" fill="#000"/>
        <circle cx="90" cy="65" r="6" fill="#000"/>
        <circle cx="62" cy="63" r="2" fill="#fff"/>
        <circle cx="92" cy="63" r="2" fill="#fff"/>
        <!-- 口 -->
        <ellipse cx="75" cy="85" rx="10" ry="6"
  fill="rgba(0,0,0,0.3)"/>
        <!-- 模様（タイプに応じて） -->
        ${pokemon.type1 === 'grass' ? '<rect x="65"
  y="45" width="20" height="8" rx="4" fill="#2E7D32"/>'
  : ''}
        ${pokemon.type1 === 'fire' ? '<polygon
  points="75,40 80,50 70,50" fill="#D84315"/>' : ''}
        ${pokemon.type1 === 'water' ? '<circle cx="75"
  cy="50" r="8" fill="#1565C0" opacity="0.7"/>' : ''}
      </svg>
    `;

    return 'data:image/svg+xml;base64,' +
  btoa(unescape(encodeURIComponent(svg)));
  }

  // ====== バトルシステム ======
  function initializeBattle() {
    // ポケモン初期化
    gameState.player = new
  Pokemon(pokemonData.charmander);
    gameState.enemy = new
  Pokemon(pokemonData.bulbasaur);

    // スプライト設定
    $('player-sprite').src =
  createPokemonSprite(gameState.player, true);
    $('enemy-sprite').src =
  createPokemonSprite(gameState.enemy, false);

    updateUI();
    logMessage(`やせいの ${gameState.enemy.name} が
  とびだしてきた！`);
    logMessage(`いけ！ ${gameState.player.name}！`);
  }

  function updateUI() {
    // プレイヤー情報更新
    $('player-name').textContent =
  gameState.player.name;
    $('player-level').textContent =
  gameState.player.level;
    $('player-hp-current').textContent =
  gameState.player.currentHP;
    $('player-hp-max').textContent =
  gameState.player.maxHP;

    // 敵情報更新
    $('enemy-name').textContent = gameState.enemy.name;
    $('enemy-level').textContent =
  gameState.enemy.level;
    $('enemy-hp-current').textContent =
  gameState.enemy.currentHP;
    $('enemy-hp-max').textContent =
  gameState.enemy.maxHP;

    // HPバー更新
    updateHPBar('player', gameState.player);
    updateHPBar('enemy', gameState.enemy);

    // EXPバー更新
    $('exp-bar').style.width =
  `${gameState.player.experience}%`;

    // 技メニュー更新
    updateMovesMenu();
  }

  function updateHPBar(type, pokemon) {
    const hpBar = $(type + '-hp-bar');
    const hpPercentage = (pokemon.currentHP /
  pokemon.maxHP) * 100;

    hpBar.style.width = `${hpPercentage}%`;
    hpBar.className = 'hp-bar';

    if (hpPercentage <= 20) {
      hpBar.classList.add('critical');
    } else if (hpPercentage <= 50) {
      hpBar.classList.add('low');
    }
  }

  function updateMovesMenu() {
    const moveButtons =
  document.querySelectorAll('.move-btn');
    gameState.player.moves.forEach((moveId, index) => {
      if (moveButtons[index]) {
        const move = moveData[moveId];
        const currentPP =
  gameState.player.movePP[moveId];
        const maxPP = move.pp;

        moveButtons[index].innerHTML =
  `${move.name}<span
  class="pp">${currentPP}/${maxPP}</span>`;
        moveButtons[index].dataset.move = moveId;
        moveButtons[index].disabled = currentPP === 0;
      }
    });
  }

  function logMessage(message) {
    const log = $('battle-log');
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
    let damage = Math.floor(((2 * level / 5 + 2) * power
   * attack / defense / 50 + 2));

    // タイプ相性
    const effectiveness =
  getTypeEffectiveness(move.type, defender.type1,
  defender.type2);
    damage = Math.floor(damage * effectiveness);

    // 乱数（85-100%）
    damage = Math.floor(damage * (Math.random() * 0.15 +
   0.85));

    // タイプ一致ボーナス
    if (attacker.type1 === move.type || attacker.type2
  === move.type) {
      damage = Math.floor(damage * 1.5);
    }

    return Math.max(1, damage);
  }

  function getTypeEffectiveness(moveType, defenderType1,
   defenderType2) {
    let effectiveness = 1;

    if (typeChart[moveType] &&
  typeChart[moveType][defenderType1]) {
      effectiveness *=
  typeChart[moveType][defenderType1];
    }

    if (defenderType2 && typeChart[moveType] &&
  typeChart[moveType][defenderType2]) {
      effectiveness *=
  typeChart[moveType][defenderType2];
    }

    return effectiveness;
  }

  function showEffectiveness(effectiveness) {
    const effectDiv = $('effectiveness');

    if (effectiveness > 1) {
      effectDiv.textContent = 'こうかは ばつぐんだ！';
      effectDiv.className = 'effectiveness
  super-effective';
    } else if (effectiveness < 1 && effectiveness > 0) {
      effectDiv.textContent = 'こうかは
  いまひとつのようだ...';
      effectDiv.className = 'effectiveness
  not-very-effective';
    } else if (effectiveness === 0) {
      effectDiv.textContent = 'こうかが ないようだ...';
      effectDiv.className = 'effectiveness no-effect';
    }

    effectDiv.classList.remove('hidden');
    setTimeout(() => {
      effectDiv.classList.add('hidden');
    }, 2000);
  }

  async function executeMove(attacker, defender, moveId)
   {
    const move = attacker.useMove(moveId);
    if (!move) {
      logMessage(`${attacker.name} の
  ${moveData[moveId].name} は PPが たりない！`);
      return;
    }

    playSound('select');
    logMessage(`${attacker.name} の ${move.name}！`);

    // アニメーション
    const attackerSprite = attacker === gameState.player
   ? $('player-sprite') : $('enemy-sprite');
    const defenderSprite = attacker === gameState.player
   ? $('enemy-sprite') : $('player-sprite');

    attackerSprite.classList.add('attack-animation');
    setTimeout(() =>
  attackerSprite.classList.remove('attack-animation'),
  600);

    await sleep(400);

    if (move.power > 0) {
      const damage = calculateDamage(attacker, defender,
   move);
      const effectiveness =
  getTypeEffectiveness(move.type, defender.type1,
  defender.type2);

      playSound('attack');
      defenderSprite.classList.add('damage-animation');
      setTimeout(() =>
  defenderSprite.classList.remove('damage-animation'),
  400);

      const fainted = defender.takeDamage(damage);
      updateUI();

      logMessage(`${defender.name} に ${damage}
  ダメージ！`);

      if (effectiveness !== 1) {
        showEffectiveness(effectiveness);
        await sleep(1000);
      }

      if (fainted) {
        logMessage(`${defender.name} は たおれた！`);
        if (defender === gameState.enemy) {
          logMessage('プレイヤーの勝利！');
          gameState.player.experience = Math.min(100,
  gameState.player.experience + 25);
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
    const availableMoves =
  gameState.enemy.moves.filter(move =>
  gameState.enemy.canUseMove(move));
    if (availableMoves.length === 0) {
      logMessage(`${gameState.enemy.name} は
  使える技がない！`);
      return;
    }

    const selectedMove =
  availableMoves[Math.floor(Math.random() *
  availableMoves.length)];
    await executeMove(gameState.enemy, gameState.player,
   selectedMove);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve,
  ms));
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
    gameState.sfxEnabled = !gameState.sfxEnabled;
    btn.textContent = gameState.sfxEnabled ? 'SFX ⏸' :
  'SFX ▶';
  }

  // ====== イベントリスナー ======
  document.addEventListener('DOMContentLoaded', () => {
    // タイトル画面
    $('start-btn').addEventListener('click', () => {
      playSound('select');
      switchScene('intro');
    });

    // 導入画面
    $('continue-btn').addEventListener('click', () => {
      playSound('select');
      dialogIndex++;
      if (dialogIndex >= introMessages.length) {
        switchScene('battle');
      } else {
        showDialog();
      }
    });

    // 音声コントロール
    $('bgm-btn').addEventListener('click', toggleBGM);
    $('sfx-btn').addEventListener('click', toggleSFX);

    $('volume').addEventListener('input', (e) => {
      const volume = e.target.value;
      $('background-music').volume = volume;
      document.querySelectorAll('audio:not(#background-m
  usic)').forEach(audio => {
        audio.volume = volume;
      });
    });

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
          logMessage('他に戦えるポケモンがいない！');
        } else if (action === 'bag') {
          logMessage('道具を持っていない！');
        } else if (action === 'run') {
          logMessage('うまく逃げられた！');
        }
      }

      // 技選択
      else if (e.target.classList.contains('move-btn')
  && !e.target.disabled) {
        const moveId = e.target.dataset.move;
        playSound('select');

        show('main-menu');
        hide('moves-menu');
        gameState.currentMenu = 'main';

        // プレイヤーターン
        await executeMove(gameState.player,
  gameState.enemy, moveId);

        // バトル継続チェック
        if (gameState.enemy.currentHP > 0 &&
  gameState.player.currentHP > 0) {
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
      if (currentScene === 'title' && (e.key === 'Enter'
   || e.key === ' ')) {
        $('start-btn').click();
      } else if (currentScene === 'intro' && (e.key ===
  'Enter' || e.key === ' ')) {
        $('continue-btn').click();
      } else if (currentScene === 'battle') {
        if (gameState.currentMenu === 'main') {
          const actions = ['fight', 'pokemon', 'bag',
  'run'];
          const key = parseInt(e.key);
          if (key >= 1 && key <= 4) {
            document.querySelector(`[data-action="${acti
  ons[key-1]}"]`).click();
          }
        } else if (gameState.currentMenu === 'moves') {
          const key = parseInt(e.key);
          if (key >= 1 && key <= 4) {
            const moveBtn =
  document.querySelectorAll('.move-btn')[key - 1];
            if (moveBtn && !moveBtn.disabled)
  moveBtn.click();
          } else if (e.key === 'Escape') {
            $('back-btn').click();
          }
        }
      }
    });

    // 初期音量設定
    const volume = $('volume').value;
    document.querySelectorAll('audio').forEach(audio =>
  {
      audio.volume = volume;
    });
  });
