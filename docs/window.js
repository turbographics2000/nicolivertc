const capSrcs = [
    {
        width: 600,
        height: 400,
        color: 'acf'
    },
    {
        width: 800,
        height: 400,
        color: 'caf'
    },
    {
        width: 240,
        height: 200,
        color: 'fac'
    },
    {
        width: 800,
        height: 600,
        color: 'ccf'
    }
];
const outputSize = {
    width: 1280,
    height: 720,
    aspect: 1280 / 720
};
let cnvSize = {
    left: 0,
    top: 0,
    width: 0,
    height: 0
};
let layoutScale = 0;
let dragElm = null;

document.querySelectorAll('.tab').forEach(elm => {
    elm.onclick = function () {
        console.log(this.textContent);
    };
})
document.querySelectorAll('.hoge').forEach(elm => {
    elm.draggable = true;
    elm.ondragstart = function (evt) {
        evt.dataTransfer.setData("text", ev.target.id);
    }
    elm.ondragstart = function (evt) {
        dragElm = this;
    }
    Object.assign(elm.style, {
        width: '30px',
        height: '30px',
        border: '1px solid',
        margin: '4px'
    });
});

layoutArea.ondragover = function (evt) {
    evt.preventDefault();
};
layoutArea.ondrop = function (evt) {
    evt.preventDefault();
    console.log(evt.currentTarget);
    debugger;
};


window.onresize = function (evt) {
    const layoutAreaPadding = 10;
    const rct = layoutArea.getBoundingClientRect();
    const layoutAreaW = rct.width - (layoutAreaPadding * 2);
    const layoutAreaH = rct.height - (layoutAreaPadding * 2);
    const layoutAreaAspect = layoutAreaW / layoutAreaH;
    let cnvW = 0;
    let cnvH = 0;
    if (outputSize.aspect > layoutAreaAspect) {
        cnvW = layoutAreaW;
        cnvH = cnvW / outputSize.aspect;
    } else {
        cnvH = layoutAreaH;
        cnvW = cnvH * outputSize.aspect;
    }

    layoutScale = cnvW / outputSize.width;
    Object.assign(cnvSize, {
        left: (rct.width - cnvW) / 2,
        top: (rct.height - cnvH) / 2,
        width: cnvW,
        height: cnvH
    });
    Object.assign(cnv.style, {
        left: `${cnvSize.left}px`,
        top: `${cnvSize.top}px`,
        width: `${cnvSize.width}px`,
        height: `${cnvSize.height}px`
    });
};
window.onresize();