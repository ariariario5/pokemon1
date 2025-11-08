 // ====== Enhanced Pokemon Battle System - FIXED
  VERSION ======
  // Complete battle mechanics with proper state
  management and sprite handling

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
  bug: 2, steel: 2 },
    water: { fire: 2, grass: 0.5, water: 0.5, ground: 2,
   rock: 2, dragon: 0.5 },
    grass: { water: 2, fire: 0.5, grass: 0.5, poison:
  0.5, ground: 2, rock: 2, flying: 0.5, bug: 0.5,
  dragon: 0.5, steel: 0.5 },
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock:
  0.5, ghost: 0.5, steel: 0 },
    electric: { water: 2, grass: 0.5, ground: 0, flying:
   2, dragon: 0.5, electric: 0.5 }
  };

  // FIXED: Battle state management with proper scene
  transitions
  class BattleState {
    constructor() {
      this.player = null;
      this.enemy = null;
      this.currentMenu = 'intro'; // intro, main, moves
      this.currentPhase = 'introduction'; //
  introduction, battle, victory, defeat
      this.turnQueue = [];
      this.battlePhase = 'select'; // select, animate,
  resolve
      this.sfxEnabled = true;
      this.isProcessing = false; // Prevent multiple
  actions
    }

    initializePokemon(playerData, enemyData) {
      this.player = new Pokemon(playerData, 5);
      this.enemy = new Pokemon(enemyData, 5);
      this.updateUI();
    }

    // FIXED: Scene transition management
    switchPhase(newPhase) {
      this.currentPhase = newPhase;

      const introEl =
  document.getElementById('intro-phase');
      const mainMenuEl =
  document.getElementById('main-menu');
      const movesMenuEl =
  document.getElementById('moves-menu');

      // Hide all menus first
      introEl.classList.add('hidden');
      mainMenuEl.classList.add('hidden');
      movesMenuEl.classList.add('hidden');

      // Show appropriate menu
      switch (newPhase) {
        case 'introduction':
          introEl.classList.remove('hidden');
          this.currentMenu = 'intro';
          break;
        case 'battle':
          mainMenuEl.classList.remove('hidden');
          this.currentMenu = 'main';
          break;
        case 'move_selection':
          movesMenuEl.classList.remove('hidden');
          this.currentMenu = 'moves';
          break;
      }
    }

    calculateDamage(attacker, defender, move) {
      if (move.power === 0) return 0;

      const level = attacker.level;
      const power = move.power;
      const attack = attacker.currentStats.attack;
      const defense = defender.currentStats.defense;

      // Basic damage calculation (simplified Pokemon
  formula)
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
  typeEffectiveness[moveType][defenderType1]) {
        effectiveness *=
  typeEffectiveness[moveType][defenderType1];
      }

      if (defenderType2 && typeEffectiveness[moveType]
  && typeEffectiveness[moveType][defenderType2]) {
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
      document.getElementById('player-name').textContent
   = this.player.name;

  document.getElementById('player-level').textContent =
  this.player.level;
      document.getElementById('player-hp-current').textC
  ontent = this.player.currentHP;

  document.getElementById('player-hp-max').textContent =
   this.player.maxHP;

      // Update enemy info
      document.getElementById('enemy-name').textContent
  = this.enemy.name;
      document.getElementById('enemy-level').textContent
   = this.enemy.level;
      document.getElementById('enemy-hp-current').textCo
  ntent = this.enemy.currentHP;

  document.getElementById('enemy-hp-max').textContent =
  this.enemy.maxHP;

      // Update introduction text
      document.getElementById('intro-enemy-name').textCo
  ntent = this.enemy.name;

      // Update HP bars
      this.updateHPBar('player', this.player);
      this.updateHPBar('enemy', this.enemy);

      // Update EXP bar
      this.updateEXPBar();
    }

    updateHPBar(type, pokemon) {
      const hpBar =
  document.getElementById(`${type}-hp-bar`);
      const hpPercentage = (pokemon.currentHP /
  pokemon.maxHP) * 100;

      hpBar.style.width = `${hpPercentage}%`;

      // Change color based on HP
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
      const expPercentage = (this.player.experience /
  100) * 100; // Simplified EXP system
      expBar.style.width = `${expPercentage}%`;
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
      this.moves = data.moves.slice(0, 4); // Max 4
  moves
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
   // Random EXP for demo

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
  const bgm = document.getElementById('bgm');
  const btnBgm = document.getElementById('btnBgm');
  const btnSfx = document.getElementById('btnSfx');
  const vol = document.getElementById('vol');

  // Sound effects
  const sfxElements = {
    attack: document.getElementById('sfx-attack'),
    damage: document.getElementById('sfx-damage'),
    heal: document.getElementById('sfx-heal'),
    select: document.getElementById('sfx-select')
  };

  // BGM controls
  btnBgm.onclick = async () => {
    try {
      if (bgm.paused) {
        await bgm.play();
        btnBgm.textContent = 'BGM ⏸';
      } else {
        bgm.pause();
        btnBgm.textContent = 'BGM ▶︎';
      }
    } catch (e) {
      pushLog('※ユーザー操作後でないと音が出せません');
    }
  };

  // SFX controls
  btnSfx.onclick = () => {
    battle.sfxEnabled = !battle.sfxEnabled;
    btnSfx.textContent = battle.sfxEnabled ? 'SFX ⏸' :
  'SFX ▶︎';
  };

  // Volume control
  vol.oninput = () => {
    bgm.volume = +vol.value;
    Object.values(sfxElements).forEach(sfx => {
      if (sfx) sfx.volume = +vol.value;
    });
  };

  // Initialize audio volumes
  bgm.volume = +vol.value;
  Object.values(sfxElements).forEach(sfx => {
    if (sfx) sfx.volume = +vol.value;
  });

  // Play sound effect
  function playSFX(type) {
    if (!battle.sfxEnabled || !sfxElements[type])
  return;

    try {
      sfxElements[type].currentTime = 0;
      sfxElements[type].play().catch(() => {}); //
  Ignore errors silently
    } catch (e) {
      // Silent fail for missing audio files
    }
  }

  // ====== FIXED: Sprite System with proper fallback
  ======
  function fallbackSVG(color = '#4caf50', pokemonName =
  'Pokemon') {
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg'
  width='144' height='144' viewBox='0 0 144 144'>
        <rect width='144' height='144' fill='${color}'
  rx='8'/>
        <circle cx='72' cy='75' r='42' fill='#ffffff'
  opacity='0.3' />
        <circle cx='57' cy='66' r='8' fill='#000'/>
        <circle cx='87' cy='66' r='8' fill='#000'/>
        <path d='M50 90 Q72 105 94 90' stroke='#000'
  stroke-width='3' fill='none'/>
        <text x='72' y='120' text-anchor='middle'
  fill='#fff' font-family='monospace'
  font-size='10'>${pokemonName}</text>
      </svg>`
    );
    return `data:image/svg+xml;charset=UTF-8,${svg}`;
  }

  function setSprite(el, path, fallbackColor,
  pokemonName) {
    // Set fallback immediately
    el.src = fallbackSVG(fallbackColor, pokemonName);

    // Try to load the actual image
    const img = new Image();
    img.onload = () => {
      el.src = path;
    };
    img.onerror = () => {
      // Keep the fallback SVG
      console.log(`Sprite not found: ${path}, using
  fallback`);
    };
    img.src = path;
  }

  // ====== Battle Log System ======
  const log = document.getElementById('log');
  let logs = [];

  function pushLog(text) {
    logs.push(text);
    const row = document.createElement('div');
    row.className = 'row';

    const short = text.length > 40 ? text.slice(0, 40) +
   '…' : text;
    row.innerHTML = `<span
  class="short">${short}</span>` +
                    (text.length > 40 ? ` <span
  class="more">もっと見る</span>` : '');
    row.dataset.full = text;

    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  // Log expansion functionality
  log.addEventListener('click', e => {
    const more = e.target.closest('.more');
    if (!more) return;

    const row = more.parentElement;
    const expanded = row.dataset.expanded === '1';

    if (!expanded) {
      row.querySelector('.short').textContent =
  row.dataset.full;
      more.textContent = '閉じる';
      row.dataset.expanded = '1';
    } else {
      const fullText = row.dataset.full;
      row.querySelector('.short').textContent =
  fullText.length > 40 ? fullText.slice(0, 40) + '…' :
  fullText;
      more.textContent = 'もっと見る';
      row.dataset.expanded = '0';
    }
  });

  log.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement ===
  log) {
      const last =
  log.lastElementChild?.querySelector('.more');
      if (last) last.click();
    }
  });

  // ====== Animation System ======
  function attackAnimation(attackerEl, defenderEl,
  moveType = 'normal') {
    // Attacker animation
    attackerEl.animate([
      { transform: 'translateX(0) scale(1)' },
      { transform: 'translateX(8px) scale(1.1)' },
      { transform: 'translateX(0) scale(1)' }
    ], {
      duration: 300,
      easing: 'steps(3, end)'
    });

    // Defender flash animation
    setTimeout(() => {
      defenderEl.animate([
        { filter: 'brightness(1) hue-rotate(0deg)' },
        { filter: 'brightness(3) hue-rotate(180deg)' },
        { filter: 'brightness(1) hue-rotate(0deg)' }
      ], {
        duration: 200,
        easing: 'steps(3, end)'
      });

      // Screen shake for powerful attacks
      if (moveType !== 'normal') {
        document.getElementById('field').classList.add('
  screen-shake');
        setTimeout(() => {
          document.getElementById('field').classList.rem
  ove('screen-shake');
        }, 500);
      }
    }, 150);

    // Particle effects
    createParticleEffect(defenderEl, moveType);
  }

  function createParticleEffect(targetEl, moveType) {
    const effectsContainer =
  document.getElementById('battle-effects');
    const rect = targetEl.getBoundingClientRect();
    const fieldRect = document.getElementById('field').g
  etBoundingClientRect();

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = `effect-particle
  effect-${moveType}`;

      const x = rect.left - fieldRect.left +
  Math.random() * rect.width;
      const y = rect.top - fieldRect.top + Math.random()
   * rect.height;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      effectsContainer.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 2000);
    }
  }

  function showEffectiveness(effectiveness) {
    const effectDiv =
  document.getElementById('effectiveness');
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
    }, 1500);
  }

  // ====== Menu System with State Management ======
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
    if (battle.isProcessing) return;
    battle.isProcessing = true;

    const move = attacker.useMove(moveId);
    if (!move) {
      pushLog(`${attacker.name} の
  ${moveDatabase[moveId].name} は PPが たりない！`);
      battle.isProcessing = false;
      return;
    }

    playSFX('select');
    pushLog(`${attacker.name} の ${move.name}！`);

    // Animation delay
    await new Promise(resolve => setTimeout(resolve,
  800));

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
  500));

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
   300));

  pushLog(battle.getEffectivenessText(effectiveness));
      }

      // Check if Pokemon fainted
      if (fainted) {
        await new Promise(resolve => setTimeout(resolve,
   500));
        pushLog(`${defender.name} は たおれた！`);

        if (defender === battle.enemy) {
          // Player wins
          pushLog('プレイヤーの勝利！');
          battle.player.experience += 20;
          battle.updateEXPBar();
          battle.switchPhase('victory');
        } else {
          // Enemy wins
          pushLog('プレイヤーの敗北...');
          battle.switchPhase('defeat');
        }
        battle.isProcessing = false;
        return;
      }
    } else {
      // Status move
      if (move.effect) {
        applyMoveEffect(move.effect, attacker,
  defender);
      }
    }

    // Apply status effect if any
    if (move.effect && move.effect.type && Math.random()
   * 100 < move.effect.chance) {
      applyStatusEffect(defender, move.effect.type);
    }

    battle.isProcessing = false;
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

  function applyStatusEffect(pokemon, effectType) {
    switch (effectType) {
      case 'burn':
        pokemon.statusEffects.burn = true;
        pushLog(`${pokemon.name} は やけどを おった！`);
        break;
      case 'poison':
        pokemon.statusEffects.poison = true;
        pushLog(`${pokemon.name} は どくを うけた！`);
        break;
    }
    updateStatusDisplay(pokemon);
  }

  function updateStatusDisplay(pokemon) {
    const statusElement = pokemon === battle.player ?
      document.getElementById('player-status') :
      document.getElementById('enemy-status');

    statusElement.innerHTML = '';

    Object.keys(pokemon.statusEffects).forEach(effect =>
   {
      if (pokemon.statusEffects[effect]) {
        const effectSpan =
  document.createElement('span');
        effectSpan.className = `status-effect
  status-${effect}`;
        effectSpan.textContent = effect.toUpperCase();
        statusElement.appendChild(effectSpan);
      }
    });
  }

  async function enemyTurn() {
    if (battle.isProcessing) return;

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

  // ====== FIXED: Event Handlers with State Management
  ======
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize battle with default Pokemon
    const playerData = pokemonDatabase.mon004; //
  Charmander
    const enemyData = pokemonDatabase.mon001;  //
  Bulbasaur

    battle.initializePokemon(playerData, enemyData);

    // FIXED: Set sprites with proper fallback
    setSprite(document.getElementById('player'),
  playerData.sprites.back, '#ff8844', playerData.name);
    setSprite(document.getElementById('enemy'),
  enemyData.sprites.front, '#6adf95', enemyData.name);

    // Start in introduction phase
    battle.switchPhase('introduction');
  });

  // FIXED: Introduction continue button
  document.addEventListener('click', (e) => {
    if (e.target.id === 'intro-continue') {
      playSFX('select');
      pushLog(`やせいの ${battle.enemy.name} が
  とびだしてきた！`);
      pushLog(`いけ！ ${battle.player.name}！`);
      battle.switchPhase('battle');
    }
  });

  // Main menu handlers
  document.addEventListener('click', async (e) => {
    if (battle.isProcessing) return;

    if (e.target.dataset.act === 'atk') {
      playSFX('select');
      battle.switchPhase('move_selection');
      updateMovesMenu();
    } else if (e.target.dataset.act === 'switch') {
      playSFX('select');
      pushLog('ほかに たたかえる ポケモンが いない！');
    } else if (e.target.dataset.act === 'item') {
      playSFX('select');
      pushLog('どうぐを もっていない！');
    } else if (e.target.dataset.act === 'run') {
      playSFX('select');
      pushLog('うまく にげられた！');
    }
  });

  // Move selection handlers
  document.addEventListener('click', async (e) => {
    if (battle.isProcessing) return;

    if (e.target.classList.contains('move-btn') &&
  e.target.dataset.move) {
      if (e.target.disabled) return;

      const moveId = e.target.dataset.move;
      battle.switchPhase('battle');

      // Player turn
      await executeMove(battle.player, battle.enemy,
  moveId);

      // Check if battle continues
      if (battle.enemy.currentHP > 0 &&
  battle.player.currentHP > 0 && !battle.isProcessing) {
        await new Promise(resolve => setTimeout(resolve,
   1000));
        await enemyTurn();
      }
    } else if (e.target.classList.contains('back-btn'))
  {
      playSFX('select');
      battle.switchPhase('battle');
    }
  });

  // FIXED: Keyboard support with state management
  document.addEventListener('keydown', (e) => {
    if (battle.isProcessing) return;

    if (battle.currentMenu === 'intro') {
      if (e.key === 'Enter' || e.key === ' ') {

  document.getElementById('intro-continue').click();
      }
    } else if (battle.currentMenu === 'main') {
      switch (e.key) {
        case '1':
  document.querySelector('[data-act="atk"]')?.click();
  break;
        case '2': document.querySelector('[data-act="swi
  tch"]')?.click(); break;
        case '3':
  document.querySelector('[data-act="item"]')?.click();
  break;
        case '4':
  document.querySelector('[data-act="run"]')?.click();
  break;
      }
    } else if (battle.currentMenu === 'moves') {
      switch (e.key) {
        case '1': document.querySelector('[data-move]:nt
  h-child(1)')?.click(); break;
        case '2': document.querySelector('[data-move]:nt
  h-child(2)')?.click(); break;
        case '3': document.querySelector('[data-move]:nt
  h-child(3)')?.click(); break;
        case '4': document.querySelector('[data-move]:nt
  h-child(4)')?.click(); break;
        case 'Escape':
  document.querySelector('.back-btn')?.click(); break;
      }
    }
  });
