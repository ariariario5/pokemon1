// UIマネージャークラス
class UIManager {
    constructor() {
        this.elements = {};
        this.currentModal = null;
        this.isModalOpen = false;
    }

    initialize() {
        // DOM要素を取得
        this.elements = {
            // 基本UI
            playerName: document.getElementById('player-name'),
            enemyName: document.getElementById('enemy-name'),
            playerLevel: document.getElementById('player-level'),
            enemyLevel: document.getElementById('enemy-level'),
            playerHp: document.getElementById('player-hp'),
            enemyHp: document.getElementById('enemy-hp'),
            playerCurrentHp: document.getElementById('player-current-hp'),
            playerMaxHp: document.getElementById('player-max-hp'),
            playerExp: document.getElementById('player-exp'),
            playerExpCurrent: document.getElementById('player-exp-current'),
            playerExpNext: document.getElementById('player-exp-next'),

            // バトルメニュー
            mainMenu: document.getElementById('main-menu'),
            movesMenu: document.getElementById('moves-menu'),
            battleMessage: document.getElementById('battle-message'),

            // バトルログ
            battleLog: document.getElementById('battle-log'),
            logContent: document.getElementById('log-content'),
            logToggle: document.getElementById('log-toggle'),
            logClose: document.getElementById('log-close'),

            // モーダル
            partyModal: document.getElementById('partyModal'),
            partyGrid: document.getElementById('partyGrid'),
            partyCancel: document.getElementById('partyCancel'),

            itemModal: document.getElementById('itemModal'),
            itemSelection: document.getElementById('itemSelection'),
            itemTarget: document.getElementById('itemTarget'),
            itemTargetGrid: document.getElementById('itemTargetGrid'),
            itemCancel: document.getElementById('itemCancel'),
            itemTargetBack: document.getElementById('itemTargetBack'),

            // スプライト
            playerSprite: document.getElementById('player-sprite-img'),
            enemySprite: document.getElementById('enemy-sprite-img')
        };

        this.bindEvents();
    }

