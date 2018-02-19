import { ItemManager } from '../base/ItemManager.js'
import { MicAudioInputItem } from './MicAudioInputItem.js';
import { DesktopAudioInputItem } from './DesktopAudioInputItem.js';

export class AudioInputItemManager extends ItemManager {
    constructor(options) {
        super(options);

        const micItem = new MicAudioInputItem({ name: '既定' });
        //const desktopItem = new DesktopAudioInputItem({});
        micItem.getStream();
        //desktopItem.getStream();

        setTimeout(_ => {
            this.add(micItem);
            //this.add(desktopItem);
            micItem.on('stateChanged', this.onStateChanged.bind(this));
            //desktopItem.on('stateChanged', this.onStateChanged.bind(this));
        }, 0);
    }

    init() {
    }

    onStateChanged(item, state, error) {
        const index = this.list.indexOf(item);
        this.emit('itemStateChanged', item, index, state, error);
    }

}