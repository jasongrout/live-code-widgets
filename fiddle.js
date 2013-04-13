$(function() {
    var cm = CodeMirror.fromTextArea($("#code")[0],
                                     {mode: "python",
                                      lineNumbers:true})
    $("#insert").click(function() {
        // change the marked range text to have delimiters
        var widget = new IntegerWidget(cm)
        cm.focus();
    })
    var updateContents = function(cm) { $("#content").text(cm.getValue())};
    updateContents(cm)
    cm.on("change", updateContents);
    
    
    if ( !Object.create ) {
        // shim for ie8, etc.
        Object.create = function ( o ) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    function Widget(cm) {
        this.cm = cm
        cm.replaceSelection("\u2af7"+cm.getSelection()+"\u2af8")
        var from = cm.getCursor(true)
        var to = cm.getCursor(false)
        this.mark = cm.markText(from, to, {replacedWith: this.domNode})
        cm.setCursor(to);
        cm.refresh()
    }
    Widget.prototype.range = function() {
        var find = this.mark.find()
        find.from.ch+=1
        find.to.ch-=1
        return find;
    }
    Widget.prototype.setText = function(text) {
        var r = this.range()
        this.cm.replaceRange(text, r.from, r.to)
    }
    Widget.prototype.getText = function() {
        var r = this.range()
        return cm.getRange(r.from, r.to)
    }
    
    function IntegerWidget() {
        this.value = 0;
        this.node = $(".widget-template").clone().removeClass('widget-template');
        this.domNode = this.node[0];
        Widget.apply(this, arguments);

        this.node.find('.inc').click($.proxy(this, 'changeValue', 1))
        this.node.find('.dec').click($.proxy(this, 'changeValue', -1))

        var t = this.getText();
        if (t !== "") {
            this.value = parseInt(t);
        }
        // set text to the parsed value initially
        this.changeValue(0)
    }
    IntegerWidget.prototype = Object.create(Widget.prototype)
    IntegerWidget.prototype.changeValue = function(inc) {
        this.value += inc;
        this.setText(this.value.toString());
        this.node.find('.value').text(this.value);
    }
});