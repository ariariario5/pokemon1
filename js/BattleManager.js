// バトルマネージャークラス
class BattleManager {
    constructor() {
        this.gameState = {
            player: {
                party: [],
                activeIdx: 0,
                items: {
                    potion: 3,
                    super_potion: 2,
                    antidote: 2,
                    paralyze_heal: 2,
                    burn_heal: 1,
                    awakening: 1
                }
            },
            enemy: {
                party: [],
                activeIdx: 0
            },
            turn: "player",
            phase: "select", // "select", "anim", "damage", "result"
            battleLog: [],
            turnCount: 0
        };

        this.ui = null;
        this.audioManager = null;
    }

    initializeBattle(playerParty, enemyParty) {
        // プレイヤーパーティ初期化（3体）
        this.gameState.player.party = playerParty.map(pokemonId => {
            const def = gameData.getPokemon(pokemonId);
            return new Pokemon(def, 5);
        });

        // 敵パーティ初期化
        this.gameState.enemy.party = enemyParty.map(pokemonId => {
            const def = gameData.getPokemon(pokemonId);
            return new Pokemon(def, 5);
        });

        this.gameState.player.activeIdx = 0;
        this.gameState.enemy.activeIdx = 0;
        this.gameState.turn = "player";
        this.gameState.phase = "select";
        this.gameState.turnCount = 0;

        this.addToBattleLog(`やせいの ${this.getActiveEnemyPokemon().name}が とびだしてきた！`);
        this.addToBattleLog(`いけ！ ${this.getActivePlayerPokemon().name}！`);

        return true;
    }

    getActivePlayerPokemon() {
        return this.gameState.player.party[this.gameState.player.activeIdx];
    }

    getActiveEnemyPokemon() {
        return this.gameState.enemy.party[this.gameState.enemy.activeIdx];
    }

