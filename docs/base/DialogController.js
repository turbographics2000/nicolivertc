import { EventEmitter } from './EventEmitter.js';
import util from './util.js';

export class DialogController extends EventEmitter {
    constructor(options) {
        super(options);

        this.options = options;
        this.dialogMask = document.querySelector('.dialog-mask');
        this.dialog = document.querySelector('.dialog');
        this.description = this.dialog.querySelector('.dialog-description');
        this.input = this.dialog.querySelector('.dialog-input');
        this.select = this.dialog.querySelector('.dialog-select');
        this.warnings = this.dialog.querySelector('.dialog-warnings');
        this.notes = this.dialog.querySelector('.dialog-notes');
        this.radioButtons = this.dialog.querySelector('.dialog-radiobuttons');
        this.radioButtonsTitle = this.dialog.querySelector('.dialog-radiobuttons-title');
        this.radioButtonsContainer = this.dialog.querySelector('.dialog-radiobuttons-container');
        this.chkDontAskMeAgain = this.dialog.querySelector('.dialog-dontaskmeagain');
        this.btnOK = this.dialog.querySelector('.dialog-ok-button');
        this.btnCancel = this.dialog.querySelector('.dialog-cancel-button');
        this.displayState = 'hide';
        this.state = '';
        this.idx = null;
        this.selectedValue = null;
        this.keyPressFlg = false;
        this.type = options.type || 'ok_cancel';
        this.input.value = options.value || '';
        this.dialogResult = options.dialogResult;
        this.warnings.textContent = options.warinigsText;
        this.notes.textContent = options.notessText || '';
    }

    setupDialog(exoptions) {
        const options = Object.assign(this.options, exoptions);
        if(options.radioItems) {
            this.radioButtonsTitle.textContent = options.radioButtonsTitle;
            this.radioButtonsContainer.innerHTML = '';
            options.radioItems.forEach((item, index) => {
                const radio = util.newElm({
                    textContent: item.text,
                    classes: ['dialog-radioitem', !index ? 'selected' : ''],
                    dataset: { value: item.value },
                    attributes: {
                        onclick: evt => {
                            document.querySelectorAll('.dialog-radioitem').forEach(elm => elm.classList.remove('selected'));
                            evt.target.classList.add('selected');
                        }
                    }
                });
                this.radioButtonsContainer.appendChild(radio);
            });
        }
        this.description.style.display = !!options.description ? '' : 'none';
        this.input.style.display = !!options.input ? '' : 'none';
        this.select.style.display = !!options.select ? '' : 'none';
        this.warnings.style.display = !!options.warnings ? '' : 'none';
        this.notes.style.display = !!options.warnings ? '' : 'none';
        this.radioButtons.style.display = !!options.radiobuttons ? '' : 'none';
        this.chkDontAskMeAgain.style.display = !!options.dontAskMeAgain ? '' : 'none';
        this.btnOK.style.display = '';
        this.btnCancel.style.display = !!options.btnCancel ? '' : 'none';
        

        this.input.oninput = this.onInput.bind(this);
        this.input.onkeydown = this.onInputKeyDown.bind(this);
        this.input.onkeypress = this.onInputKeyPress.bind(this);
        this.input.onkeyup = this.onInputKeyUp.bind(this);
        this.chkDontAskMeAgain.onclick = this.onChkDontAskMeAgain.bind(this);
        this.btnOK.onclick = this.onOKButtonClick.bind(this);
        this.btnCancel.onclick = this.onCancelButtonClick.bind(this);

        if (this.type === 'yes_no') {
            this.btnOK.textContent = 'はい';
            this.btnCancel.textContent = 'いいえ';
            this.btnCancel.style.display = !!options.btnCancel ? '' : 'none';
        } else {
            this.btnOK.textContent = 'ＯＫ';
            this.btnCancel.textContent = 'キャンセル';
            if (this.type === 'ok_cancel') this.btnCancel.style.display = !!options.btnCancel ? '' : 'none';
        }
    }

    show({ usedNameList, value, descriptionText, state, exoptions }) {
        this.usedNameList = usedNameList || [];

        this.description.textContent = descriptionText || this.descriptionText;
        this.setupDialog(exoptions);

        this.dialogMask.style.display = '';
        this.dialog.style.display = '';
        this.displayState = 'show';
        this.state = state;

        if (value !== null) {
            this.input.value = value;
            this.input.focus();
            this.input.select();
        }
    }

    hide() {
        this.dialogMask.style.display = 'none';
        this.dialog.style.display = 'none';
        this.displayState = 'hide';
    }

    onInput(evt) {
        if (this.usedNameList.includes(this.input.value)) {
            this.warnings.style.display = '';
            this.btnOK.disabled = true;
        } else if (!this.input.value.trim()) {
            this.btnOK.disabled = true;
        } else {
            this.btnOK.disabled = false;
        }
    }

    onInputKeyDown(evt) {
        this.keyPressFlg = false;
    }

    onInputKeyPress(evt) {
        this.keyPressFlg = true;
    }

    onInputKeyUp(evt) {
        if (evt.code === 'Enter') {
            if (this.keyPressFlg) this.btnOK.click();
        }
    }

    onChkDontAskMeAgain(evt) {
        this.chkDontAskMeAgain.classList.toggle('checked');
    }

    onOKButtonClick(evt) {
        this.hide();
        let radioSelected = document.querySelector('.dialog-radioitem.selected'); 
        this.emit('dialogResult', { 
            value: this.input.value, 
            dontAskMeAgain: this.chkDontAskMeAgain.classList.contains('checked'),
            radioSelected: radioSelected ? radioSelected.dataset.value : undefined
        });
    }

    onCancelButtonClick(evt) {
        this.hide();
        this.emit('cancel', { dontAskMeAgain: this.chkDontAskMeAgain.classList.contains('checked') });
    }

    updateSelect(data) {
        this.select.innerHTML = '';
        const fragment = document.createDocumentFragment();
        data.forEach(item => {
            const opt = util.newElm({
                tagName: 'option',
                textContent: item.text,
                value: item.value,
                selected: item.value === this.selectedValue
            });
            fragment.appendChild(opt);
        });
        this.select.appendChild(fragment);
    }
}