// データローダークラス
class DataLoader {
    constructor() {
        this.pokemonData = null;
        this.moveData = null;
        this.itemData = null;
        this.typeData = null;
        this.loaded = false;
    }

    async loadAllData() {
        try {
            console.log('Loading game data...');

            const [pokemonResponse, moveResponse, itemResponse, typeResponse] = await Promise.all([
                fetch('./data/pokemon.json'),
                fetch('./data/moves.json'),
                fetch('./data/items.json'),
                fetch('./data/types.json')
            ]);

            this.pokemonData = await pokemonResponse.json();
            this.moveData = await moveResponse.json();
            this.itemData = await itemResponse.json();
            this.typeData = await typeResponse.json();

            this.loaded = true;
            console.log('Game data loaded successfully');

            return true;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return false;
        }
    }

    getPokemon(id) {
        return this.pokemonData?.find(p => p.id === id) || null;
    }

    getMove(id) {
        return this.moveData?.[id] || null;
    }

    getItem(id) {
        return this.itemData?.find(i => i.id === id) || null;
    }

    getTypeEffectiveness(attackType, defenseTypes) {
        if (!this.typeData || !defenseTypes) return 1.0;

        let effectiveness = 1.0;
        const attackEffects = this.typeData.effectiveness[attackType] || {};

        defenseTypes.forEach(defenseType => {
            const typeEffect = attackEffects[defenseType];
            if (typeEffect !== undefined) {
                effectiveness *= typeEffect;
            }
        });

        return effectiveness;
    }

    getTypeColor(type) {
        return this.typeData?.typeColors?.[type] || '#808080';
    }

    isLoaded() {
        return this.loaded;
    }
}

// グローバルインスタンス
const gameData = new DataLoader();