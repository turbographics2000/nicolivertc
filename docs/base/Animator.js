class Animator {
    constructor() {
        this.items = {};
        this.animateId = null;
        this.animate();
    }

    add(item) {
        this.items[item.id] = this.items[item.id] || item;
    }

    remove(id) {
        delete this.items[id];
    }

    animate() {
        this.animateId = requestAnimationFrame(this.animate.bind(this));

        const itemIds = Object.keys(this.items);
        for (let i = 0, il = itemIds.length; i < il; i++) {
            const item = this.items[itemIds[i]];
            if (['audio', 'video'].includes(item.mediaType)) {
                const pos = item.player.currentTime / item.player.duration * 100;
                if (item.playingPosition) {
                    item.playingPosition.style.left = pos <= 0 || pos >= 100 ? '' : `${pos}%`;
                }
                if (item.seekBar) {
                    item.seekBar.style.width = `${pos}%`;
                }
            }
            if(['mic', 'mixer'].includes(item.mediaType)) {
                item.analyser.getByteFrequencyData(item.data);
                let max = 0;
                for (let i = 0, l = item.bufferLength; i < l; i++) {
                    max = Math.max(max, item.data[i]);
                }
                item.cap = item.cap < max ? max : item.cap - 1;
                item.audioMeter.style.width = `${max / 256 * 100 | 0}%`;
            }
        }
    }
}

export default new Animator();