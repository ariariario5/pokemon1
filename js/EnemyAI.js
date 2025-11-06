// 敵AIクラス - 戦略的な行動判定
class EnemyAI {
    constructor() {
        this.difficulty = 'normal'; // easy, normal, hard
    }

    // メインの行動選択
    selectAction(enemyPokemon, playerPokemon) {
        const hpPercent = enemyPokemon.getHpPercentage();

        // 体力が低い場合の判定
        if (hpPercent < 30) {
            // 回復技があれば優先的に使用
            const healingMove = this.findHealingMove(enemyPokemon);
            if (healingMove) {
                return { type: 'move', moveIndex: healingMove.index };
            }

            // 交代可能なポケモンがいれば交代を検討
            if (this.shouldSwitch(enemyPokemon, playerPokemon)) {
                const switchTarget = this.selectSwitchTarget();
                if (switchTarget !== null) {
                    return { type: 'switch', targetIndex: switchTarget };
                }
            }
        }

        // 通常の技選択
        const moveIndex = this.selectBestMove(enemyPokemon, playerPokemon);
        return { type: 'move', moveIndex: moveIndex };
    }

    // 最適な技を選択
    selectBestMove(enemyPokemon, playerPokemon) {
        const moves = enemyPokemon.moves;
        let bestMove = 0;
        let bestScore = -1;

        moves.forEach((move, index) => {
            const score = this.evaluateMove(move, enemyPokemon, playerPokemon);
            if (score > bestScore) {
                bestScore = score;
                bestMove = index;
            }
        });

        // 少しランダム性を加える
        if (Math.random() < 0.2) {
            return Math.floor(Math.random() * moves.length);
        }

        return bestMove;
    }

    // 技の評価
    evaluateMove(move, attacker, defender) {
        const moveData = gameData.getMove(move.id);
        if (!moveData) return 0;

        let score = 0;

        // ダメージ技の評価
        if (moveData.category !== 'status' && moveData.power > 0) {
            // 基本威力
            score += moveData.power;

            // タイプ相性を考慮
            const effectiveness = gameData.getTypeEffectiveness(moveData.type, defender.types);
            score *= effectiveness;

            // 相手のHPが低い場合は高威力技を優先
            const defenderHpPercent = defender.getHpPercentage();
            if (defenderHpPercent < 30) {
                score *= 1.5;
            }

            // 自分のタイプと一致する技（タイプ一致ボーナス）
            if (attacker.types.includes(moveData.type)) {
                score *= 1.2;
            }
        }

        // ステータス技の評価
        if (moveData.category === 'status') {
            // 能力変化技
            if (moveData.statChange) {
                for (const [stat, change] of Object.entries(moveData.statChange)) {
                    if (change > 0) {
                        // 自分の能力上昇
                        score += 30;
                    } else {
                        // 相手の能力低下
                        score += 25;

                        // 既に下がっている場合は価値を下げる
                        const currentStage = defender.statStages[stat] || 0;
                        if (currentStage <= -2) {
                            score -= 15;
                        }
                    }
                }
            }

            // 状態異常技
            if (moveData.ailment) {
                // 相手が既に状態異常でなければ価値が高い
                if (!defender.status) {
                    score += 40;
                } else {
                    score = 0; // 既に状態異常なら使わない
                }
            }
        }

        // 命中率を考慮
        score *= (moveData.accuracy / 100);

        return score;
    }

    // 交代判定
    shouldSwitch(currentPokemon, opponent) {
        // 体力が危険域で、タイプ相性が不利な場合
        const hpPercent = currentPokemon.getHpPercentage();

        if (hpPercent < 25) {
            // 相手の主力技のタイプを予測して不利判定
            const opponentMainType = opponent.types[0];
            const disadvantage = this.checkTypeDisadvantage(currentPokemon.types, opponentMainType);

            if (disadvantage) {
                return true;
            }
        }

        return false;
    }

    // タイプ不利判定
    checkTypeDisadvantage(defendingTypes, attackingType) {
        return defendingTypes.some(defType => {
            const effectiveness = gameData.getTypeEffectiveness(attackingType, [defType]);
            return effectiveness > 1.0;
        });
    }

    // 交代先選択
    selectSwitchTarget() {
        const party = battleManager.gameState.enemy.party;
        const activeIdx = battleManager.gameState.enemy.activeIdx;

        // 体力が最も高く、瀕死でないポケモンを選択
        let bestIdx = null;
        let bestHp = 0;

        party.forEach((pokemon, index) => {
            if (index !== activeIdx && !pokemon.isFainted()) {
                const hpPercent = pokemon.getHpPercentage();
                if (hpPercent > bestHp) {
                    bestHp = hpPercent;
                    bestIdx = index;
                }
            }
        });

        return bestIdx;
    }

    // 回復技検索
    findHealingMove(pokemon) {
        return pokemon.moves.find((move, index) => {
            const moveData = gameData.getMove(move.id);
            return moveData && moveData.name.includes('じこさいせい') ||
                   moveData.name.includes('はねやすめ') ||
                   moveData.name.includes('ねむる');
        });
    }

    // 相手の出したポケモンに対する対策技選択
    selectCounterMove(enemyPokemon, playerPokemon) {
        const playerTypes = playerPokemon.types;

        // プレイヤーのタイプに効果的な技を探す
        let bestMove = 0;
        let bestEffectiveness = 0;

        enemyPokemon.moves.forEach((move, index) => {
            const moveData = gameData.getMove(move.id);
            if (!moveData || moveData.power === 0) return;

            const effectiveness = gameData.getTypeEffectiveness(moveData.type, playerTypes);
            if (effectiveness > bestEffectiveness) {
                bestEffectiveness = effectiveness;
                bestMove = index;
            }
        });

        return bestMove;
    }

    // プレイヤーが交代した直後の「出落ち攻撃」
    selectSwitchPunishMove(enemyPokemon, newPlayerPokemon) {
        // 高威力の技を優先選択
        let bestMove = 0;
        let bestPower = 0;

        enemyPokemon.moves.forEach((move, index) => {
            const moveData = gameData.getMove(move.id);
            if (!moveData) return;

            const power = moveData.power || 0;
            const effectiveness = gameData.getTypeEffectiveness(moveData.type, newPlayerPokemon.types);
            const totalPower = power * effectiveness;

            if (totalPower > bestPower) {
                bestPower = totalPower;
                bestMove = index;
            }
        });

        return bestMove;
    }

    // デバッグ用：AI判断の理由を取得
    getDecisionReason(action, enemyPokemon, playerPokemon) {
        switch (action.type) {
            case 'move':
                const move = enemyPokemon.moves[action.moveIndex];
                const moveData = gameData.getMove(move.id);
                return `AI selected move: ${moveData.name} (score calculation based)`;

            case 'switch':
                return `AI switched to counter player's strategy`;

            default:
                return 'AI used random selection';
        }
    }
}

// グローバルインスタンス
const enemyAI = new EnemyAI();