 // ====== Enhanced Pokemon Battle System ======
  // Complete Pokemon experience with title screen,
  intro, and fast battle mechanics

  // Game state management
  let currentScene = 'title'; // title, intro, battle
  let dialogIndex = 0;
  let isTransitioning = false;

  // Pokemon database with complete stats and movesets
  const pokemonDatabase = {
    mon001: {
      name: 'フシギダネ',
      type1: 'grass',
      type2: 'poison',
      baseStats: { hp: 45, attack: 49, defense: 49,
  speed: 45 },
      moves: ['tackle', 'vine_whip', 'growl',
  'leech_seed'],
      sprites: {
        front: 'assets/sprites/front/mon001.png',
        back: 'assets/sprites/back/mon001.png'
      }
    },
    mon004: {
      name: 'ヒトカゲ',
      type1: 'fire',
      type2: null,
      baseStats: { hp: 39, attack: 52, defense: 43,
  speed: 65 },
      moves: ['tackle', 'ember', 'growl', 'scratch'],
      sprites: {
        front: 'assets/sprites/front/mon004.png',
        back: 'assets/sprites/back/mon004.png'
      }
    },
    mon007: {
      name: 'ゼニガメ',
      type1: 'water',
      type2: null,
      baseStats: { hp: 44, attack: 48, defense: 65,
  speed: 43 },
      moves: ['tackle', 'bubble', 'tail_whip',
  'withdraw'],
      sprites: {
        front: 'assets/sprites/front/mon007.png',
        back: 'assets/sprites/back/mon007.png'
      }
    },
    mon999: {
      name: 'スライムダネ',
      type1: 'normal',
      type2: null,
      baseStats: { hp: 50, attack: 45, defense: 40,
  speed: 35 },
      moves: ['tackle', 'pound', 'growl', 'harden'],
      sprites: {
        front: 'assets/sprites/front/mon999.png',
        back: 'assets/sprites/back/mon999.png'
      }
    }
  };

  // Introduction dialog sequence
  const introDialogs = [
    'ポケモンの世界へようこそ！',
    'きみは新人トレーナーだ。',
    'さあ、最初のポケモンを選んで冒険を始めよう！',
    'やせいのポケモンが現れた！'
  ];

  // Move database with power, accuracy, PP, and effects
  const moveDatabase = {
    tackle: { name: 'たいあたり', type: 'normal', power:
   40, accuracy: 100, pp: 35, effect: null },
    ember: { name: 'ひのこ', type: 'fire', power: 40,
  accuracy: 100, pp: 25, effect: { type: 'burn', chance:
   10 } },
    bubble: { name: 'あわ', type: 'water', power: 40,
  accuracy: 100, pp: 30, effect: { type: 'speed_down',
  chance: 10 } },
    vine_whip: { name: 'つるのムチ', type: 'grass',
  power: 45, accuracy: 100, pp: 25, effect: null },
    scratch: { name: 'ひっかく', type: 'normal', power:
  40, accuracy: 100, pp: 35, effect: null },
    pound: { name: 'はたく', type: 'normal', power: 40,
  accuracy: 100, pp: 35, effect: null },
    growl: { name: 'なきごえ', type: 'normal', power: 0,
   accuracy: 100, pp: 40, effect: { type: 'attack_down',
   chance: 100 } },
    tail_whip: { name: 'しっぽをふる', type: 'normal',
  power: 0, accuracy: 100, pp: 30, effect: { type:
  'defense_down', chance: 100 } },
    leech_seed: { name: 'やどりぎのタネ', type: 'grass',
   power: 0, accuracy: 90, pp: 10, effect: { type:
  'leech_seed', chance: 100 } },
    withdraw: { name: 'からにこもる', type: 'water',
  power: 0, accuracy: 100, pp: 40, effect: { type:
  'defense_up', chance: 100 } },
    harden: { name: 'かたくなる', type: 'normal', power:
   0, accuracy: 100, pp: 30, effect: { type:
  'defense_up', chance: 100 } }
  };

  // Type effectiveness chart
  const typeEffectiveness = {
    fire: { grass: 2, water: 0.5, fire: 0.5, ice: 2,
  bug: 2, steel: 2, poison: 1 },
    water: { fire: 2, grass: 0.5, water: 0.5, ground: 2,
   rock: 2, dragon: 0.5 },
    grass: { water: 2, fire: 0.5, grass: 0.5, poison:
  0.5, ground: 2, rock: 2, flying: 0.5, bug: 0.5,
  dragon: 0.5, steel: 0.5 },
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock:
  0.5, ghost: 0.5, steel: 0 }
  };

  // ====== Scene Management ======
  function showScene(sceneName) {
    if (isTransitioning) return;

    isTransitioning = true;
    currentScene = sceneName;

    // Fast scene transitions
    const scenes = ['title-screen', 'intro-scene',
  'battle-field'];
    scenes.forEach(scene => {
      const element = document.getElementById(scene);
      if (element) {
        element.style.display = scene ===
  `${sceneName}-screen` || scene ===
  `${sceneName}-scene` || scene === `${sceneName}-field`
   ? 'flex' : 'none';
      }
    });

    // Scene-specific initialization
    if (sceneName === 'intro') {
      dialogIndex = 0;
      showDialog();
    } else if (sceneName === 'battle') {
      initializeBattle();
    }

    setTimeout(() => { isTransitioning = false; }, 150);
   // Fast transition
  }

  function showDialog() {
    const dialogBox =
  document.getElementById('dialog-box');
    const dialogText =
  document.getElementById('dialog-text');
    const continueBtn =
  document.getElementById('continue-btn');

    if (dialogIndex < introDialogs.length) {
      dialogText.textContent =
  introDialogs[dialogIndex];
      // Fast typing effect
      animateText(dialogText, introDialogs[dialogIndex],
   30);
      continueBtn.textContent = '続ける';
    } else {
      showScene('battle');
      return;
    }
  }

  function animateText(element, text, speed = 30) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, speed);
  }

  // ====== Battle System ======
  class BattleState {
    constructor() {
      this.player = null;
      this.enemy = null;
      this.currentMenu = 'main';
      this.battlePhase = 'select';
      this.sfxEnabled = true;
    }

    initializePokemon(playerData, enemyData) {
      this.player = new Pokemon(playerData, 5);
      this.enemy = new Pokemon(enemyData, 5);
      this.updateUI();
    }

    calculateDamage(attacker, defender, move) {
      if (move.power === 0) return 0;

      const level = attacker.level;
      const power = move.power;
      const attack = attacker.currentStats.attack;
      const defense = defender.currentStats.defense;

      // Pokemon damage formula
      let damage = Math.floor(((((2 * level / 5 + 2) *
  power * attack / defense) / 50) + 2));

      // Type effectiveness
      const effectiveness =
  this.getTypeEffectiveness(move.type, defender.type1,
  defender.type2);
      damage = Math.floor(damage * effectiveness);

      // Random factor (85-100%)
      const randomFactor = (Math.random() * 0.15 +
  0.85);
      damage = Math.floor(damage * randomFactor);

      // STAB (Same Type Attack Bonus)
      if (attacker.type1 === move.type || attacker.type2
   === move.type) {
        damage = Math.floor(damage * 1.5);
      }

      return Math.max(1, damage);
    }

    getTypeEffectiveness(moveType, defenderType1,
  defenderType2) {
      let effectiveness = 1;

      if (typeEffectiveness[moveType] &&
  typeEffectiveness[moveType][defenderType1] !==
  undefined) {
        effectiveness *=
  typeEffectiveness[moveType][defenderType1];
      }

      if (defenderType2 && typeEffectiveness[moveType]
  && typeEffectiveness[moveType][defenderType2] !==
  undefined) {
        effectiveness *=
  typeEffectiveness[moveType][defenderType2];
      }

      return effectiveness;
    }

    getEffectivenessText(effectiveness) {
      if (effectiveness > 1) return 'こうかは
  ばつぐんだ！';
      if (effectiveness < 1 && effectiveness > 0) return
   'こうかは いまひとつのようだ...';
      if (effectiveness === 0) return 'こうかが
  ないようだ...';
      return '';
    }

    updateUI() {
      // Update player info
      const playerName =
  document.getElementById('player-name');
      const playerLevel =
  document.getElementById('player-level');
      const playerHpCurrent =
  document.getElementById('player-hp-current');
      const playerHpMax =
  document.getElementById('player-hp-max');

      if (playerName) playerName.textContent =
  this.player.name;
      if (playerLevel) playerLevel.textContent =
  this.player.level;
      if (playerHpCurrent) playerHpCurrent.textContent =
   this.player.currentHP;
      if (playerHpMax) playerHpMax.textContent =
  this.player.maxHP;

      // Update enemy info
      const enemyName =
  document.getElementById('enemy-name');
      const enemyLevel =
  document.getElementById('enemy-level');
      const enemyHpCurrent =
  document.getElementById('enemy-hp-current');
      const enemyHpMax =
  document.getElementById('enemy-hp-max');

      if (enemyName) enemyName.textContent =
  this.enemy.name;
      if (enemyLevel) enemyLevel.textContent =
  this.enemy.level;
      if (enemyHpCurrent) enemyHpCurrent.textContent =
  this.enemy.currentHP;
      if (enemyHpMax) enemyHpMax.textContent =
  this.enemy.maxHP;

      // Update HP bars
      this.updateHPBar('player', this.player);
      this.updateHPBar('enemy', this.enemy);

      // Update EXP bar
      this.updateEXPBar();
    }

    updateHPBar(type, pokemon) {
      const hpBar =
  document.getElementById(`${type}-hp-bar`);
      if (!hpBar) return;

      const hpPercentage = (pokemon.currentHP /
  pokemon.maxHP) * 100;
      hpBar.style.width = `${hpPercentage}%`;

      // Change color based on HP - fast transitions
      hpBar.className = 'hp-bar-inner';
      if (hpPercentage <= 20) {
        hpBar.classList.add('critical');
      } else if (hpPercentage <= 50) {
        hpBar.classList.add('low');
      }
    }

    updateEXPBar() {
      const expBar =
  document.getElementById('player-exp-bar');
      if (expBar) {
        const expPercentage = (this.player.experience /
  100) * 100;
        expBar.style.width = `${expPercentage}%`;
      }
    }
  }

  // Pokemon class
  class Pokemon {
    constructor(data, level) {
      this.id = data.id;
      this.name = data.name;
      this.type1 = data.type1;
      this.type2 = data.type2;
      this.level = level;
      this.moves = data.moves.slice(0, 4);
      this.sprites = data.sprites;

      // Calculate stats based on level
      this.maxHP = Math.floor((data.baseStats.hp * 2 *
  level / 100) + level + 10);
      this.currentHP = this.maxHP;

      this.currentStats = {
        attack: Math.floor((data.baseStats.attack * 2 *
  level / 100) + 5),
        defense: Math.floor((data.baseStats.defense * 2
  * level / 100) + 5),
        speed: Math.floor((data.baseStats.speed * 2 *
  level / 100) + 5)
      };

      this.baseStats = { ...this.currentStats };
      this.statusEffects = {};
      this.experience = Math.floor(Math.random() * 100);

      // Move PP tracking
      this.movePP = {};
      this.moves.forEach(moveId => {
        this.movePP[moveId] = moveDatabase[moveId].pp;
      });
    }

    takeDamage(damage) {
      this.currentHP = Math.max(0, this.currentHP -
  damage);
      return this.currentHP === 0;
    }

    useMove(moveId) {
      if (this.movePP[moveId] > 0) {
        this.movePP[moveId]--;
        return moveDatabase[moveId];
      }
      return null;
    }

    canUseMove(moveId) {
      return this.movePP[moveId] > 0;
    }
  }

  // Global battle state
  const battle = new BattleState();

  // ====== Audio System ======
  const audioElements = {
    bgm: null,
    sfx: {
      attack: null,
      damage: null,
      heal: null,
      select: null
    }
  };

  function initializeAudio() {
    audioElements.bgm = document.getElementById('bgm');
    audioElements.sfx.attack =
  document.getElementById('sfx-attack');
    audioElements.sfx.damage =
  document.getElementById('sfx-damage');
    audioElements.sfx.heal =
  document.getElementById('sfx-heal');
    audioElements.sfx.select =
  document.getElementById('sfx-select');
  }

  function playSFX(type) {
    if (!battle.sfxEnabled || !audioElements.sfx[type])
  return;

    try {
      audioElements.sfx[type].currentTime = 0;
      audioElements.sfx[type].play().catch(() => {});
    } catch (e) {
      // Silent fail for missing audio files
    }
  }

  // ====== Sprite System ======
  function fallbackSVG(color = '#4caf50', name =
  'ポケモン') {
    const colors = {
      'フシギダネ': '#78C850',
      'ヒトカゲ': '#F08030',
      'ゼニガメ': '#6890F0',
      'スライムダネ': '#A8A878'
    };

    const pokemonColor = colors[name] || color;

    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg'
  width='120' height='120' viewBox='0 0 120 120'>
        <defs>
          <radialGradient id='grad1' cx='50%' cy='30%'
  r='70%'>
            <stop offset='0%'
  stop-color='${pokemonColor}' stop-opacity='1'/>
            <stop offset='70%'
  stop-color='${pokemonColor}' stop-opacity='0.8'/>
            <stop offset='100%'
  stop-color='${pokemonColor}' stop-opacity='0.6'/>
          </radialGradient>
          <filter id='shadow'>
            <feDropShadow dx='2' dy='4' stdDeviation='3'
   flood-opacity='0.3'/>
          </filter>
        </defs>
        <ellipse cx='60' cy='85' rx='35' ry='15'
  fill='rgba(0,0,0,0.2)'/>
        <circle cx='60' cy='60' r='35'
  fill='url(#grad1)' filter='url(#shadow)'/>
        <circle cx='50' cy='50' r='4' fill='#000'/>
        <circle cx='70' cy='50' r='4' fill='#000'/>
        <ellipse cx='60' cy='65' rx='8' ry='4'
  fill='rgba(0,0,0,0.3)'/>
      </svg>
    `);
    return `data:image/svg+xml;charset=UTF-8,${svg}`;
  }

  function setSprite(el, path, fallbackColor,
  pokemonName) {
    if (!el) return;

    const img = new Image();
    img.onload = () => el.src = path;
    img.onerror = () => el.src =
  fallbackSVG(fallbackColor, pokemonName);
    img.src = path;
  }

  // ====== Battle Log System ======
  const logs = [];

  function pushLog(text) {
    logs.push(text);
    const log = document.getElementById('log');
    if (!log) return;

    const row = document.createElement('div');
    row.className = 'row';
    row.textContent = text;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  // ====== Animation System ======
  function attackAnimation(attackerEl, defenderEl,
  moveType = 'normal') {
    if (!attackerEl || !defenderEl) return;

    // Fast attack animation
    attackerEl.animate([
      { transform: 'translateX(0) scale(1)' },
      { transform: 'translateX(10px) scale(1.1)' },
      { transform: 'translateX(0) scale(1)' }
    ], {
      duration: 200, // Faster animation
      easing: 'steps(3, end)'
    });

    // Defender flash
    setTimeout(() => {
      defenderEl.animate([
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.5)' },
        { filter: 'brightness(1)' }
      ], {
        duration: 150, // Faster flash
        easing: 'steps(3, end)'
      });
    }, 100);
  }

  function showEffectiveness(effectiveness) {
    const effectDiv =
  document.getElementById('effectiveness');
    if (!effectDiv) return;

    effectDiv.textContent =
  battle.getEffectivenessText(effectiveness);
    effectDiv.className = 'effectiveness';

    if (effectiveness > 1) {
      effectDiv.classList.add('super-effective');
    } else if (effectiveness < 1 && effectiveness > 0) {
      effectDiv.classList.add('not-very-effective');
    } else if (effectiveness === 0) {
      effectDiv.classList.add('no-effect');
    }

    effectDiv.classList.remove('hidden');
    setTimeout(() => {
      effectDiv.classList.add('hidden');
    }, 1000); // Faster display
  }

  // ====== Menu System ======
  function switchMenu(menuType) {
    const mainMenu =
  document.getElementById('main-menu');
    const movesMenu =
  document.getElementById('moves-menu');

    if (!mainMenu || !movesMenu) return;

    if (menuType === 'main') {
      mainMenu.classList.remove('hidden');
      movesMenu.classList.add('hidden');
    } else if (menuType === 'moves') {
      mainMenu.classList.add('hidden');
      movesMenu.classList.remove('hidden');
      updateMovesMenu();
    }

    battle.currentMenu = menuType;
  }

  function updateMovesMenu() {
    const moveButtons =
  document.querySelectorAll('.move-btn:not(.back-btn)');

    moveButtons.forEach((btn, index) => {
      if (index < battle.player.moves.length) {
        const moveId = battle.player.moves[index];
        const move = moveDatabase[moveId];
        const currentPP = battle.player.movePP[moveId];
        const maxPP = move.pp;

        btn.textContent = move.name;
        btn.dataset.move = moveId;
        btn.dataset.pp = `${currentPP}/${maxPP}`;

        if (currentPP === 0) {
          btn.classList.add('no-pp');
          btn.disabled = true;
        } else {
          btn.classList.remove('no-pp');
          btn.disabled = false;
        }
      } else {
        btn.style.display = 'none';
      }
    });
  }

  // ====== Battle Logic ======
  async function executeMove(attacker, defender, moveId)
   {
    const move = attacker.useMove(moveId);
    if (!move) {
      pushLog(`${attacker.name} の
  ${moveDatabase[moveId].name} は PPが たりない！`);
      return;
    }

    playSFX('select');
    pushLog(`${attacker.name} の ${move.name}！`);

    // Fast animation delay
    await new Promise(resolve => setTimeout(resolve,
  400));

    if (move.power > 0) {
      // Damage calculation
      const damage = battle.calculateDamage(attacker,
  defender, move);
      const effectiveness =
  battle.getTypeEffectiveness(move.type, defender.type1,
   defender.type2);

      // Animate attack
      const attackerEl = attacker === battle.player ?
  document.getElementById('player') :
  document.getElementById('enemy');
      const defenderEl = attacker === battle.player ?
  document.getElementById('enemy') :
  document.getElementById('player');

      attackAnimation(attackerEl, defenderEl,
  move.type);
      playSFX('attack');

      await new Promise(resolve => setTimeout(resolve,
  250));

      // Apply damage
      const fainted = defender.takeDamage(damage);
      battle.updateUI();

      playSFX('damage');
      pushLog(`${defender.name} に ${damage}
  ダメージ！`);

      // Show effectiveness message
      if (effectiveness !== 1) {
        showEffectiveness(effectiveness);
        await new Promise(resolve => setTimeout(resolve,
   200));

  pushLog(battle.getEffectivenessText(effectiveness));
      }

      // Check if Pokemon fainted
      if (fainted) {
        await new Promise(resolve => setTimeout(resolve,
   300));
        pushLog(`${defender.name} は たおれた！`);

        if (defender === battle.enemy) {
          pushLog('プレイヤーの勝利！');
          battle.player.experience += 20;
          battle.updateEXPBar();
        } else {
          pushLog('プレイヤーの敗北...');
        }
        return;
      }
    } else {
      // Status move
      if (move.effect) {
        applyMoveEffect(move.effect, attacker,
  defender);
      }
    }
  }

  function applyMoveEffect(effect, attacker, defender) {
    switch (effect.type) {
      case 'attack_down':
        defender.currentStats.attack = Math.max(1,
  Math.floor(defender.currentStats.attack * 0.75));
        pushLog(`${defender.name} の こうげきが
  さがった！`);
        break;
      case 'defense_down':
        defender.currentStats.defense = Math.max(1,
  Math.floor(defender.currentStats.defense * 0.75));
        pushLog(`${defender.name} の ぼうぎょが
  さがった！`);
        break;
      case 'defense_up':
        attacker.currentStats.defense =
  Math.floor(attacker.currentStats.defense * 1.25);
        pushLog(`${attacker.name} の ぼうぎょが
  あがった！`);
        break;
    }
  }

  async function enemyTurn() {
    // Simple AI: randomly select a move
    const availableMoves =
  battle.enemy.moves.filter(moveId =>
  battle.enemy.canUseMove(moveId));
    if (availableMoves.length === 0) {
      pushLog(`${battle.enemy.name} は つかえる わざが
  ない！`);
      return;
    }

    const selectedMove =
  availableMoves[Math.floor(Math.random() *
  availableMoves.length)];
    await executeMove(battle.enemy, battle.player,
  selectedMove);
  }

  // ====== Game Initialization ======
  function initializeBattle() {
    // Initialize battle with default Pokemon
    const playerData = pokemonDatabase.mon004; //
  Charmander
    const enemyData = pokemonDatabase.mon001;  //
  Bulbasaur

    battle.initializePokemon(playerData, enemyData);

    // Set sprites with fast loading
    setTimeout(() => {
      setSprite(document.getElementById('player'),
  playerData.sprites.back, '#ff8844', playerData.name);
      setSprite(document.getElementById('enemy'),
  enemyData.sprites.front, '#6adf95', enemyData.name);
    }, 100);

    // Initial log messages
    pushLog(`やせいの ${enemyData.name} が
  とびだしてきた！`);
    pushLog(`いけ！ ${playerData.name}！`);
  }

  // ====== Event Handlers ======
  document.addEventListener('DOMContentLoaded', () => {
    initializeAudio();

    // Title screen start button
    const startBtn =
  document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        playSFX('select');
        showScene('intro');
      });
    }

    // Continue button for dialog
    const continueBtn =
  document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        playSFX('select');
        dialogIndex++;
        if (dialogIndex >= introDialogs.length) {
          showScene('battle');
        } else {
          showDialog();
        }
      });
    }

    // Audio controls
    const btnBgm = document.getElementById('btnBgm');
    if (btnBgm && audioElements.bgm) {
      btnBgm.addEventListener('click', async () => {
        try {
          if (audioElements.bgm.paused) {
            await audioElements.bgm.play();
            btnBgm.textContent = 'BGM ⏸';
          } else {
            audioElements.bgm.pause();
            btnBgm.textContent = 'BGM ▶︎';
          }
        } catch (e) {

  pushLog('※ユーザー操作後でないと音が出せません');
        }
      });
    }

    const btnSfx = document.getElementById('btnSfx');
    if (btnSfx) {
      btnSfx.addEventListener('click', () => {
        battle.sfxEnabled = !battle.sfxEnabled;
        btnSfx.textContent = battle.sfxEnabled ? 'SFX
  ⏸' : 'SFX ▶︎';
      });
    }

    const vol = document.getElementById('vol');
    if (vol) {
      vol.addEventListener('input', () => {
        if (audioElements.bgm) audioElements.bgm.volume
  = +vol.value;
        Object.values(audioElements.sfx).forEach(sfx =>
  {
          if (sfx) sfx.volume = +vol.value;
        });
      });
    }

    // Battle menu handlers - using event delegation for
   fast response
    document.addEventListener('click', async (e) => {
      if (currentScene !== 'battle') return;

      // Main menu actions
      if (e.target.dataset.act === 'atk') {
        playSFX('select');
        switchMenu('moves');
      } else if (e.target.dataset.act === 'switch') {
        playSFX('select');
        pushLog('ほかに たたかえる ポケモンが
  いない！');
      } else if (e.target.dataset.act === 'item') {
        playSFX('select');
        pushLog('どうぐを もっていない！');
      } else if (e.target.dataset.act === 'run') {
        playSFX('select');
        pushLog('うまく にげられた！');
      }

      // Move selection
      else if (e.target.classList.contains('move-btn')
  && e.target.dataset.move) {
        if (e.target.disabled) return;

        const moveId = e.target.dataset.move;
        switchMenu('main');

        // Player turn
        await executeMove(battle.player, battle.enemy,
  moveId);

        // Check if battle continues
        if (battle.enemy.currentHP > 0 &&
  battle.player.currentHP > 0) {
          await new Promise(resolve =>
  setTimeout(resolve, 500));
          await enemyTurn();
        }
      }

      // Back button
      else if (e.target.classList.contains('back-btn'))
  {
        playSFX('select');
        switchMenu('main');
      }
    });

    // Fast keyboard support
    document.addEventListener('keydown', (e) => {
      if (currentScene === 'battle') {
        if (battle.currentMenu === 'main') {
          const actions = ['atk', 'switch', 'item',
  'run'];
          const key = parseInt(e.key);
          if (key >= 1 && key <= 4) {
            const btn = document.querySelector(`[data-ac
  t="${actions[key-1]}"]`);
            if (btn) btn.click();
          }
        } else if (battle.currentMenu === 'moves') {
          const key = parseInt(e.key);
          if (key >= 1 && key <= 4) {
            const btn =
  document.querySelector(`.move-btn:nth-child(${key})`);
            if (btn && !btn.disabled) btn.click();
          } else if (e.key === 'Escape') {
            document.querySelector('.back-btn').click();
          }
        }
      } else if (currentScene === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById('start-btn').click();
        }
      } else if (currentScene === 'intro') {
        if (e.key === 'Enter' || e.key === ' ') {

  document.getElementById('continue-btn').click();
        }
      }
    });

    // Initialize audio volumes
    const volSlider = document.getElementById('vol');
    if (volSlider) {
      if (audioElements.bgm) audioElements.bgm.volume =
  +volSlider.value;
      Object.values(audioElements.sfx).forEach(sfx => {
        if (sfx) sfx.volume = +volSlider.value;
      });
    }
  });
