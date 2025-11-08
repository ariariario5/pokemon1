 -  // シンプル版ポケモンバトル
         2 -  console.log('script.js loaded');
         1 +  // ====== ポケモンバトルシステム完全版
           + ======
         2
         3 -  // ページ読み込み完了後に実行
         4 -  document.addEventListener('DOMContentLo
           - aded', function() {
         5 -      console.log('DOM loaded');
         3 +  // ゲーム状態管理
         4 +  let currentScene = 'title';
         5 +  let dialogIndex = 0;
         6 +  let gameState = {
         7 +    player: null,
         8 +    enemy: null,
         9 +    currentMenu: 'main',
        10 +    battlePhase: 'select',
        11 +    sfxEnabled: true,
        12 +    bgmEnabled: false
        13 +  };
        14
        15 -      // 要素を取得
        16 -      const startBtn =
           - document.getElementById('start-btn');
        17 -      const continueBtn =
           - document.getElementById('continue-btn');
        18 -      const titleScreen =
           - document.getElementById('title-screen');
        19 -      const introScreen =
           - document.getElementById('intro-screen');
        20 -      const battleScreen = document.getEl
           - ementById('battle-screen');
        15 +  // ポケモンデータベース
        16 +  const pokemonData = {
        17 +    bulbasaur: {
        18 +      name: 'フシギダネ',
        19 +      type1: 'grass',
        20 +      type2: 'poison',
        21 +      baseStats: { hp: 45, attack: 49,
           + defense: 49, speed: 45 },
        22 +      moves: ['tackle', 'vineWhip',
           + 'growl', 'leechSeed'],
        23 +      color: '#78C850'
        24 +    },
        25 +    charmander: {
        26 +      name: 'ヒトカゲ',
        27 +      type1: 'fire',
        28 +      type2: null,
        29 +      baseStats: { hp: 39, attack: 52,
           + defense: 43, speed: 65 },
        30 +      moves: ['tackle', 'ember', 'growl',
           +  'scratch'],
        31 +      color: '#F08030'
        32 +    },
        33 +    squirtle: {
        34 +      name: 'ゼニガメ',
        35 +      type1: 'water',
        36 +      type2: null,
        37 +      baseStats: { hp: 44, attack: 48,
           + defense: 65, speed: 43 },
        38 +      moves: ['tackle', 'bubble',
           + 'tailWhip', 'withdraw'],
        39 +      color: '#6890F0'
        40 +    }
        41 +  };
        42
        43 -      console.log('Elements found:', {
        44 -          startBtn: !!startBtn,
        45 -          continueBtn: !!continueBtn,
        46 -          titleScreen: !!titleScreen,
        47 -          introScreen: !!introScreen,
        48 -          battleScreen: !!battleScreen
        43 +  // 技データベース
        44 +  const moveData = {
        45 +    tackle: { name: 'たいあたり', type:
           + 'normal', power: 40, accuracy: 100, pp:
           + 35 },
        46 +    ember: { name: 'ひのこ', type:
           + 'fire', power: 40, accuracy: 100, pp: 25
           +  },
        47 +    bubble: { name: 'あわ', type:
           + 'water', power: 40, accuracy: 100, pp:
           + 30 },
        48 +    vineWhip: { name: 'つるのムチ', type:
           +  'grass', power: 45, accuracy: 100, pp:
           + 25 },
        49 +    scratch: { name: 'ひっかく', type:
           + 'normal', power: 40, accuracy: 100, pp:
           + 35 },
        50 +    growl: { name: 'なきごえ', type:
           + 'normal', power: 0, accuracy: 100, pp:
           + 40 },
        51 +    tailWhip: { name: 'しっぽをふる',
           + type: 'normal', power: 0, accuracy: 100,
           +  pp: 30 },
        52 +    leechSeed: { name: 'やどりぎのタネ',
           + type: 'grass', power: 0, accuracy: 90,
           + pp: 10 },
        53 +    withdraw: { name: 'からにこもる',
           + type: 'water', power: 0, accuracy: 100,
           + pp: 40 }
        54 +  };
        55 +
        56 +  // タイプ相性
        57 +  const typeChart = {
        58 +    fire: { grass: 2, water: 0.5, fire:
           + 0.5 },
        59 +    water: { fire: 2, grass: 0.5, water:
           + 0.5 },
        60 +    grass: { water: 2, fire: 0.5, grass:
           + 0.5 },
        61 +    normal: {}
        62 +  };
        63 +
        64 +  // 導入メッセージ
        65 +  const introMessages = [
        66 +    'ポケモンの世界へようこそ！',
        67 +    'きみは新人トレーナーだ。',
        68 +    'さあ、最初のポケモンを選んで冒険を始
           + めよう！',
        69 +    'やせいのポケモンが現れた！'
        70 +  ];
        71 +
        72 +  // ====== ポケモンクラス ======
        73 +  class Pokemon {
        74 +    constructor(data, level = 5) {
        75 +      this.name = data.name;
        76 +      this.type1 = data.type1;
        77 +      this.type2 = data.type2;
        78 +      this.level = level;
        79 +      this.color = data.color;
        80 +
        81 +      // ステータス計算
        82 +      this.maxHP =
           + Math.floor((data.baseStats.hp * 2 *
           + level / 100) + level + 10);
        83 +      this.currentHP = this.maxHP;
        84 +      this.attack =
           + Math.floor((data.baseStats.attack * 2 *
           + level / 100) + 5);
        85 +      this.defense =
           + Math.floor((data.baseStats.defense * 2 *
           +  level / 100) + 5);
        86 +      this.speed =
           + Math.floor((data.baseStats.speed * 2 *
           + level / 100) + 5);
        87 +
        88 +      // 技とPP
        89 +      this.moves = data.moves.slice(0,
           + 4);
        90 +      this.movePP = {};
        91 +      this.moves.forEach(move => {
        92 +        this.movePP[move] =
           + moveData[move].pp;
        93        });
        94
        95 -      // はじめるボタンのクリック
        96 -      if (startBtn) {
        97 -
           - startBtn.addEventListener('click',
           - function() {
        98 -              console.log('Start button
           - clicked');
        99 -
           - alert('スタートボタンが押されました！');
        95 +      this.experience =
           + Math.floor(Math.random() * 100);
        96 +    }
        97
        98 -              // タイトル画面を隠す
        99 -              titleScreen.style.display =
           -  'none';
       100 -              // 導入画面を表示
       101 -              introScreen.style.display =
           -  'flex';
       102 -          });
        98 +    takeDamage(damage) {
        99 +      this.currentHP = Math.max(0,
           + this.currentHP - damage);
       100 +      return this.currentHP === 0;
       101 +    }
       102 +
       103 +    useMove(moveId) {
       104 +      if (this.movePP[moveId] > 0) {
       105 +        this.movePP[moveId]--;
       106 +        return moveData[moveId];
       107 +      }
       108 +      return null;
       109 +    }
       110 +
       111 +    canUseMove(moveId) {
       112 +      return this.movePP[moveId] > 0;
       113 +    }
       114 +  }
       115 +
       116 +  // ====== ユーティリティ関数 ======
       117 +  function $(id) {
       118 +    return document.getElementById(id);
       119 +  }
       120 +
       121 +  function show(elementId) {
       122 +
           + $(elementId).classList.remove('hidden');
       123 +  }
       124 +
       125 +  function hide(elementId) {
       126 +    $(elementId).classList.add('hidden');
       127 +  }
       128 +
       129 +  function switchScene(sceneName) {
       130 +    // 全シーンを隠す
       131 +    $('title-screen').classList.add('hidd
           + en');
       132 +    $('intro-screen').classList.add('hidd
           + en');
       133 +    $('battle-screen').classList.add('hid
           + den');
       134 +
       135 +    // 指定シーンを表示
       136 +    $(sceneName +
           + '-screen').classList.remove('hidden');
       137 +    currentScene = sceneName;
       138 +
       139 +    // シーン固有の初期化
       140 +    if (sceneName === 'intro') {
       141 +      dialogIndex = 0;
       142 +      showDialog();
       143 +    } else if (sceneName === 'battle') {
       144 +      initializeBattle();
       145 +    }
       146 +  }
       147 +
       148 +  function showDialog() {
       149 +    if (dialogIndex <
           + introMessages.length) {
       150 +      typeText($('dialog-text'),
           + introMessages[dialogIndex]);
       151 +    } else {
       152 +      switchScene('battle');
       153 +    }
       154 +  }
       155 +
       156 +  function typeText(element, text, speed
           + = 50) {
       157 +    element.textContent = '';
       158 +    let i = 0;
       159 +    const timer = setInterval(() => {
       160 +      element.textContent += text[i];
       161 +      i++;
       162 +      if (i >= text.length) {
       163 +        clearInterval(timer);
       164 +      }
       165 +    }, speed);
       166 +  }
       167 +
       168 +  // ====== ポケモンスプライト生成 ======
       169 +  function createPokemonSprite(pokemon,
           + isPlayer = false) {
       170 +    const svg = `
       171 +      <svg width="150" height="150"
           + viewBox="0 0 150 150">
       172 +        <defs>
       173 +          <radialGradient
           + id="grad${isPlayer ? 'Player' :
           + 'Enemy'}" cx="50%" cy="30%" r="70%">
       174 +            <stop offset="0%"
           + stop-color="${pokemon.color}"
           + stop-opacity="1"/>
       175 +            <stop offset="70%"
           + stop-color="${pokemon.color}"
           + stop-opacity="0.8"/>
       176 +            <stop offset="100%"
           + stop-color="${pokemon.color}"
           + stop-opacity="0.6"/>
       177 +          </radialGradient>
       178 +          <filter id="shadow${isPlayer ?
           + 'Player' : 'Enemy'}">
       179 +            <feDropShadow dx="3" dy="6"
           + stdDeviation="4" flood-opacity="0.4"/>
       180 +          </filter>
       181 +        </defs>
       182 +        <ellipse cx="75" cy="130" rx="40"
           +  ry="15" fill="rgba(0,0,0,0.2)"/>
       183 +        <circle cx="75" cy="75" r="45"
           + fill="url(#grad${isPlayer ? 'Player' :
           + 'Enemy'})" filter="url(#shadow${isPlayer
           +  ? 'Player' : 'Enemy'})"/>
       184 +        <circle cx="60" cy="65" r="6"
           + fill="#000"/>
       185 +        <circle cx="90" cy="65" r="6"
           + fill="#000"/>
       186 +        <circle cx="62" cy="63" r="2"
           + fill="#fff"/>
       187 +        <circle cx="92" cy="63" r="2"
           + fill="#fff"/>
       188 +        <ellipse cx="75" cy="85" rx="10"
           + ry="6" fill="rgba(0,0,0,0.3)"/>
       189 +        ${pokemon.type1 === 'grass' ?
           + '<rect x="65" y="45" width="20"
           + height="8" rx="4" fill="#2E7D32"/>' :
           + ''}
       190 +        ${pokemon.type1 === 'fire' ?
           + '<polygon points="75,40 80,50 70,50"
           + fill="#D84315"/>' : ''}
       191 +        ${pokemon.type1 === 'water' ?
           + '<circle cx="75" cy="50" r="8"
           + fill="#1565C0" opacity="0.7"/>' : ''}
       192 +      </svg>
       193 +    `;
       194 +
       195 +    // btoa の代わりにシンプルなdata URI
           + を使用
       196 +    return
           + 'data:image/svg+xml;charset=utf-8,' +
           + encodeURIComponent(svg);
       197 +  }
       198 +
       199 +  // ====== バトルシステム ======
       200 +  function initializeBattle() {
       201 +    // ポケモン初期化
       202 +    gameState.player = new
           + Pokemon(pokemonData.charmander);
       203 +    gameState.enemy = new
           + Pokemon(pokemonData.bulbasaur);
       204 +
       205 +    // スプライト設定
       206 +    $('player-sprite').src =
           + createPokemonSprite(gameState.player,
           + true);
       207 +    $('enemy-sprite').src =
           + createPokemonSprite(gameState.enemy,
           + false);
       208 +
       209 +    updateUI();
       210 +    logMessage(`やせいの
           + ${gameState.enemy.name} が
           + とびだしてきた！`);
       211 +    logMessage(`いけ！
           + ${gameState.player.name}！`);
       212 +  }
       213 +
       214 +  function updateUI() {
       215 +    // プレイヤー情報更新
       216 +    $('player-name').textContent =
           + gameState.player.name;
       217 +    $('player-level').textContent =
           + gameState.player.level;
       218 +    $('player-hp-current').textContent =
           + gameState.player.currentHP;
       219 +    $('player-hp-max').textContent =
           + gameState.player.maxHP;
       220 +
       221 +    // 敵情報更新
       222 +    $('enemy-name').textContent =
           + gameState.enemy.name;
       223 +    $('enemy-level').textContent =
           + gameState.enemy.level;
       224 +    $('enemy-hp-current').textContent =
           + gameState.enemy.currentHP;
       225 +    $('enemy-hp-max').textContent =
           + gameState.enemy.maxHP;
       226 +
       227 +    // HPバー更新
       228 +    updateHPBar('player',
           + gameState.player);
       229 +    updateHPBar('enemy',
           + gameState.enemy);
       230 +
       231 +    // EXPバー更新
       232 +    $('exp-bar').style.width =
           + `${gameState.player.experience}%`;
       233 +
       234 +    // 技メニュー更新
       235 +    updateMovesMenu();
       236 +  }
       237 +
       238 +  function updateHPBar(type, pokemon) {
       239 +    const hpBar = $(type + '-hp-bar');
       240 +    const hpPercentage =
           + (pokemon.currentHP / pokemon.maxHP) *
           + 100;
       241 +
       242 +    hpBar.style.width =
           + `${hpPercentage}%`;
       243 +    hpBar.className = 'hp-bar';
       244 +
       245 +    if (hpPercentage <= 20) {
       246 +      hpBar.classList.add('critical');
       247 +    } else if (hpPercentage <= 50) {
       248 +      hpBar.classList.add('low');
       249 +    }
       250 +  }
       251 +
       252 +  function updateMovesMenu() {
       253 +    const moveButtons =
           + document.querySelectorAll('.move-btn');
       254 +
           + gameState.player.moves.forEach((moveId,
           + index) => {
       255 +      if (moveButtons[index]) {
       256 +        const move = moveData[moveId];
       257 +        const currentPP =
           + gameState.player.movePP[moveId];
       258 +        const maxPP = move.pp;
       259 +
       260 +        moveButtons[index].innerHTML =
           + `${move.name}<span class="pp">${currentP
           + P}/${maxPP}</span>`;
       261 +        moveButtons[index].dataset.move =
           +  moveId;
       262 +        moveButtons[index].disabled =
           + currentPP === 0;
       263 +      }
       264 +    });
       265 +  }
       266 +
       267 +  function logMessage(message) {
       268 +    const log = $('battle-log');
       269 +    const entry =
           + document.createElement('div');
       270 +    entry.className = 'log-entry';
       271 +    entry.textContent = message;
       272 +    log.appendChild(entry);
       273 +    log.scrollTop = log.scrollHeight;
       274 +  }
       275 +
       276 +  function calculateDamage(attacker,
           + defender, move) {
       277 +    if (move.power === 0) return 0;
       278 +
       279 +    const level = attacker.level;
       280 +    const attack = attacker.attack;
       281 +    const defense = defender.defense;
       282 +    const power = move.power;
       283 +
       284 +    // 基本ダメージ計算
       285 +    let damage = Math.floor(((2 * level /
           +  5 + 2) * power * attack / defense / 50
           + + 2));
       286 +
       287 +    // タイプ相性
       288 +    const effectiveness =
           + getTypeEffectiveness(move.type,
           + defender.type1, defender.type2);
       289 +    damage = Math.floor(damage *
           + effectiveness);
       290 +
       291 +    // 乱数（85-100%）
       292 +    damage = Math.floor(damage *
           + (Math.random() * 0.15 + 0.85));
       293 +
       294 +    // タイプ一致ボーナス
       295 +    if (attacker.type1 === move.type ||
           + attacker.type2 === move.type) {
       296 +      damage = Math.floor(damage * 1.5);
       297 +    }
       298 +
       299 +    return Math.max(1, damage);
       300 +  }
       301 +
       302 +  function getTypeEffectiveness(moveType,
           +  defenderType1, defenderType2) {
       303 +    let effectiveness = 1;
       304 +
       305 +    if (typeChart[moveType] &&
           + typeChart[moveType][defenderType1]) {
       306 +      effectiveness *=
           + typeChart[moveType][defenderType1];
       307 +    }
       308 +
       309 +    if (defenderType2 &&
           + typeChart[moveType] &&
           + typeChart[moveType][defenderType2]) {
       310 +      effectiveness *=
           + typeChart[moveType][defenderType2];
       311 +    }
       312 +
       313 +    return effectiveness;
       314 +  }
       315 +
       316 +  function
           + showEffectiveness(effectiveness) {
       317 +    const effectDiv = $('effectiveness');
       318 +
       319 +    if (effectiveness > 1) {
       320 +      effectDiv.textContent = 'こうかは
           + ばつぐんだ！';
       321 +      effectDiv.className =
           + 'effectiveness super-effective';
       322 +    } else if (effectiveness < 1 &&
           + effectiveness > 0) {
       323 +      effectDiv.textContent = 'こうかは
           + いまひとつのようだ...';
       324 +      effectDiv.className =
           + 'effectiveness not-very-effective';
       325 +    } else if (effectiveness === 0) {
       326 +      effectDiv.textContent = 'こうかが
           + ないようだ...';
       327 +      effectDiv.className =
           + 'effectiveness no-effect';
       328 +    }
       329 +
       330 +    effectDiv.classList.remove('hidden');
       331 +    setTimeout(() => {
       332 +      effectDiv.classList.add('hidden');
       333 +    }, 2000);
       334 +  }
       335 +
       336 +  async function executeMove(attacker,
           + defender, moveId) {
       337 +    const move =
           + attacker.useMove(moveId);
       338 +    if (!move) {
       339 +      logMessage(`${attacker.name} の
           + ${moveData[moveId].name} は PPが
           + たりない！`);
       340 +      return;
       341 +    }
       342 +
       343 +    playSound('select');
       344 +    logMessage(`${attacker.name} の
           + ${move.name}！`);
       345 +
       346 +    // アニメーション
       347 +    const attackerSprite = attacker ===
           + gameState.player ? $('player-sprite') :
           + $('enemy-sprite');
       348 +    const defenderSprite = attacker ===
           + gameState.player ? $('enemy-sprite') :
           + $('player-sprite');
       349 +
       350 +    attackerSprite.classList.add('attack-
           + animation');
       351 +    setTimeout(() => attackerSprite.class
           + List.remove('attack-animation'), 600);
       352 +
       353 +    await sleep(400);
       354 +
       355 +    if (move.power > 0) {
       356 +      const damage =
           + calculateDamage(attacker, defender,
           + move);
       357 +      const effectiveness =
           + getTypeEffectiveness(move.type,
           + defender.type1, defender.type2);
       358 +
       359 +      playSound('attack');
       360 +      defenderSprite.classList.add('damag
           + e-animation');
       361 +      setTimeout(() => defenderSprite.cla
           + ssList.remove('damage-animation'), 400);
       362 +
       363 +      const fainted =
           + defender.takeDamage(damage);
       364 +      updateUI();
       365 +
       366 +      logMessage(`${defender.name} に
           + ${damage} ダメージ！`);
       367 +
       368 +      if (effectiveness !== 1) {
       369 +        showEffectiveness(effectiveness);
       370 +        await sleep(1000);
       371 +      }
       372 +
       373 +      if (fainted) {
       374 +        logMessage(`${defender.name} は
           + たおれた！`);
       375 +        if (defender === gameState.enemy)
           +  {
       376 +
           + logMessage('プレイヤーの勝利！');
       377 +          gameState.player.experience =
           + Math.min(100,
           + gameState.player.experience + 25);
       378 +          updateUI();
       379 +        } else {
       380 +
           + logMessage('プレイヤーの敗北...');
       381 +        }
       382 +        return;
       383 +      }
       384 +    } else {
       385 +      // 補助技の処理
       386 +      logMessage(`${defender.name}
           + の能力が変化した！`);
       387 +    }
       388 +  }
       389 +
       390 +  async function enemyTurn() {
       391 +    const availableMoves =
           + gameState.enemy.moves.filter(move =>
           + gameState.enemy.canUseMove(move));
       392 +    if (availableMoves.length === 0) {
       393 +      logMessage(`${gameState.enemy.name}
           +  は 使える技がない！`);
       394 +      return;
       395 +    }
       396 +
       397 +    const selectedMove =
           + availableMoves[Math.floor(Math.random()
           + * availableMoves.length)];
       398 +    await executeMove(gameState.enemy,
           + gameState.player, selectedMove);
       399 +  }
       400 +
       401 +  function sleep(ms) {
       402 +    return new Promise(resolve =>
           + setTimeout(resolve, ms));
       403 +  }
       404 +
       405 +  // ====== 音声システム ======
       406 +  function playSound(type) {
       407 +    if (!gameState.sfxEnabled) return;
       408 +
       409 +    const soundMap = {
       410 +      select: 'sound-select',
       411 +      attack: 'sound-attack',
       412 +      damage: 'sound-damage'
       413 +    };
       414 +
       415 +    const audio = $(soundMap[type]);
       416 +    if (audio) {
       417 +      audio.currentTime = 0;
       418 +      audio.play().catch(() => {}); //
           + エラーを無視
       419 +    }
       420 +  }
       421 +
       422 +  function toggleBGM() {
       423 +    const bgm = $('background-music');
       424 +    const btn = $('bgm-btn');
       425 +
       426 +    if (gameState.bgmEnabled) {
       427 +      bgm.pause();
       428 +      btn.textContent = 'BGM ▶';
       429 +      gameState.bgmEnabled = false;
       430 +    } else {
       431 +      bgm.play().catch(() => {});
       432 +      btn.textContent = 'BGM ⏸';
       433 +      gameState.bgmEnabled = true;
       434 +    }
       435 +  }
       436 +
       437 +  function toggleSFX() {
       438 +    const btn = $('sfx-btn');
       439 +    gameState.sfxEnabled =
           + !gameState.sfxEnabled;
       440 +    btn.textContent =
           + gameState.sfxEnabled ? 'SFX ⏸' : 'SFX
           + ▶';
       441 +  }
       442 +
       443 +  // ====== イベントリスナー ======
       444 +  document.addEventListener('DOMContentLo
           + aded', () => {
       445 +    // タイトル画面
       446 +
           + $('start-btn').addEventListener('click',
           +  () => {
       447 +      playSound('select');
       448 +      switchScene('intro');
       449 +    });
       450 +
       451 +    // 導入画面
       452 +    $('continue-btn').addEventListener('c
           + lick', () => {
       453 +      playSound('select');
       454 +      dialogIndex++;
       455 +      if (dialogIndex >=
           + introMessages.length) {
       456 +        switchScene('battle');
       457        } else {
       458 -          console.error('Start button not
           -  found');
       458 +        showDialog();
       459        }
       460 +    });
       461
       462 -      // 続けるボタンのクリック
       463 -      if (continueBtn) {
       464 -
           - continueBtn.addEventListener('click',
           - function() {
       465 -              console.log('Continue
           - button clicked');
       466 -
           - alert('続けるボタンが押されました！');
       462 +    // 音声コントロール
       463 +
           + $('bgm-btn').addEventListener('click',
           + toggleBGM);
       464 +
           + $('sfx-btn').addEventListener('click',
           + toggleSFX);
       465
       466 -              // 導入画面を隠す
       467 -              introScreen.style.display =
           -  'none';
       468 -              // バトル画面を表示
       469 -              battleScreen.style.display
           - = 'flex';
       470 -          });
       466 +    $('volume').addEventListener('input',
           +  (e) => {
       467 +      const volume = e.target.value;
       468 +      $('background-music').volume =
           + volume;
       469 +      document.querySelectorAll('audio:no
           + t(#background-music)').forEach(audio =>
           + {
       470 +        audio.volume = volume;
       471 +      });
       472 +    });
       473 +
       474 +    // バトルメニュー
       475 +    document.addEventListener('click',
           + async (e) => {
       476 +      if (currentScene !== 'battle')
           + return;
       477 +
       478 +      // メインメニュー
       479 +      if (e.target.classList.contains('me
           + nu-btn')) {
       480 +        const action =
           + e.target.dataset.action;
       481 +        playSound('select');
       482 +
       483 +        if (action === 'fight') {
       484 +          hide('main-menu');
       485 +          show('moves-menu');
       486 +          gameState.currentMenu =
           + 'moves';
       487 +        } else if (action === 'pokemon')
           + {
       488 +          logMessage('他に戦えるポケモン
           + がいない！');
       489 +        } else if (action === 'bag') {
       490 +
           + logMessage('道具を持っていない！');
       491 +        } else if (action === 'run') {
       492 +
           + logMessage('うまく逃げられた！');
       493 +        }
       494        }
       495
       496 -      // BGMボタン
       497 -      const bgmBtn =
           - document.getElementById('bgm-btn');
       498 -      if (bgmBtn) {
       499 -
           - bgmBtn.addEventListener('click',
           - function() {
       500 -
           - alert('BGMボタンが押されました！');
       501 -          });
       496 +      // 技選択
       497 +      else if
           + (e.target.classList.contains('move-btn')
           +  && !e.target.disabled) {
       498 +        const moveId =
           + e.target.dataset.move;
       499 +        playSound('select');
       500 +
       501 +        show('main-menu');
       502 +        hide('moves-menu');
       503 +        gameState.currentMenu = 'main';
       504 +
       505 +        // プレイヤーターン
       506 +        await
           + executeMove(gameState.player,
           + gameState.enemy, moveId);
       507 +
       508 +        // バトル継続チェック
       509 +        if (gameState.enemy.currentHP > 0
           +  && gameState.player.currentHP > 0) {
       510 +          await sleep(1000);
       511 +          await enemyTurn();
       512 +        }
       513        }
       514
       515 -      // SFXボタン
       516 -      const sfxBtn =
           - document.getElementById('sfx-btn');
       517 -      if (sfxBtn) {
       518 -
           - sfxBtn.addEventListener('click',
           - function() {
       519 -
           - alert('SFXボタンが押されました！');
       520 -          });
       515 +      // 戻るボタン
       516 +      else if (e.target.id ===
           + 'back-btn') {
       517 +        playSound('select');
       518 +        show('main-menu');
       519 +        hide('moves-menu');
       520 +        gameState.currentMenu = 'main';
       521        }
       522 +    });
       523
       524 -      console.log('All event listeners
           - added');
       524 +    // キーボードサポート
       525 +    document.addEventListener('keydown',
           + (e) => {
       526 +      if (currentScene === 'title' &&
           + (e.key === 'Enter' || e.key === ' ')) {
       527 +        $('start-btn').click();
       528 +      } else if (currentScene === 'intro'
           +  && (e.key === 'Enter' || e.key === '
           + ')) {
       529 +        $('continue-btn').click();
       530 +      } else if (currentScene ===
           + 'battle') {
       531 +        if (gameState.currentMenu ===
           + 'main') {
       532 +          const actions = ['fight',
           + 'pokemon', 'bag', 'run'];
       533 +          const key = parseInt(e.key);
       534 +          if (key >= 1 && key <= 4) {
       535 +            document.querySelector(`[data
           + -action="${actions[key-1]}"]`).click();
       536 +          }
       537 +        } else if (gameState.currentMenu
           + === 'moves') {
       538 +          const key = parseInt(e.key);
       539 +          if (key >= 1 && key <= 4) {
       540 +            const moveBtn = document.quer
           + ySelectorAll('.move-btn')[key - 1];
       541 +            if (moveBtn &&
           + !moveBtn.disabled) moveBtn.click();
       542 +          } else if (e.key === 'Escape')
           + {
       543 +            $('back-btn').click();
       544 +          }
       545 +        }
       546 +      }
       547 +    });
       548 +
       549 +    // 初期音量設定
       550 +    const volume = $('volume').value;
       551 +    document.querySelectorAll('audio').fo
           + rEach(audio => {
       552 +      audio.volume = volume;
       553 +    });
       554    });
       555   \ No newline at end of file
