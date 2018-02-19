class PlayerAnimation {
    constructor() {
        this.items = {};
        this.animateId = null;
        this.animate();
    }

    add(player) {
        this.items[player.id] = this.items[player.id] || { players: {} };
        this.items[player.id].players[player.type] = player;
        this.items[player.id].player = player.player;
    }

    remove(id, type) {
        if (this.items[id] &&
            this.items[id].players &&
            this.items[id].players[type]) {
            delete this.items[id].player[type];
            if (Object.keys(this.items[id].players).length === 0) {
                delete this.items[id];
            }
        }
    }

    animate() {
        this.animateId = requestAnimationFrame(this.animate.bind(this));
        const itemIds = Object.keys(this.items);
        for (let i = 0, il = itemIds.length; i < il; i++) {
            const item = this.items[itemIds[i]];
            const pos = item.player.currentTime / item.player.duration * 100;
            const types = Object.keys(item.players);
            for (let j = 0, jl = types.length; j < jl; j++) {
                const player = item.players[types[j]];
                if (player.playingPosition) {
                    player.playingPosition.style.left = pos <= 0 || pos >= 100 ? '' : `${pos}%`;
                }
                if (player.seekBar) {
                    player.seekBar.style.width = `${pos}%`;
                }
            }
        }
    }
}

export default new PlayerAnimation();