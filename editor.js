const { el, mount, text, list, setChildren, setStyle, setAttr } = redom

const model = {
    state: {
        hidePreviewWindow : (document.body.clientWidth < 768 ? true: false),
        previewVisibility : false,
        helpVisibile: false,
        settingsVisible: false,
    },
    data: {

    }
}



class EditorPane {
    constructor(notifyParent) {
        this.notifyParent = notifyParent
        this.textArea = el("div.w-100.pa2", {contentEditable:true, style:"outline:none;", autofocus: true, "data-placeholder":"Write Something", onkeyup: function(e) {
            if (e.code == "Enter" || e.code == "Space") {
                this.notifyParent("contentChange", this.textArea.innerText )
            }
        }.bind(this)})
        this.el = el("div.w-100.pa2.flex-grow-1", this.textArea)
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
        this.el = el("div.h-100.flex-grow-1.flex-shrink-1.pa3.bg-color1", this.renderedElement)
    }
    update(data) {
        this.renderedElement.update(data)
    }
}

class HelpPane {
    constructor(notifyParent) {
        this.el = el("div.w-100.bg-color2", {style:"max-height:0px;overflow:hidden;transition:all 1s ease-in-out"},
            el("div.w-100.flex.pa2.justify-between.items-center.gray", el("span","Quick Help"), el("span", {onclick:function(e) {notifyParent("toggleHelp")}}, "\u2715")),
            el("div.w-100.pa2", el("text", "For bold wrap text with ** or __"), el("br"),el("span", "For italics wrap text with * or  _"), el("br"),el("span", "For new paragaph, insert a 2 newlines"), el("br"),el("span", "For line break, insert 2 spaces followed by a new line") ))
    }
    toggle(data) {
        if(data) {
            setStyle(this.el, {"max-height":"1000px"})
        }
        else {
            setStyle(this.el, {"max-height":"0px"})
        }
    }
}

class SettingsPane {
    constructor() {
        this.el = el("div.h-100.w-75.w-25-l.fixed.mt4.bg-red", {style:"transition: all 1s ease-in-out"})
        setStyle(this.el, {right:(model.state.hidePreviewWindow ? "-75%" : "-25%")})
    }
    resize() {
        setStyle(this.el, {right:(model.state.hidePreviewWindow ? "-75%" : "-25%")})
    }
    toggle(data) {
        if (data) {
            setStyle(this.el, {right:"0"})
        }
        else {
            setStyle(this.el, {right:(model.state.hidePreviewWindow ? "-75%" : "-25%")})
        }
    }
}

class headerBar {
    constructor(notifyParent) {
        this.previewToggle = el("span.pa2", {onclick: function() {notifyParent("togglePreview")}}, "Preview")
        this.helpToggle = el("span.pa2.f3.fw6", {onclick: function() {notifyParent("toggleHelp")}}, "?")
        this.settingsToggle = el("span.pa2.f3.fw6", {onclick: function() {notifyParent("toggleSettings")}},  "\u2699")
        this.el = el("div.w-100.pa2.h2.flex.justify-end.items-center", (model.state.hidePreviewWindow ? this.previewToggle : ""), this.helpToggle, this.settingsToggle)
    }
    update() {
        this.previewToggle.textContent = (model.state.previewVisibility? "Editor" : "Preview")
        setStyle(this.helpToggle, {display:(model.state.previewVisibility? "none" : "flex")})
    }
    resize() {
        if(model.state.hidePreviewWindow) {
            setChildren(this.el, [this.previewToggle, this.helpToggle, this.settingsToggle])
        }
        else {
            setChildren(this.el, [this.helpToggle, this.settingsToggle])
        }
    }
}

class App {
    constructor() {
        this.help = new HelpPane(this.onChildEvent.bind(this))
        this.editor = new EditorPane(this.onChildEvent.bind(this))
        this.settings = new SettingsPane(this.onChildEvent.bind(this))
        this.editorArea = el("div.mw-100.w-100.w-50-l", {style:"resize:"+ (model.state.hidePreviewWindow? "none" : "horizontal;") + "overflow:auto;"}, this.help, this.editor)
        this.preview = new PreviewPane()
        this.header = new headerBar(this.onChildEvent.bind(this))
        this.editorPreview = el("div.w-100.h-100.flex", this.editorArea, (model.state.hidePreviewWindow ? "" : this.preview))
        this.workArea = el("div.w-100.h-100.flex.flex-column", this.header, this.editorPreview)
        this.el = el("div.w-100.h-100.flex.flex-column", this.workArea, this.settings)

        this.blockNodes = {"heading" : "h", "paragraph": "p"}
        this.inlineNodes = {"text": "text", "strong": "strong", "em": "em", "br" : "br", "link" : "a"}
        this.tokenToRedom = function(data) {
            let temp = data.map( function(k) {
                if (this.blockNodes[k.type]) {
                    if (k.tokens.length == 1) {
                        return el("" + this.blockNodes[k.type] + (k.type == "heading" ? k.depth : ""), k.text)
                    }
                    return el("" + this.blockNodes[k.type] + (k.type == "heading" ? k.depth : ""), this.tokenToRedom(k.tokens))
                }
                else {
                    return el("" + this.inlineNodes[k.type], (k.type == "link" ? {href:k.href} : ""), k.text)
                }
            }.bind(this))
            return temp
        }.bind(this)
    }

    resize() {
        if(model.state.hidePreviewWindow) {
            setChildren(this.editorPreview, this.editorArea)
            setStyle(this.editorArea,{resize:"none"})
        }
        else {
            setChildren(this.editorPreview, this.editorArea, this.preview)
            setStyle(this.editorArea,{resize:"horizontal", overflow:"auto"})
        }
        this.header.resize()
        this.settings.resize()
        model.state.helpVisibile = model.state.settingsVisible = false
        this.help.toggle(0)
    }

    onChildEvent(type, data) {
        switch(type) {
            case "toggleHelp":
                model.state.helpVisibile = !model.state.helpVisibile
                this.help.toggle(model.state.helpVisibile)
                break
            case "toggleSettings":
                model.state.settingsVisible = !model.state.settingsVisible
                this.settings.toggle(model.state.settingsVisible)
                break
            case "togglePreview":
                if(model.state.previewVisibility) {
                    setChildren(this.editorPreview, [this.editorArea])
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
setStyle(document.body, {margin: 0, padding: 0, "font":"16px", width:"100%", height: "100%", "box-sizing": "border-box", "overflow": "hidden"})
setStyle(document.documentElement, {margin: 0, padding: 0, width:"100%", height: "100%","box-sizing": "border-box"})

window.onresize = function() {
    model.state.hidePreviewWindow = (document.body.clientWidth < 768 ? true: false)
    model.state.previewVisibility = false
    app.resize()
}