    bindEvents() {
        // メインメニュー
        this.elements.mainMenu?.addEventListener('click', (e) => this.handleMainMenuClick(e));
        this.elements.movesMenu?.addEventListener('click', (e) => this.handleMovesMenuClick(e));

        // バトルログ
        this.elements.logToggle?.addEventListener('click', () => this.toggleBattleLog());
        this.elements.logClose?.addEventListener('click', () => this.toggleBattleLog());

        // モーダル
        this.elements.partyCancel?.addEventListener('click', () => this.closePartyModal());
        this.elements.itemCancel?.addEventListener('click', () => this.closeItemModal());
        this.elements.itemTargetBack?.addEventListener('click', () => this.showItemSelection());

        // モーダル外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    // バトル開始時の初期化
    initializeBattle() {
        const player = battleManager.getActivePlayerPokemon();
        const enemy = battleManager.getActiveEnemyPokemon();

        if (player && this.elements.playerName) {
            this.elements.playerName.textContent = player.name;
            this.elements.playerLevel.textContent = `Lv. ${player.level}`;
            this.updatePokemonSprite(true, player);
        }

        if (enemy && this.elements.enemyName) {
            this.elements.enemyName.textContent = enemy.name;
            this.elements.enemyLevel.textContent = `Lv. ${enemy.level}`;
            this.updatePokemonSprite(false, enemy);
        }

        this.updateDisplay();
    }

    // スプライト更新（簡易SVG生成）
    updatePokemonSprite(isPlayer, pokemon) {
        const spriteElement = isPlayer ? this.elements.playerSprite : this.elements.enemySprite;
        if (!spriteElement) return;

        // ポケモン種族ごとの色設定
        const pokemonColors = {
            'ヒトカゲ': { primary: '#FF6B35', secondary: '#FFB74D' },
            'フシギダネ': { primary: '#4CAF50', secondary: '#66BB6A' },
            'ゼニガメ': { primary: '#2196F3', secondary: '#64B5F6' },
            'ポッポ': { primary: '#8D6E63', secondary: '#BCAAA4' },
            'コラッタ': { primary: '#9C27B0', secondary: '#CE93D8' }
        };

        const colors = pokemonColors[pokemon.name] || { primary: '#808080', secondary: '#BDBDBD' };

        // 簡易SVGスプライト生成
        spriteElement.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="30" fill="${colors.primary}" stroke="#000" stroke-width="2"/>
                <circle cx="32" cy="32" r="4" fill="#000"/>
                <circle cx="48" cy="32" r="4" fill="#000"/>
                <circle cx="33" cy="31" r="1" fill="#fff"/>
                <circle cx="49" cy="31" r="1" fill="#fff"/>
                <ellipse cx="40" cy="45" rx="8" ry="4" fill="${colors.secondary}"/>
                <text x="40" y="65" text-anchor="middle" font-family="monospace" font-size="6" fill="#000">${pokemon.name}</text>
            </svg>
        `;
    }

    // 画面更新
    updateDisplay() {
        this.updateHpBars();
        this.updateExpBar();
    }

    updateHpBars() {
        const player = battleManager.getActivePlayerPokemon();
        const enemy = battleManager.getActiveEnemyPokemon();

        if (player && this.elements.playerHp) {
            const hpPercent = player.getHpPercentage();
            this.elements.playerHp.style.width = hpPercent + '%';
            this.elements.playerCurrentHp.textContent = player.hp;
            this.elements.playerMaxHp.textContent = player.maxHp;

            // HPバーの色変更
            if (hpPercent <= 20) {
                this.elements.playerHp.style.background = '#F44336';
            } else if (hpPercent <= 50) {
                this.elements.playerHp.style.background = '#FFC107';
            } else {
                this.elements.playerHp.style.background = '#4CAF50';
            }
        }

        if (enemy && this.elements.enemyHp) {
            const hpPercent = enemy.getHpPercentage();
            this.elements.enemyHp.style.width = hpPercent + '%';

            // 敵のHPバー色変更
            if (hpPercent <= 20) {
                this.elements.enemyHp.style.background = '#F44336';
            } else if (hpPercent <= 50) {
                this.elements.enemyHp.style.background = '#FFC107';
            } else {
                this.elements.enemyHp.style.background = '#4CAF50';
            }
        }
    }

    updateExpBar() {
        const player = battleManager.getActivePlayerPokemon();
        if (player && this.elements.playerExp) {
            const expPercent = player.getExpPercentage();
            this.elements.playerExp.style.width = expPercent + '%';
            this.elements.playerExpCurrent.textContent = player.exp;
            this.elements.playerExpNext.textContent = player.expToNext;
        }
    }

    // メッセージ表示
    showMessage(message, callback) {
        if (this.elements.battleMessage) {
            this.elements.battleMessage.textContent = message;
        }

        // バトルログにも追加
        if (message !== "どうする？" && message !== "どの わざを つかう？") {
            this.addToBattleLog(message);
        }

        // メッセージクリックで進行
        const messageBox = document.querySelector('.message-box');
        const handleClick = () => {
            messageBox?.removeEventListener('click', handleClick);
            if (callback) callback();
        };

        setTimeout(() => {
            messageBox?.addEventListener('click', handleClick);
        }, 500);
    }

    // バトルログ
    addToBattleLog(message, type = 'system') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;

        if (this.elements.logContent) {
            this.elements.logContent.appendChild(logEntry);
            this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
        }
    }

    toggleBattleLog() {
        if (this.elements.battleLog) {
            const isVisible = !this.elements.battleLog.classList.contains('hidden');
            this.elements.battleLog.classList.toggle('hidden', isVisible);
            this.playMenuSound();
        }
    }

    // メインメニュー処理
    handleMainMenuClick(e) {
        if (!e.target.classList.contains('menu-option')) return;

        const action = e.target.dataset.action;
        this.playMenuSound();

        switch (action) {
            case 'fight':
                this.showMovesMenu();
                break;
            case 'pokemon':
                this.openPartyModal(false);
                break;
            case 'bag':
                this.openItemModal();
                break;
            case 'run':
                this.showMessage("うまく にげきれた！", () => {
                    // バトル終了処理
                    this.resetBattle();
                });
                break;
        }
    }

    handleMovesMenuClick(e) {
        const menuOption = e.target.closest('.menu-option');
        if (!menuOption) return;

        this.playMenuSound();
        const moveIndex = parseInt(menuOption.dataset.move);

        // プレイヤーの行動を実行
        this.executePlayerMove(moveIndex);
    }

    showMovesMenu() {
        if (this.elements.mainMenu && this.elements.movesMenu) {
            // 技ボタンを動的生成
            this.generateMoveButtons();

            this.elements.mainMenu.style.display = 'none';
            this.elements.movesMenu.style.display = 'grid';
            this.showMessage("どの わざを つかう？", null);
        }
    }

    generateMoveButtons() {
        if (!this.elements.movesMenu) return;

        const playerPokemon = battleManager.getActivePlayerPokemon();
        if (!playerPokemon) return;

        this.elements.movesMenu.innerHTML = '';

        playerPokemon.moves.forEach((move, index) => {
            const moveData = gameData.getMove(move.id);
            if (!moveData) return;

            const button = document.createElement('div');
            button.className = 'menu-option';
            button.dataset.move = index;

            const typeColor = gameData.getTypeColor(moveData.type);

            button.innerHTML = `
                <span class="move-name">${move.name}</span>
                <span class="move-info">威力${moveData.power || 0} ${moveData.category === 'physical' ? '物理' : moveData.category === 'special' ? '特殊' : '変化'}</span>
            `;

            // タイプ色をボタンに適用
            button.style.borderLeftColor = typeColor;

            this.elements.movesMenu.appendChild(button);
        });
    }

    showMainMenu() {
        if (this.elements.mainMenu && this.elements.movesMenu) {
            this.elements.mainMenu.style.display = 'grid';
            this.elements.movesMenu.style.display = 'none';
            this.showMessage("どうする？", null);
        }
    }

    // パーティモーダル
    openPartyModal(forced = false) {
        if (!this.elements.partyModal || !this.elements.partyGrid) return;

        this.generatePartyGrid(this.elements.partyGrid, (index) => {
            this.switchPokemon(index);
            this.closePartyModal();
        });

        // 強制選択時はキャンセルボタンを隠す
        if (this.elements.partyCancel) {
            this.elements.partyCancel.classList.toggle('hidden', forced);
        }

        this.elements.partyModal.classList.remove('hidden');
        this.currentModal = 'party';
        this.isModalOpen = true;
    }

    closePartyModal() {
        if (this.elements.partyModal) {
            this.elements.partyModal.classList.add('hidden');
        }
        this.currentModal = null;
        this.isModalOpen = false;
    }

    generatePartyGrid(container, onClickCallback) {
        if (!container) return;

        container.innerHTML = '';
        const party = battleManager.gameState.player.party;

        party.forEach((pokemon, index) => {
            const slot = document.createElement('div');
            slot.className = 'party-slot';

            // 選択不可条件
            const isActive = index === battleManager.gameState.player.activeIdx;
            const isFainted = pokemon.isFainted();

            if (isFainted || isActive) {
                slot.classList.add('disabled');
            } else if (isActive) {
                slot.classList.add('active');
            }

            // HP割合
            const hpPercent = pokemon.getHpPercentage();

            slot.innerHTML = `
                <div class="pokemon-info">
                    <div class="pokemon-name-level">
                        <span class="pokemon-name">${pokemon.name}</span>
                        <span class="pokemon-level">Lv.${pokemon.level}</span>
                    </div>
                    <div class="pokemon-hp">HP: ${pokemon.hp}/${pokemon.maxHp}</div>
                    <div class="hp-bar-small">
                        <div class="hp-fill-small" style="width: ${hpPercent}%"></div>
                    </div>
                    ${pokemon.status ? `<div class="pokemon-status">${battleManager.getStatusName(pokemon.status)}</div>` : ''}
                </div>
            `;

            if (!slot.classList.contains('disabled')) {
                slot.addEventListener('click', () => onClickCallback(index));
            }

            container.appendChild(slot);
        });
    }

    // アイテムモーダル
    openItemModal() {
        if (!this.elements.itemModal) return;

        this.showItemSelection();
        this.elements.itemModal.classList.remove('hidden');
        this.currentModal = 'item';
        this.isModalOpen = true;
    }

    closeItemModal() {
        if (this.elements.itemModal) {
            this.elements.itemModal.classList.add('hidden');
            this.elements.itemTarget.classList.add('hidden');
        }
        this.currentModal = null;
        this.isModalOpen = false;
    }

    showItemSelection() {
        if (!this.elements.itemSelection) return;

        this.elements.itemSelection.classList.remove('hidden');
        this.elements.itemTarget.classList.add('hidden');

        this.elements.itemSelection.innerHTML = '';
        const items = battleManager.gameState.player.items;

        Object.entries(items).forEach(([itemId, count]) => {
            const itemData = gameData.getItem(itemId);
            if (!itemData || count <= 0) return;

            const slot = document.createElement('div');
            slot.className = `item-slot ${count <= 0 ? 'empty' : ''}`;

            slot.innerHTML = `
                <span class="item-name">${itemData.name}</span>
                <span class="item-count">×${count}</span>
            `;

            if (count > 0) {
                slot.addEventListener('click', () => this.selectItem(itemId));
            }

            this.elements.itemSelection.appendChild(slot);
        });
    }

    selectItem(itemId) {
        this.elements.itemSelection.classList.add('hidden');
        this.elements.itemTarget.classList.remove('hidden');

        this.generatePartyGrid(this.elements.itemTargetGrid, (index) => {
            this.useItem(itemId, index);
        });
    }

    closeAllModals() {
        this.closePartyModal();
        this.closeItemModal();
    }

    // ゲームアクション
    switchPokemon(newIndex) {
        if (battleManager.switchPokemon(true, newIndex)) {
            const newPokemon = battleManager.getActivePlayerPokemon();
            this.elements.playerName.textContent = newPokemon.name;
            this.elements.playerLevel.textContent = `Lv. ${newPokemon.level}`;
            this.updatePokemonSprite(true, newPokemon);
            this.updateDisplay();
            // ターン消費
            this.endPlayerTurn();
        }
    }

    useItem(itemId, targetIndex) {
        if (battleManager.useItem(itemId, targetIndex)) {
            this.updateDisplay();
            this.closeItemModal();
            // ターン消費
            this.endPlayerTurn();
        }
    }

    async executePlayerMove(moveIndex) {
        const playerPokemon = battleManager.getActivePlayerPokemon();
        const enemyPokemon = battleManager.getActiveEnemyPokemon();
        const move = playerPokemon.moves[moveIndex];

        if (!move) return;

        // 技を使用
        this.showMessage(`${playerPokemon.name}の ${move.name}！`, async () => {
            // 攻撃アニメーション
            window.playAttackAnimation(true, async () => {
                // ダメージ計算と適用
                const success = await battleManager.useMove(playerPokemon, enemyPokemon, move.id);

                if (success) {
                    // ダメージアニメーション（敵側）
                    const result = battleManager.calculateDamage(playerPokemon, enemyPokemon, move.id);
                    if (!result.missed && result.damage > 0) {
                        window.playDamageAnimation(false, result.damage, () => {
                            this.updateDisplay();
                            this.checkBattleEndOrContinue();
                        });
                    } else {
                        this.updateDisplay();
                        this.checkBattleEndOrContinue();
                    }
                } else {
                    this.checkBattleEndOrContinue();
                }
            });
        });
    }

    checkBattleEndOrContinue() {
        const result = battleManager.checkBattleEnd();

        if (result === 'victory') {
            window.playVictorySound();
            this.showMessage("しょうぶに かった！", () => this.resetBattle());
        } else if (result === 'defeat') {
            window.playDefeatSound();
            this.showMessage("しょうぶに まけた...", () => this.resetBattle());
        } else {
            // 敵のターンを実行
            this.endPlayerTurn();
        }
    }

    endPlayerTurn() {
        // 敵のターンを実行
        setTimeout(() => {
            this.executeEnemyTurn();
        }, 1000);
    }

    async executeEnemyTurn() {
        // 戦略的AI判断
        const enemyPokemon = battleManager.getActiveEnemyPokemon();
        const playerPokemon = battleManager.getActivePlayerPokemon();

        const action = enemyAI.selectAction(enemyPokemon, playerPokemon);

        if (action.type === 'switch') {
            // AI交代
            this.showMessage(`${enemyPokemon.name}、もどれ！`, () => {
                battleManager.switchPokemon(false, action.targetIndex);
                const newEnemyPokemon = battleManager.getActiveEnemyPokemon();
                this.elements.enemyName.textContent = newEnemyPokemon.name;
                this.elements.enemyLevel.textContent = `Lv. ${newEnemyPokemon.level}`;
                this.updatePokemonSprite(false, newEnemyPokemon);
                this.showMessage(`${newEnemyPokemon.name}！ いけ！`, () => {
                    this.updateDisplay();
                    this.checkBattleEndOrShowMenu();
                });
            });
            return;
        }

        // 技使用
        const selectedMove = enemyPokemon.moves[action.moveIndex];

        this.showMessage(`${enemyPokemon.name}の ${selectedMove.name}！`, async () => {
            // 攻撃アニメーション（敵側）
            window.playAttackAnimation(false, async () => {
                // ダメージ計算と適用
                const success = await battleManager.useMove(enemyPokemon, playerPokemon, selectedMove.id);

                if (success) {
                    // ダメージアニメーション（プレイヤー側）
                    const result = battleManager.calculateDamage(enemyPokemon, playerPokemon, selectedMove.id);
                    if (!result.missed && result.damage > 0) {
                        window.playDamageAnimation(true, result.damage, () => {
                            this.updateDisplay();
                            this.checkBattleEndOrShowMenu();
                        });
                    } else {
                        this.updateDisplay();
                        this.checkBattleEndOrShowMenu();
                    }
                } else {
                    this.checkBattleEndOrShowMenu();
                }
            });
        });
    }

    checkBattleEndOrShowMenu() {
        const result = battleManager.checkBattleEnd();

        if (result === 'victory') {
            window.playVictorySound();
            this.showMessage("しょうぶに かった！", () => this.resetBattle());
        } else if (result === 'defeat') {
            window.playDefeatSound();
            this.showMessage("しょうぶに まけた...", () => this.resetBattle());
        } else {
            // ターン終了処理
            battleManager.processEndOfTurn();
            this.updateDisplay();

            // プレイヤーのターン開始
            this.showMainMenu();
        }
    }

    checkBattleEnd() {
        const result = battleManager.checkBattleEnd();

        if (result === 'victory') {
            this.showMessage("しょうぶに かった！", () => this.resetBattle());
        } else if (result === 'defeat') {
            this.showMessage("しょうぶに まけた...", () => this.resetBattle());
        } else {
            // バトル続行
            this.showMainMenu();
        }
    }

    resetBattle() {
        // バトルリセット処理
        location.reload(); // 簡易実装
    }

    // サウンド
    playMenuSound() {
        // 既存のサウンド関数を使用
        if (window.playMenuSound) {
            window.playMenuSound();
        }
    }
}

// グローバルインスタンス
const uiManager = new UIManager();