    // ターン順決定
    determineTurnOrder(playerAction, enemyAction) {
        const playerPokemon = this.getActivePlayerPokemon();
        const enemyPokemon = this.getActiveEnemyPokemon();

        // 交代は必ず先行
        if (playerAction.type === 'switch') return ['player', 'enemy'];
        if (enemyAction.type === 'switch') return ['enemy', 'player'];

        // アイテム使用も先行
        if (playerAction.type === 'item') return ['player', 'enemy'];

        // 技の優先度チェック
        const playerMove = gameData.getMove(playerAction.moveId);
        const enemyMove = gameData.getMove(enemyAction.moveId);

        const playerPriority = playerMove?.priority || 0;
        const enemyPriority = enemyMove?.priority || 0;

        if (playerPriority !== enemyPriority) {
            return playerPriority > enemyPriority ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        // 素早さで判定
        const playerSpeed = playerPokemon.getEffectiveStat('spe');
        const enemySpeed = enemyPokemon.getEffectiveStat('spe');

        // まひ状態は素早さ1/4
        const finalPlayerSpeed = playerPokemon.status === 'paralysis' ? Math.floor(playerSpeed / 4) : playerSpeed;
        const finalEnemySpeed = enemyPokemon.status === 'paralysis' ? Math.floor(enemySpeed / 4) : enemySpeed;

        if (finalPlayerSpeed === finalEnemySpeed) {
            return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        return finalPlayerSpeed > finalEnemySpeed ? ['player', 'enemy'] : ['enemy', 'player'];
    }

    // ダメージ計算
    calculateDamage(attacker, defender, moveId) {
        const move = gameData.getMove(moveId);
        if (!move || move.power === 0) return { damage: 0, critical: false, effectiveness: 1.0, missed: false };

        // 命中判定
        if (Math.random() * 100 > move.accuracy) {
            return { damage: 0, critical: false, effectiveness: 1.0, missed: true };
        }

        // ステータス取得
        let attackStat, defenseStat;
        if (move.category === 'physical') {
            attackStat = attacker.getEffectiveStat('atk');
            defenseStat = defender.getEffectiveStat('def');
            // やけど状態は物理攻撃半減
            if (attacker.status === 'burn') {
                attackStat = Math.floor(attackStat / 2);
            }
        } else {
            attackStat = attacker.getEffectiveStat('spa');
            defenseStat = defender.getEffectiveStat('spd');
        }

        // クリティカル判定
        const critical = Math.random() < (1/16);
        const criticalMultiplier = critical ? 2.0 : 1.0;

        // タイプ相性
        const effectiveness = gameData.getTypeEffectiveness(move.type, defender.types);

        // ダメージ計算
        const levelFactor = (2 * attacker.level + 10) / 250;
        const baseDamage = Math.floor(levelFactor * (attackStat / defenseStat) * move.power + 2);

        // ランダム要素（85-100%）
        const randomFactor = 0.85 + Math.random() * 0.15;

        // 最終ダメージ
        let finalDamage = Math.floor(baseDamage * criticalMultiplier * effectiveness * randomFactor);
        finalDamage = Math.max(1, finalDamage);

        return {
            damage: finalDamage,
            critical: critical,
            effectiveness: effectiveness,
            missed: false
        };
    }

    // 技使用
    async useMove(attacker, defender, moveId) {
        const move = gameData.getMove(moveId);
        if (!move) return false;

        // PP消費（実装省略）

        if (move.category === 'status') {
            return this.useStatusMove(attacker, defender, move);
        } else {
            return this.useDamageMove(attacker, defender, move);
        }
    }

    async useDamageMove(attacker, defender, move) {
        // moveIdを直接渡すのではなく、move.nameまたは適切なIDを探す
        const moveId = Object.keys(gameData.moveData || {}).find(id => {
            const moveData = gameData.moveData[id];
            return moveData && moveData.name === move.name;
        }) || move.id;

        const result = this.calculateDamage(attacker, defender, moveId);

        if (result.missed) {
            this.addToBattleLog(`${attacker.name}の こうげきは はずれた！`);
            return true;
        }

        // ダメージ適用
        defender.hp = Math.max(0, defender.hp - result.damage);

        // メッセージ
        let messages = [`${defender.name}に ${result.damage}の ダメージ！`];

        if (result.critical) {
            messages.push("きゅうしょに あたった！");
        }

        if (result.effectiveness > 1) {
            messages.push("こうかは ばつぐんだ！");
        } else if (result.effectiveness < 1) {
            messages.push("こうかは いまひとつのようだ...");
        }

        messages.forEach(msg => this.addToBattleLog(msg));

        // 追加効果
        if (move.ailment && !defender.isFainted()) {
            for (const [ailment, chance] of Object.entries(move.ailment)) {
                if (defender.applyStatusEffect(ailment, chance)) {
                    this.addToBattleLog(`${defender.name}は ${this.getStatusName(ailment)}になった！`);
                }
            }
        }

        return true;
    }

    async useStatusMove(attacker, defender, move) {
        if (move.statChange) {
            for (const [stat, change] of Object.entries(move.statChange)) {
                const target = change > 0 ? attacker : defender;
                const oldStage = target.statStages[stat] || 0;
                const newStage = Math.max(-6, Math.min(6, oldStage + change));
                target.statStages[stat] = newStage;

                if (newStage !== oldStage) {
                    const statName = this.getStatName(stat);
                    const direction = change > 0 ? 'あがった' : 'さがった';
                    this.addToBattleLog(`${target.name}の ${statName}が ${direction}！`);
                } else {
                    const statName = this.getStatName(stat);
                    const direction = change > 0 ? 'あがらない' : 'さがらない';
                    this.addToBattleLog(`${target.name}の ${statName}は もう ${direction}！`);
                }
            }
        }

        if (move.ailment) {
            for (const [ailment, chance] of Object.entries(move.ailment)) {
                if (defender.applyStatusEffect(ailment, chance)) {
                    this.addToBattleLog(`${defender.name}は ${this.getStatusName(ailment)}になった！`);
                }
            }
        }

        return true;
    }

    // ポケモン交代
    switchPokemon(isPlayer, newIndex) {
        const side = isPlayer ? this.gameState.player : this.gameState.enemy;
        const newPokemon = side.party[newIndex];

        if (!newPokemon || newPokemon.isFainted() || newIndex === side.activeIdx) {
            return false;
        }

        side.activeIdx = newIndex;
        this.addToBattleLog(`${newPokemon.name}！ いけ！`);
        return true;
    }

    // アイテム使用
    useItem(itemId, targetIndex) {
        const item = gameData.getItem(itemId);
        const target = this.gameState.player.party[targetIndex];

        if (!item || !target || this.gameState.player.items[itemId] <= 0) {
            return false;
        }

        // HP回復
        if (item.hp) {
            const healed = target.heal(item.hp);
            this.addToBattleLog(`${target.name}の HPが ${healed} かいふくした！`);
        }

        // 状態異常回復
        if (item.statusClear) {
            if (target.healStatus(item.statusClear)) {
                this.addToBattleLog(`${target.name}の 状態異常が かいふくした！`);
            }
        }

        // アイテム消費
        this.gameState.player.items[itemId]--;
        this.addToBattleLog(`${item.name}を つかった！`);

        return true;
    }

    // 状態異常処理
    processEndOfTurn() {
        const playerPokemon = this.getActivePlayerPokemon();
        const enemyPokemon = this.getActiveEnemyPokemon();

        [playerPokemon, enemyPokemon].forEach(pokemon => {
            const damage = pokemon.processStatusDamage();
            if (damage > 0) {
                const statusName = this.getStatusName(pokemon.status);
                this.addToBattleLog(`${pokemon.name}は ${statusName}で ${damage}の ダメージ！`);
            }
        });
    }

    // 戦闘終了判定
    checkBattleEnd() {
        const playerAlive = this.gameState.player.party.some(p => !p.isFainted());
        const enemyAlive = this.gameState.enemy.party.some(p => !p.isFainted());

        if (!playerAlive) {
            return 'defeat';
        } else if (!enemyAlive) {
            return 'victory';
        }

        return null;
    }

    // ヘルパー関数
    addToBattleLog(message, type = 'system') {
        this.gameState.battleLog.push({ message, type, timestamp: Date.now() });
        console.log(`[BATTLE LOG] ${message}`);
    }

    getStatusName(status) {
        const statusNames = {
            burn: 'やけど',
            poison: 'どく',
            paralysis: 'まひ',
            freeze: 'こおり',
            sleep: 'ねむり'
        };
        return statusNames[status] || status;
    }

    getStatName(stat) {
        const statNames = {
            atk: 'こうげき',
            def: 'ぼうぎょ',
            spa: 'とくこう',
            spd: 'とくぼう',
            spe: 'すばやさ',
            accuracy: 'めいちゅう',
            evasion: 'かいひ'
        };
        return statNames[stat] || stat;
    }
}

// グローバルインスタンス
const battleManager = new BattleManager();