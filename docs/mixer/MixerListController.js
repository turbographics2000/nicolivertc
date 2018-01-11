import { ListController } from '../base/ListController.js';
import util from '../base/util.js';
import { AudioInputItemManager } from './AudioInputItemManager.js';

export class MixerListController extends ListController {
    constructor(selector, options) {
        super(selector, Object.assign({}, options, {
            items: new AudioInputItemManager(options || {})
        }));
        this.items.on('itemStateChanged', this.onItemStateChanged.bind(this));
    }

    onInput_volume(evt, item, propertyName) {
        item[propertyName] = evt.target.value;
        this.updateText(item.controls.texts[propertyName], evt.target.value);
    }

    onClick_settings(evt, index) {
        // TODO
    }

    onItemStateChanged(item, index, state, error) {
        const name = item.controls.texts.name;
        const volume = item.controls.inputs.volume;
        //const settings = item.controls.buttons.settings;
        const muted = item.controls.toggleButtons.muted;
        const err = item.controls.error.errorMessage;
        switch (state) {
            case 'started':
                name.classList.remove('error');
                err.classList.remove('error');
                //settings.classList.remove('disabled');
                muted.classList.remove('disabled');
                name.textContent = item.name;
                volume.disabled = false;
                break;
            case 'stopped':
                volume.disabled = true;
                break;
            case 'error':
                name.classList.add('error');
                err.classList.add('error');
                //settings.classList.add('disabled');
                muted.classList.add('disabled');
                volume.disabled = true;
                break;
        }
    }

    updateInput(ctrl, value) {
        ctrl.value = value;
    }

    createItemElement(item, container, index) {
        const spanName = util.newElm({
            tagName: 'span',
            textContent: item.name,
            dataset: { propertyName: 'name' },
            classes: ['item-name', 'ellipsis']
        });

        const spanVolumeValue = util.newElm({
            tagName: 'span',
            textContent: item.volume,
            dataset: { propertyName: 'volume' },
            classes: ['item-volumevalue']
        });

        const cellItemHeader = util.newElm({
            classes: ['item-header'],
            children: [spanName, spanVolumeValue]
        });

        const cellVolume = util.newElm({
            tagName: 'input',
            dataset: { propertyName: 'volume' },
            classes: ['item-volume'],
            attributes: {
                type: 'range',
                value: item.volume
            }
        });

        const cellMuted = util.newElm({
            dataset: { propertyName: 'muted' },
            textContent: 'volume_up',
            classes: ['item-muted', 'material-icons', 'list-item-button', item.muted ? '' : 'on']
        });

        // const cellSettings = util.newElm({
        //     textContent: 'settings',
        //     classes: ['material-icons', 'mixer-settings']
        // });

        const errorMessage = util.newElm({
            classes: ['item-error']
        });

        const itemElm = util.newElm({
            classes: ['item'],
            children: [cellItemHeader, cellVolume, cellMuted/*, cellSettings*/]
        });

        item.itemElement = itemElm;
        item.controls = {
            texts: { name: spanName, volume: spanVolumeValue },
            toggleButtons: { muted: cellMuted },
            // buttons: { settings: cellSettings },
            inputs: { volume: cellVolume },
            error: { errorMessage }
        };
        super.createItemElement(item, container, index);
    }

    updateToggleButton(ctrl, value) {
        if (ctrl.dataset.propertyName === 'muted') {
            value = !value;
        }
        if (value) {
            if (!ctrl.classList.contains('on')) {
                ctrl.classList.add('on');
            }
        } else {
            ctrl.classList.remove('on');
        }
    }
}