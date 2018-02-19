import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { EventEmitter } from '../base/EventEmitter.js';
import { DialogController } from '../base/DialogController.js';

export class ListController extends EventEmitter {
    constructor(selector, type) {
        super();

        this.type = type;
        this.draggingTarget = null;

        this.elm = document.querySelector(selector);
        this.container = this.elm.querySelector(':scope .list-body');
        this.btnAdd = this.elm.querySelector('.list-add-button');
        this.btnRemove = this.elm.querySelector('.list-remove-button');
        this.btnSetting = this.elm.querySelector('.list-setting-button');
        this.btnUp = this.elm.querySelector('.list-up-button');
        this.btnDown = this.elm.querySelector('.list-down-button');

        this.container.onmousedown = this.onMouseDown.bind(this);
        this.container.onmouseup = this.onMouseUp.bind(this);
        this.container.onclick = this.onClick.bind(this);
        (this.btnAdd || {}).onclick = this.onBtnAddClick.bind(this);
        (this.btnRemove || {}).onclick = this.onBtnRemoveClick.bind(this);
        (this.btnSetting || {}).onclick = this.onBtnSettingClick.bind(this);
        (this.btnUp || {}).onclick = this.onBtnUpClick.bind(this);
        (this.btnDown || {}).onclick = this.onBtnDownClick.bind(this);

        this._createSetNameDialog();
        this._createRemoveDialog();
        this._createMessageDialog();
        this._createContextMenu();

        this.setNameDialog.on('dialogResult', this.setNameDialogRsult.bind(this));
        this.removeDialog.on('dialogResult', this.removeDialogResult.bind(this));
    }

    _createSetNameDialog() {
        this.setNameDialog = new DialogController({
            warinigsText: 'この名前はすでに使用されています',
            description: true,
            input: true,
            btnCancel: true,
            select: false
        });
    }

    _createRemoveDialog() {
        this.removeDialog = new DialogController({
            description: true,
            type: 'yes_no',
            btnCancel: true
        });
    }

    _createMessageDialog() {
        this.messageDialog = new DialogController({
            description: true,
            type: 'ok'
        });
    }

    _createContextMenu() {
        const renameItem = util.newElm({
            textContent: '名前を変更',
            classes: ['flowlist-item']
        });
        renameItem.onclick = this.onRenameClick.bind(this);
        this.contextMenu = util.newElm({
            classes: ['flowlist'],
            children: [renameItem]
        });
        document.body.appendChild(this.contextMenu);
    }

    get items() {
        return WebOBSData.getItems(this.type);
    }

    get selectedItem() {
        return WebOBSData.getSelectedItem(this.type);
    }

    onMouseDown(evt) {
        const index = this.getIndexFromElement(evt.target);
        this.mouseDownIndex = index;
        if (index === -1) return;
        WebOBSData.setSelectedIndex(this.type, index);
    }

    onMouseUp(evt) {
        const mouseUpIndex = this.getIndexFromElement(evt.target);
        if (this.mouseDownIndex === mouseUpIndex && evt.button === 2) {
            this.contextMenuShow(evt.pageX, evt.pageY, mouseUpIndex);
        }
    }

    onClick(evt) {
        const index = this.getIndexFromElement(evt.target);
        if (index === -1) return;
        WebOBSData.setSelectedIndex(this.type, index);
    }

    onDoubleClick(evt) {
        this.items.setting(this.selectedIndex);
    }

    onDragStart(evt) {
        const index = this.getIndexFromElement(evt.target);
        const item = this.items[index];
        // Firefoxではデータがセットされてないとダメ
        evt.dataTransfer.setData(`media/${item.mediaType}`, 'dummy');
        this.draggingTarget = item;
    }

    onDragEnd(evt) {
        this.draggingTarget = null;
    }

    onBtnAddClick() { }

    onBtnRemoveClick(index = null) {
        if (index != null) {
            WebOBSData.setSelectedIndex(this.type, index);
        }
        this.removeDialogShow();
    }

    onBtnSettingClick() {
        WebOBSData.setting(this.type);
    }

    onBtnUpClick() {
        WebOBSData.up(this.type);
    }

    onBtnDownClick() {
        WebOBSData.down(this.type);
    }

