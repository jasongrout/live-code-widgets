$(function() {
    var cm = CodeMirror.fromTextArea($("#code")[0],
                                     {mode: "python",
                                      lineNumbers:true,
                                      autofocus:true})
    $("#insertinteger").click(function() {
        // change the marked range text to have delimiters
        new IntegerWidget(cm)
        cm.focus();
    })
    $("#inserttable").click(function() {
        // change the marked range text to have delimiters
        new TableWidget(cm)
        cm.focus();
    })
    var updateContents = function(cm) { $("#content").text(cm.getValue())};
    updateContents(cm)
    cm.on("change", updateContents);
    
})
if ( !Object.create ) {
    // shim for ie8, etc.
    Object.create = function ( o ) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

function Widget(cm) {
    // the subclass must define this.domNode before calling this constructor
    this.cm = cm
    cm.replaceSelection("\u2af7"+cm.getSelection()+"\u2af8")
    var from = cm.getCursor(true)
    var to = cm.getCursor(false)
    this.mark = cm.markText(from, to, {replacedWith: this.domNode,
                                       //inclusiveLeft:true,inclusiveRight:true
                                      })
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
    return this.cm.getRange(r.from, r.to)
}

function IntegerWidget() {
    this.value = 0;
    this.node = $(".widget-templates .integerwidget").clone();
    this.domNode = this.node[0];
    _this = this
    Widget.apply(this, arguments);
    
    this.node.find('.inc').click($.proxy(this, 'changeValue', 1))
    this.node.find('.dec').click($.proxy(this, 'changeValue', -1))
    this.node.find('.value').change(function(e) {_this.setValue($(this).val())})

    // Cursor movement into and out of the input box
    CodeMirror.on(this.mark, "beforeCursorEnter", function() {
        // TODO: be intelligent about which side we are entering from
        _this.node.find('.value').focus();
    });    
    this.node.find('.value').keydown(function(e) {
        // when we move out of the box, put the cursor back in the codemirror instance
        // TODO: be smarter about where the cursor in codemirror ends up.
        var t = $(this);
        var pos = t.getCursorPosition()
        if ((pos==t.val().length && e.keyCode==39)
           || (pos==0 && e.keyCode==37)) {
            _this.cm.focus()
        }
    })
    
    var t = this.getText();
    if (t !== "") {
        this.value = parseInt(t);
    }
    // set text to the parsed or default value initially
    this.changeValue(0)
}
IntegerWidget.prototype = Object.create(Widget.prototype)
IntegerWidget.prototype.changeValue = function(inc) {
    this.setValue(this.value+inc);
}
IntegerWidget.prototype.setValue = function(val) {
    this.value = parseInt(val);
    this.setText(this.value.toString());
    this.node.find('.value').val(this.value);
}

function TableWidget() {
    this.node = $(".widget-templates .tablewidget").clone();
    this.domNode = this.node[0];
    Widget.apply(this, arguments);
}

// From http://stackoverflow.com/a/2897510/1200039
(function($) {
    $.fn.getCursorPosition = function() {
        var input = this.get(0);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    }
})(jQuery);
