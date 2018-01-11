import { ItemManager } from '../base/ItemManager.js';
import util from '../base/util.js';

export class SourceItemManager extends ItemManager {
    constructor(options) {
        super(options);
    }

    beginAdd() {
        super.beginAdd(
            'ソースの名前を入力してください',
            util.generateUnusedValue('ソース', this.items)
        );
    }

    add(item) {
        item.id = `source_${util.generateUUID()}`;
        window.allSources[item.id] = item;
        super.add(item);
    }

    remove(item) {
        delete window.allSources[item.id]; // TODO UNDO/REDOを実装した場合、要検討
        super.remove(item);
    }
}