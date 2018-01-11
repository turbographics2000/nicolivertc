import { ItemManager } from '../base/ItemManager.js';
import util from '../base/util.js';

export class VideoItemManager extends ItemManager {
    constructor(options) {
        super(options);
    }

    add(item) {
        item.items = item.items || [];
        item.selectedIndex = item.selectedIndex || -1;
        super.add(item);
    }

    settings(){

    }
}