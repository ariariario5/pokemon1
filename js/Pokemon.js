// ポケモン実体クラス
class Pokemon {
    constructor(def, level = 5) {
        this.id = def.id;
        this.name = def.name;
        this.types = def.types;
        this.level = level;

        // 個体値は固定（簡略化）
        const iv = 15; // 0-31の中間値

        // ステータス計算（簡略化された初代式）
        this.maxHp = Math.floor(((def.base.hp + iv) * 2 * level) / 100) + level + 10;
        this.hp = this.maxHp;
        this.atk = Math.floor(((def.base.atk + iv) * 2 * level) / 100) + 5;
        this.def = Math.floor(((def.base.def + iv) * 2 * level) / 100) + 5;
        this.spa = Math.floor(((def.base.spa + iv) * 2 * level) / 100) + 5;
        this.spd = Math.floor(((def.base.spd + iv) * 2 * level) / 100) + 5;
        this.spe = Math.floor(((def.base.spe + iv) * 2 * level) / 100) + 5;

        // 状態
        this.status = null; // "burn", "poison", "paralysis", "freeze", "sleep"
        this.statusTurns = 0;

        // ステータス変化ランク（-6〜+6）
        this.statStages = {
            atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
            accuracy: 0, evasion: 0
        };

        // 技（4つまで）
        this.moves = def.learnset.slice(0, 4).map(moveId => {
            const moveData = gameData.getMove(moveId);
            return {
                id: moveId,
                name: moveData?.name || moveId,
                pp: moveData?.pp || 0,
                maxPp: moveData?.pp || 0
            };
        });

        // スプライト
        this.frontSprite = def.front;
        this.backSprite = def.back;

        // 経験値
        this.exp = 0;
        this.expToNext = this.calculateExpToNext();
    }

    isFainted() {
        return this.hp <= 0;
    }

    calculateExpToNext() {
        // 簡単な経験値テーブル
        return Math.floor(Math.pow(this.level + 1, 3) * 0.8);
    }

    gainExp(amount) {
        this.exp += amount;

        let leveledUp = false;
        while (this.exp >= this.expToNext && this.level < 100) {
            this.exp -= this.expToNext;
            this.level++;
            this.levelUp();
            leveledUp = true;
            this.expToNext = this.calculateExpToNext();
        }

        return leveledUp;
    }

    levelUp() {
        const def = gameData.getPokemon(this.id);
        if (!def) return;

        // レベルアップ時のステータス上昇
        const hpGain = Math.floor(Math.random() * 3) + 2; // 2-4
        const statGain = Math.floor(Math.random() * 2) + 1; // 1-2

        const oldMaxHp = this.maxHp;
        this.maxHp += hpGain;
        this.hp += hpGain; // 現在HPも回復

        this.atk += statGain;
        this.def += statGain;
        this.spa += statGain;
        this.spd += statGain;
        this.spe += statGain;

        return { hpGain, statGain };
    }

    getEffectiveStat(statName) {
        let baseStat;
        switch (statName) {
            case 'atk': baseStat = this.atk; break;
            case 'def': baseStat = this.def; break;
            case 'spa': baseStat = this.spa; break;
            case 'spd': baseStat = this.spd; break;
            case 'spe': baseStat = this.spe; break;
            default: return baseStat;
        }

        const stage = this.statStages[statName] || 0;

        // ステータス変化の倍率計算
        let multiplier = 1.0;
        if (stage > 0) {
            multiplier = (2 + stage) / 2;
        } else if (stage < 0) {
            multiplier = 2 / (2 + Math.abs(stage));
        }

        return Math.floor(baseStat * multiplier);
    }

    applyStatusEffect(status, chance = 1.0) {
        if (this.status !== null) return false; // 既に状態異常

        if (Math.random() <= chance) {
            this.status = status;
            this.statusTurns = 0;
            return true;
        }
        return false;
    }

    processStatusDamage() {
        let damage = 0;

        if (this.status === 'burn') {
            damage = Math.max(1, Math.floor(this.maxHp / 16));
        } else if (this.status === 'poison') {
            damage = Math.max(1, Math.floor(this.maxHp / 8));
        }

        if (damage > 0) {
            this.hp = Math.max(0, this.hp - damage);
            return damage;
        }

        return 0;
    }

    canMove() {
        if (this.isFainted()) return false;

        // まひ状態での行動不能判定（25%確率）
        if (this.status === 'paralysis' && Math.random() < 0.25) {
            return false;
        }

        // 他の状態異常もここで処理可能
        return true;
    }

    healStatus(statusesToHeal = null) {
        if (statusesToHeal === null) {
            // 全状態異常回復
            this.status = null;
            this.statusTurns = 0;
            return true;
        } else if (Array.isArray(statusesToHeal) && statusesToHeal.includes(this.status)) {
            this.status = null;
            this.statusTurns = 0;
            return true;
        }
        return false;
    }

    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp; // 実際に回復した量
    }

    getHpPercentage() {
        return this.maxHp > 0 ? (this.hp / this.maxHp) * 100 : 0;
    }

    getExpPercentage() {
        return this.expToNext > 0 ? (this.exp / this.expToNext) * 100 : 0;
    }
}