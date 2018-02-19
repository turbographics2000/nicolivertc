import { EventEmitter } from './EventEmitter.js';
import { DialogController } from './DialogController.js';
import util from './util.js';

export class ListController extends EventEmitter {
    constructor(selector, options) {
        super(options);

        this.selectedIndex = -1;
        this.elm = document.querySelector(selector);
        this.container = this.elm.querySelector(':scope .list-body');
        this.btnAdd = this.elm.querySelector('.list-add-button');
        this.btnRemove = this.elm.querySelector('.list-remove-button');
        this.btnSetting = this.elm.querySelector('.list-setting-button');
        this.btnUp = this.elm.querySelector('.list-up-button');
        this.btnDown = this.elm.querySelector('.list-down-button');
        this.items = options.items;
        this.rows = [];
        this.clickTOId = null;
        this.controls = [];
        this.draggingTarget = null;

        this.container.onmousedown = this.onMouseDown.bind(this);
        this.container.onmouseup = this.onMouseUp.bind(this);
        this.container.onclick = this.onClick.bind(this);
        (this.btnAdd || {}).onclick = this.onBtnAddClick.bind(this);
        (this.btnRemove || {}).onclick = this.onBtnRemoveClick.bind(this);
        (this.btnSetting || {}).onclick = this.onBtnSettingClick.bind(this);
        (this.btnUp || {}).onclick = this.onBtnUpClick.bind(this);
        (this.btnDown || {}).onclick = this.onBtnDownClick.bind(this);

        this.items.on('itemAdded', this.itemAdded.bind(this));
        this.items.on('itemRemoved', this.itemRemoved.bind(this));
        this.items.on('itemMoved', this.itemMoved.bind(this));

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
            select: false,
            btnCancel: true
        });
    }

    _createRemoveDialog() {
        this.removeDialog = new DialogController({
            description: true,
            type: 'yes_no'
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
            classes: ['flowlist', 'theme-color-d1'],
            children: [renameItem]
        });
        document.body.appendChild(this.contextMenu);
    }

    get list() {
        return this.items.list;
    }

    get selectedItem() {
        return this.selectedIndex === -1 ? null : this.items.getItem(this.selectedIndex);
    }

    setData(data) {
        if (this.data !== data) {
            const oldSelectedIndex = this.selectedIndex;
            this.eventEnable = false;
            this.data = data;
            this.resetList(this.data.items);
            this.eventEnable = true;
            if (oldSelectedIndex !== this.selectedIndex) {
                this.emit('selectedIndexChanged', { oldIndex: oldSelectedIndex, newIndex: this.selectedIndex });
            }
        }
    }

    resetList(items) {
        this.items.clear();
        this.container.innerHTML = '';
        items.forEach(item => {
            this.items.add(item);
        });
    }

    getItemElements(container) {
        const parent = container || this.container;
        return [...parent.querySelectorAll(':scope .item')];
    }

    onMouseDown(evt) {
        this.mouseDownIndex = this.getIndexFromElement(evt.target);
    }

    onMouseUp(evt) {
        const mouseUpIndex = this.getIndexFromElement(evt.target);

        if (this.mouseDownIndex === mouseUpIndex && evt.button === 2) {
            this.changeSelect(mouseUpIndex);
            this.contextMenuShow(evt.pageX, evt.pageY, mouseUpIndex);
        }
    }

    onClick(evt) {
        const clickIndex = this.getIndexFromElement(evt.target);
        if (clickIndex === -1) return;
        this.changeSelect(clickIndex);
    }

    onDragStart(evt) {
        const index = this.getIndexFromElement(evt.target);
        const item = this.list[index];
        // Firefoxではデータがセットされてないとダメ
        evt.dataTransfer.setData('text/plain', 'dummy');
        this.draggingTarget = item;
    }

    onDragEnd(evt) {
        this.draggingTarget = null;
    }

    onDoubleClick(evt) {
        this.items.setting(this.selectedIndex);
        this.clickTOId = null;
    }

    onBtnAddClick() { }

    onBtnRemoveClick() {
        if (this.selectedIndex === -1) return;
        this.removeDialogShow();
    }

    onBtnSettingClick() {
        this.items.setting(this.selectedIndex);
    }

    onBtnUpClick() {
        this.items.up(this.selectedIndex);
    }

    onBtnDownClick() {
        this.items.down(this.selectedIndex);
    }

    onItemDispose(itemId) {
        const items = this.list.filter(item => item.id === itemId);
        if(items.length) {
            items.forEach(item => {
                const index = this.list.indexOf(item);
                this.removeItem(index);
            });
        }
    }

    setNameDialogShow(descriptionText, value, state, exoptions) {
        const usedNameList = this.list.map(item => item.name);
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
            value: this.selectedIndex,
            descriptionText: `'${this.selectedItem.name}'を削除してもよろしいですか？`
        });
    }

    removeDialogResult(res) {
        if (isNaN(res.value)) {
            throw 'isNaN index.';
        }
        if ((+res.value) === -1) {
            throw 'index is -1.';
        }
        this.items.remove(+res.value);
    }

    messageDialogShow(descriptionText) {
        this.messageDialog.show({
            descriptionText
        });
    }

    getIndexFromElement(elm) {
        let tmp = elm;
        while (true) {
            while (tmp !== null && !tmp.classList.contains('item')) {
                tmp = tmp.parentElement;
            }
            if (tmp === null || tmp.parentElement === this.container || tmp.parentElement.parentElement === this.container) break;
            tmp = tmp.parentElement;
        }
        return this.getItemElements().indexOf(tmp);
    }

    changeSelect(selectItem, container) {
        let selectedIndex = selectItem;
        if (typeof selectItem === 'object') {
            selectedIndex = this.list.indexOf(selectItem);
        }
        if (selectedIndex !== this.selectedIndex) {
            const oldIndex = this.selectedIndex;
            this.selectedIndex = selectedIndex;
            if (selectedIndex >= 0) {
                this.singleRowSelect(container);
            }
            if (typeof selectItem === 'number' && selectedIndex !== -1) {
                this.emit('selectedIndexChanged', {
                    oldIndex: oldIndex,
                    newIndex: selectedIndex
                });
            }
        }
    }

    singleRowSelect(container) {
        this.getItemElements(container).forEach(tr => tr.classList.remove('selected'));
        this.getItemElements(container)[this.selectedIndex].classList.add('selected');
    }

    addItem(item) {
        this.items.add(item);
    }

    removeItemByElm(elm) {
        const index = this.getIndexFromElement(elm);
        if(index !== -1) {
            this.removeItem(index);
        }
    }

    removeItem(index) {
        this.items.remove(index);
    }

    removeItem(elm, isSource) {}

    itemAdded({ index, item }) {
        if (this.data) {
            this.data.selectedIndex = this.selectedIndex;
            this.data.items = this.data.items || [];
            if (!this.data.items.includes(item)) {
                this.data.items.push(item);
            }
        }
        this.createItemElement(item, this.container);
        this.emit('itemAdded', index, item);
    }

    itemRemoved({ index, item }) {
        this.getItemElements()[index].remove();
        if (this.selectedIndex > this.items.lastIndex) {
            this.changeSelect(this.selectedIndex - 1);
        }
        if(this.selectedIndex !== -1) this.singleRowSelect();

        this.emit('itemRemoved', index, item);

        if (this.data) {
            this.data.selectedIndex = this.selectedIndex;
            this.data.items.splice(index, 1);
        }
    }

    itemMoved({ oldIndex, newIndex, item }) {
        item.itemElement.remove();
        this.container.insertBefore(item.itemElement, this.getItemElements()[newIndex]);
        this.selectedIndex = newIndex;

        this.emit('itemMoved', oldIndex, newIndex, item);

        this.data.items.splice(oldIndex, 1);
        this.data.items.splice(newIndex, 0, item);
    }

    itemRenamed({ oldName, newName, index, item }) {
        item.name = newName;
        item.controls.texts.name.textContent = newName;
        this.emit('itemRenamed', oldName, newName, index, item);
    }

    itemSettings({ oldSettings, newSettings, index, item }) {
    }

    createItemElement(item, container, index) {
        item.controls = Object.assign({
            texts: {},
            toggleButtons: {},
            inputs: {}
        }, item.controls);
        if (index === undefined) {
            container.appendChild(item.itemElement);
        } else {
            container.insertBefore(item.itemElement, this.list[index].itemElement);
        }

        item.itemElement.scrollIntoView(index !== undefined);
        if (index === undefined) {
            index = this.items.length - 1;
        }
        this.rows.splice(index, 0, item);

        this.updateControls(item);
        Object.keys(item.controls.toggleButtons).forEach(key => {
            const ctrl = item.controls.toggleButtons[key];
            ctrl.onclick = this.onClick_ToggleButton.bind(this);
        });
        Object.keys(item.controls.inputs).forEach(key => {
            const ctrl = item.controls.inputs[key];
            ctrl.oninput = this.onControlEvent.bind(this, `onInput_${ctrl.dataset.propertyName}`);
        });
        this.changeSelect(index, container);
    }

    onClick_ToggleButton(evt) {
        if (evt.button !== 0) return;

        const control = evt.target;
        const propertyName = control.dataset.propertyName;
        const index = this.getIndexFromElement(evt.target);
        const item = this.items.list[index];
        item[propertyName] = !item[propertyName];
        if (item[propertyName] && !control.classList.contains('on')) {
            control.classList.add('on');
        } else {
            control.classList.remove('on');
        }
    }

    onControlEvent(eventName, evt) {
        const index = this.getIndexFromElement(evt.target);
        const item = this.items.list[index];
        const propertyName = evt.target.dataset.propertyName;
        this[eventName](evt, item, propertyName);
    }

    onRenameClick() {
        this.contextMenuHide();
        this.setNameDialogShow('[名前を変更] 名前を編集してください', this.selectedItem.name, 'rename');
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