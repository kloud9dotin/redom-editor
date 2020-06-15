const { el, mount, text, list, setChildren, setStyle, setAttr } = redom

const model = {
    state: {
        hidePreviewWindow : (document.body.clientWidth < 768 ? true: false),
        previewVisibility : false,
        isMenuOpen: false
    },
    data: {

    }
}



class EditorPane {
    constructor(notifyParent) {
        this.notifyParent = notifyParent
        this.textArea = el("textarea.w-100.h-100.bn.pa2", {style:"outline:none", placeholder:"Write Something", onkeyup: function(e) {
            if (e.code == "Enter" || e.code == "Space") {
                this.notifyParent("contentChange", this.textArea.value )
            }
        }.bind(this)})
        this.el = el("div.w-100.h-100.pa2", this.textArea)
    }
}

class RenderElement {
    constructor() {
        this.el = el("div.w-100.h-100")
    }
    update(data) {
        setChildren(this.el, data)
    }
}

class PreviewPane {
    constructor() {
        this.renderedElement = new RenderElement()
        this.el = el("div.w-100.h-100.pa3", {style:"background:#d3d3d3;"}, this.renderedElement)
    }
    update(data) {
        this.renderedElement.update(data)
    }
}

class MenuPane {
    constructor() {
        this.el = el("div.h-100")
        setStyle(this.el, {width:"0%", transition:"all 1s ease-in-out"})
    }
    update(isMenuOpen) {
        setStyle(this.el, {width:(isMenuOpen? "20%" : "0%")})
    }
}

class headerBar {
    constructor(notifyParent) {
        this.menu = el("span", "Menu", {onclick: function() {notifyParent("toggleMenu")}})
        this.previewToggle = el("span", {onclick: function() {notifyParent("togglePreview")}}, "Preview")
        this.el = el("div.w-100.pa2.h2.flex.justify-between.items-center", this.menu, (model.state.hidePreviewWindow ? this.previewToggle : ""))
    }
    update() {
        this.previewToggle.textContent = (model.state.previewVisibility? "Editor" : "Preview")
    }
    resize() {
        if(model.state.hidePreviewWindow) {
            setChildren(this.el, [this.menu, this.previewToggle])
        }
        else {
            setChildren(this.el, [this.menu])
        }
    }
}

class App {
    constructor() {
        this.editor = new EditorPane(this.onChildEvent.bind(this))
        this.preview = new PreviewPane()
        this.menu = new MenuPane()
        this.header = new headerBar(this.onChildEvent.bind(this))
        this.editorPreview = el("div.w-100.h-100.flex", this.editor, (model.state.hidePreviewWindow ? "" :this.preview))
        this.workArea = el("div.w-100.h-100.flex.flex-column", this.header, this.editorPreview)
        this.el = el("div.w-100.h-100.flex", this.menu, this.workArea)

        this.blockNodes = {"heading" : "h", "paragraph": "p"}
        this.inlineNodes = {"text": "text", "strong": "strong", "em": "em", "br" : "br", "link" : "a"}
        this.tokenToRedom = function(data) {
            let temp = data.map( function(k) {
                console.log(k.type)
                if (this.blockNodes[k.type]) {
                    if (k.tokens.length == 1) {
                        return el("" + this.blockNodes[k.type] + (k.type == "heading" ? k.depth : ""), k.text)
                    }
                    return el("" + this.blockNodes[k.type] + (k.type == "heading" ? k.depth : ""), this.tokenToRedom(k.tokens))
                }
                else {
                    console.log(k)
                    return el("" + this.inlineNodes[k.type], (k.type == "link" ? {href:k.href} : ""), k.text)
                }
            }.bind(this))
            return temp
        }.bind(this)
    }

    resize() {
        if(model.state.hidePreviewWindow) {
            setChildren(this.editorPreview, this.editor)
        }
        else {
            setChildren(this.editorPreview, this.editor, this.preview)
        }
        this.header.resize()
    }

    onChildEvent(type, data) {
        switch(type) {
            case "toggleMenu":
                this.menu.update(!model.state.isMenuOpen)
                model.state.isMenuOpen = !model.state.isMenuOpen
                break
            case "togglePreview":
                if(model.state.previewVisibility) {
                    setChildren(this.editorPreview, [this.editor])
                }
                else {
                    setChildren(this.editorPreview, [this.preview])
                }
                model.state.previewVisibility = !model.state.previewVisibility
                this.header.update()
                break
            case "contentChange":
                this.preview.update(this.tokenToRedom( marked.lexer(data)))
                break
        }
    }
}


let app = new App()
mount(document.body, app)
setStyle(document.body, {margin: 0, padding: 0, "font":"16px Arial", width:"100%", height: "100%", "box-sizing": "border-box", "overflow": "hidden"})
setStyle(document.documentElement, {margin: 0, padding: 0, width:"100%", height: "100%","box-sizing": "border-box"})

window.onresize = function() {
    model.state.hidePreviewWindow = (document.body.clientWidth < 768 ? true: false)
    model.state.previewVisibility = false
    app.resize()
}