    onClick_ToggleButton(evt) {
        if (evt.button !== 0) return;
        const control = evt.target;
        const propertyName = control.dataset.propertyName;
        const index = this.getIndexFromElement(evt.target);
        const item = this.items[index];
        item[propertyName] = !item[propertyName];
        WebOBSData.dispatchEvent('propertyChanged');
        if (item[propertyName] && !control.classList.contains('on')) {
            control.classList.add('on');
        } else {
            control.classList.remove('on');
        }
    }

    onControlEvent(eventName, evt) {
        const index = this.getIndexFromElement(evt.target);
        const item = this.items[index];
        const propertyName = evt.target.dataset.propertyName;
        this[eventName](evt, item, propertyName);
    }

    onRenameClick() {
        this.contextMenuHide();
        this.setNameDialogShow('[名前を変更] 名前を編集してください', this.selectedItem.name, 'rename');
    }

    setNameDialogShow(descriptionText, value, state, exoptions) {
        const usedNameList = this.items.map(item => item.name);
        this.setNameDialog.show({
            usedNameList,
            descriptionText,
            value,
            state,
            exoptions
        });
    }

    setNameDialogRsult(res) {
        switch (this.setNameDialog.state) {
            case 'add':
                this.items.add({ name: res.value });
                break;
            case 'rename':
                this.selectedItem.name = res.value;
                this.itemRenamed({
                    oldName: this.selectedItem.name,
                    newName: re.value,
                    index: this.selectedIndex,
                    item: this.selectedItem
                });
                break;
        }
    }

    removeDialogShow() {
        this.removeDialog.show({
            value: WebOBSData.getSelectedIndex(this.type),
            descriptionText: `'${WebOBSData.getSelectedItem(this.type).name}'を削除してもよろしいですか？`
        });
    }

    removeDialogResult(res) {
        WebOBSData.remove(this.type, +res.value);
    }

    messageDialogShow(descriptionText) {
        this.messageDialog.show({
            descriptionText
        });
    }

    contextMenuShow(x, y, idx) {
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.add('show');
        this.contextMenu.dataset.idx = idx;
    }

    contextMenuHide() {
        this.contextMenu.classList.remove('show');
    }

    getItemElements(container) {
        return [...this.container.querySelectorAll(':scope .item')];
    }

    getIndexFromElement(elm) {
        let tmp = elm;
        while (true) {
            while (tmp !== null && !tmp.classList.contains('item')) {
                tmp = tmp.parentElement;
            }
            if (tmp === null || tmp.parentElement === this.container) break;
            tmp = tmp.parentElement;
        }
        return this.getItemElements().indexOf(tmp);
    }

    createItemElement(item) {
        item.controls = Object.assign({
            texts: {},
            toggleButtons: {},
            inputs: {}
        }, item.controls);

        if (Array.isArray(item.elm)) {
            item.elm.forEach(elm => elm.scrollIntoView());
        } else {
            item.elm.scrollIntoView();
        }

        this.updateControls(item);
        Object.keys(item.controls.toggleButtons).forEach(key => {
            const ctrl = item.controls.toggleButtons[key];
            ctrl.onclick = this.onClick_ToggleButton.bind(this);
        });
        Object.keys(item.controls.inputs).forEach(key => {
            const ctrl = item.controls.inputs[key];
            ctrl.oninput = this.onControlEvent.bind(this, `onInput_${ctrl.dataset.propertyName}`);
        });
    }

    updateControls(item) {
        Object.keys(item.controls).forEach(key => {
            const controls = item.controls[key];
            Object.keys(controls).forEach(propertyName => {
                const ctrl = controls[propertyName];
                const value = item[propertyName];
                switch (key) {
                    case 'texts':
                        this.updateText(ctrl, value);
                        break;
                    case 'inputs':
                        this.updateInput(ctrl, value);
                        break;
                    case 'toggleButtons':
                        this.updateToggleButton(ctrl, value);
                        break;
                }
            });
        });
    }

    updateText(ctrl, value) {
        if (ctrl) {
            const format = ctrl.dataset.format || '$';
            ctrl.textContent = format.replace('$', value);
        }
    }

    updateInput(ctl, value) {

    }

    updateToggleButton(ctrl, value) {
        if (value) {
            if (!ctrl.classList.contains('on')) {
                ctrl.classList.add('on');
            }
        } else {
            ctrl.classList.remove('on');
        }
    }
}