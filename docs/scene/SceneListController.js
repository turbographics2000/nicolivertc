import { ListController } from '../base/ListController.js';
import { SceneItemManager } from './SceneItemManager.js';
import util from '../base/util.js';

export class SceneListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            items: new SceneItemManager(options)
        }));
        this.items.add({
            name: util.generateUnusedValue('シーン', this.items.list)
        });
    }

    // Settingsなし
    onDoubleClick(evt) { }

    onBtnAddClick(evt) {
        this.setNameDialogShow(
            'シーンの名前を入力してください',
            util.generateUnusedValue('シーン', this.items.list),
            'add',
            {
                radiobuttons: true,
                radioButtonsTitle: 'シーンタイプ',
                radioItems: [{ value: 'Normal', text: 'ノーマル' }, { value: 'Special', text: '360°/立体視' }]
            }
        );
    }

    onBtnRemoveClick(evt) {
        if (this.selectedIndex === -1) return;
        if (this.items.length === 1) {
            this.messageDialogShow('一つ以上のシーンが必要です');
        } else {
            this.removeDialogShow();
        }
    }

    setNameDialogRsult(res) {
        switch (this.setNameDialog.state) {
            case 'add':
                this.items.add({ name: res.value, type: res.radioSelected });
                break;
            case 'rename':
                this.selectedItem.name = re.value;
                this.itemRenamed({
                    oldName: this.selectedItem.name,
                    newName: re.value,
                    index: this.selectedIndex,
                    item: this.selectedItem
                })
                break;
        }
    }

    createItemElement(item, container, index) {
        const cellName = util.newElm({
            textContent: item.name,
            classes: ['item-name', 'ellipsis']
        });
        const cellIsSpecitalScene = util.newElm({
            textContent: 'star',
            dataset: { propertyName: 'isSpecialScene' },
            classes: ['item-special', 'material-icons', 'list-item-button', item.isSpecialScene ? 'on' : ''],
            styles: {
                cursor: 'default'
            }
        });
        const row = util.newElm({
            classes: ['item'],
            children: [cellName, cellIsSpecitalScene]
        })
        item.itemElement = row;
        item.controls = {
            texts: { name: cellName },
            //toggleButtons: { isSpecialScene: cellIsSpecitalScene }
        };
        super.createItemElement(item, container, index);
    }
}