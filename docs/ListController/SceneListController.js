import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';

export class SceneListController extends ListController {
    constructor(selector) {
        super(selector, 'scene');

        WebOBSData.on('sceneAdded', this.onSceneAdded.bind(this));
        if (this.items.length === 0) {
            WebOBSData.add(this.type, {name: 'シーン 1'});
        }
    }

    onSceneAdded(item) {
        this.createItemElement(item);
    }

    onBtnSpecialClick() {

    }

    // Settingsなし
    onDoubleClick(evt) { }

    onBtnAddClick(evt) {
        this.setNameDialogShow(
            'シーンの名前を入力してください',
            util.generateUnusedValue('シーン', this.items),
            'add',
            {
                radiobuttons: true,
                radioButtonsTitle: 'シーンタイプ',
                radioItems: [{ value: 'Normal', text: 'ノーマル' }, { value: 'Special', text: '360°/立体視' }]
            }
        );
    }

    onBtnRemoveClick(evt) {
        if (this.items.length === 1) {
            this.messageDialogShow('一つ以上のシーンが必要です');
        } else {
            this.removeDialogShow();
        }
    }

    setNameDialogRsult(res) {
        switch (this.setNameDialog.state) {
            case 'add':
                WebOBSData.add(this.type, {
                    name: res.value,
                    special: res.radioSelected === 'Special',
                });
                break;
            case 'rename':
                this.selectedItem.name = re.value;
                this.itemRenamed({
                    oldName: this.selectedItem.name,
                    newName: re.value,
                    index: this.selectedIndex,
                    item: this.selectedItem
                });
                break;
        }
    }

    createItemElement(item) {
        const cellName = util.newElm({
            textContent: item.name,
            classes: ['item-name', 'ellipsis'],
            title: item.name
        });

        const cellIsSpecitalScene = util.newElm({
            textContent: 'star',
            dataset: { propertyName: 'special' },
            classes: ['item-special', 'material-icons', 'list-item-button', item.isSpecialScene ? 'on' : ''],
            styles: {
                cursor: 'default'
            },
            onClick: this.onBtnSpecialClick.bind(this)
        });

        const itemElm = util.newElm({
            classes: ['item', 'grid'],
            children: [cellName, cellIsSpecitalScene]
        });

        item.elm = itemElm;
        item.controls = {
            texts: { name: cellName },
            toggleButtons: { special: cellIsSpecitalScene }
        };
        this.container.appendChild(itemElm);
        super.createItemElement(item);
    }
}