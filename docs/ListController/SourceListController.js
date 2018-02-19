import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';

export class SourceListController extends ListController {
    constructor(selector) {
        super(selector, 'source');

        WebOBSData.on('selected scene changed', this.onSceneChanged.bind(this));
        //WebOBSData.on('selected source changed', this.onSourceChanged.bind(this));
        WebOBSData.on('sourceAdded', this.onSourceAdded.bind(this));
    }

    changeScene(sceneData, sourceData, arg) {
        this.selectedSceneIndex = arg.newIndex;
        this.sceneData = sceneData;
        this.data = sourceData;
        this.selectedIndex = -1;
        this.resetList(this.data.items);
        this.emit('sceneChanged', arg);
    }

    addItem(item) {
        item.sourceItemName = util.generateUnusedValue(item.name, this.list);
        super.addItem(item);
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

    onSceneChanged({ oldItem, newItem }) {
        this.container.innerHTML = '';
        newItem.items.forEach(item => {
            this.createItemElement(item)
        });
    }

    onSourceAdded(item) {
        this.createItemElement(item);
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
        if(this.selectedItem.webGLObj) {
            this.selectedItem.webGLObj.dispose();
            
            this.selectedItem.webGLObj = 
        }
        this.updateControls(this.selectedItem);
    }

    setNameDialogRsult(res) {
        switch (this.setNameDialog.state) {
            case 'rename':
                this.selectedItem.name = res.value;
                this.selectedItem.sourceItemName = res.value;
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
        const cellVisibility = util.newElm({
            textContent: 'visibility',
            classes: ['item-visibility', 'material-icons', 'list-item-button'],
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
            textContent: item.sourceItemName,
            dataset: { propertyName: 'sourceItemName' },
            classes: ['item-name', 'ellipsis'],
            attributes: {
                title: item.sourceItemName
            }
        });


        item.controls = {
            texts: {
                sourceItemName: cellName
            },
            toggleButtons: {
                visibility: cellVisibility,
                locked: cellLocked
            }
        };

        let elm = null;
        if (['camera', 'video', 'image'].includes(item.mediaType)) {
            const cell360 = util.newElm({
                textContent: '360°',
                dataset: { propertyName: 'degree360' },
                classes: ['item-360', 'list-item-button', item.degree360 ? 'on' : ''],
                onclick: this.onClick_360.bind(this)
            });

            const cellThreeDType = util.newElm({
                textContent: item.threeDType,
                dataset: { propertyName: 'threeDType' },
                classes: ['item-3d', 'list-item-button', 'on'],
                onclick: this.onClick_threeDType.bind(this)
            });

            elm = util.newElm({
                classes: ['item', 'grid'],
                children: [cellVisibility, cellLocked, cellName, cell360, cellThreeDType]
            });
            item.controls.texts.threeDType = cellThreeDType;
            item.controls.toggleButtons.degree360 = cell360;
        } else {
            elm = util.newElm({
                classes: ['item', 'grid'],
                children: [cellVisibility, cellLocked, cellName]
            });
        }
        item.elm = [elm]; // SceneAudioListのitem.elmも別途用意するため配列にする。

        this.container.appendChild(elm);
        super.createItemElement(item);
    }
}

