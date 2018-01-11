import { ListController } from '../base/ListController.js';
import { SourceItemManager } from './SourceItemManager.js';
import util from '../base/util.js';

export class SourceListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            items: new SourceItemManager(options || {})
        }));
    }

    changeScene(sceneData, sourceData, arg) {
        this.selectedSceneIndex = arg.newIndex;
        this.sceneData = sceneData;
        this.data = sourceData;
        this.selectedIndex = -1;
        this.resetList(this.data.items);
        this.emit('sceneChanged', arg);
    }

    itemAdded({ index, item }) {
        if (!('visibility' in item)) {
            item.visibility = true;
        }
        if (!('locked' in item)) {
            item.locked = false;
        }
        super.itemAdded({ index, item });
    }

    onBtnAddClick(evt) {
        let list = [];
        this.sceneData.items.forEach(sceneItem => {
            sceneItem.items.forEach(sourceItem => {
                list.push(sourceItem);
            });
        });
        this.setNameDialogShow(
            'ソースの名前を入力してください',
            util.generateUnusedValue('ソース', list),
            'add'
        );
    }

    onClick_visibility(evt, item, propertyName) {
        const control = item.controls.buttons[propertyName];
        item[propertyName] = !item[propertyName];
        this.updateControls(this.selectedItem);
    }

    onClick_locked() {
        this.selectedItem.locked = !this.selectedItem.locked;
        this.updateControls(this.selectedItem);
    }

    onClick_360() {
        this.selectedItem.degree360 = !this.selectedItem.degree360;
        this.updateControls(this.selectedItem);
    }

    onClick_threeDType(evt) {
        const elm = evt.currentTarget;
        const rect = elm.getBoundingClientRect();
        const pos = {
            x: Math.min(rect.left, window.innerWidth - rect.width),
            y: Math.min(rect.top + rect.height, window.innerHeight - rect.height)
        };
        util.attachThreeDTypeDropDownList(this.onClick_ThreeDTypeItem.bind(this));
        util.flowListShow(window.threeDTypeDropdownList, pos.x, pos.y);
    }

    onClick_ThreeDTypeItem(evt) {
        const listItem = evt.currentTarget;
        this.selectedItem.threeDType = listItem.textContent;
        this.updateControls(this.selectedItem);
    }

    createItemElement(item, container, index) {
        const cellVisibility = util.newElm({
            textContent: 'visibility',
            classes: ['visibility', 'material-icons', 'list-item-button'],
            dataset: { propertyName: 'visibility' },
            attributes: {
                onclick: this.onClick_visibility.bind(this)
            }
        });

        const cellLocked = util.newElm({
            textContent: 'lock',
            dataset: { propertyName: 'locked' },
            classes: ['item-locked', 'material-icons', 'list-item-button'],
            attributes: {
                onclick: this.onClick_locked.bind(this)
            }
        });

        const cellName = util.newElm({
            textContent: item.sourceName,
            dataset: { propertyName: 'name' },
            classes: ['item-name', 'ellipsis'],
        });

        const cell360 = util.newElm({
            textContent: '360°',
            dataset: { propertyName: 'degree360' },
            classes: ['item-360', 'list-item-button', item.degree360 ? 'on' : ''],
            attributes: {
                onclick: this.onClick_360.bind(this)
            }
        });

        const cellThreeDType = util.newElm({
            textContent: 'SBS_RL',
            dataset: { propertyName: 'threeDType' },
            classes: ['item-3D', 'list-item-button', 'on'],
            attributes: {
                onclick: this.onClick_threeDType.bind(this)
            }
        });

        const itemElm = util.newElm({
            classes: ['item'],
            children: [cellVisibility, cellLocked, cellName, cell360, cellThreeDType]
        });

        item.itemElement = itemElm;
        item.controls = {
            texts: { name: cellName, threeDType: cellThreeDType },
            toggleButtons: {
                visibility: cellVisibility,
                locked: cellLocked,
                degree360: cell360
            }
        };
        super.createItemElement(item, container, index);
    }
}

