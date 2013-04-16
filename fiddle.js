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
    CodeMirror.on(this.mark, "beforeCursorEnter", function(e) {
        // TODO: *only* do something if it was a plain arrowkey move.
        //  don't do anything if it was extending the selection, deleting the input, etc.
        var t = _this.node.find('.value')
        var curr = _this.cm.getCursor()
        var m = _this.mark.find().from
        t.focus();
        if (curr.line === m.line && curr.ch === m.ch) {
            t.setCursorPosition(0)
        } else {
            t.setCursorPosition(t.val().length)
        }
    });
    this.node.find('.value').keydown(function(e) {
        // when we move out of the box, put the cursor back in the codemirror instance
        var t = $(this);
        var pos = t.getCursorPosition()
        var range = _this.mark.find()
        if (pos===0 && e.keyCode===37) {
            _this.cm.focus()
            _this.cm.setCursor(range.from)
        } else if (pos===t.val().length && e.keyCode===39) {
            _this.cm.focus()
            _this.cm.setCursor(range.to)
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
    _this = this;

    this.node.find("table").change($.proxy(this, 'updateText'));

    // Cursor movement into and out of the input box
    CodeMirror.on(this.mark, "beforeCursorEnter", function(e) {
        // TODO: *only* do something if it was a plain arrowkey move.
        //  don't do anything if it was extending the selection, deleting the input, etc.
        var t = _this.node.find('table')
        var curr = _this.cm.getCursor()
        var m = _this.mark.find().from
        if (curr.line === m.line && curr.ch === m.ch) {
            // first item
            t.find("input").first().focus();
        } else {
            // last item
            t.find("input").last().focus();
        }
    });
    this.node.find("input").last().keydown(function(e) {
        if (e.keyCode === 9 && !e.shiftKey) {
            _this.cm.focus();
            _this.cm.setCursor(_this.mark.find().to);
            return false;
        }
    });

    this.node.find("input").first().keydown(function(e) {
        if (e.keyCode === 9 && e.shiftKey) {
            _this.cm.focus();
            _this.cm.setCursor(_this.mark.find().from);
            return false;
        }
    });

/*    this.node.find('table').keydown(function(e) {
        // when we move out of the box, put the cursor back in the codemirror instance
        var t = $(e.target);
        console.log(t);
        var TABKEY = 9;
        var range = _this.mark.find()
        if (pos===0 && e.keyCode===37) {
            _this.cm.focus()
            _this.cm.setCursor(range.from)
        } else if (pos===t.val().length && e.keyCode===39) {
            _this.cm.focus()
            _this.cm.setCursor(range.to)
        }

    })
*/
    this.updateText();
}

TableWidget.prototype = Object.create(Widget.prototype)

TableWidget.prototype.updateText = function() {
    var matrix = [];
    $($("table")[1])
        .find('tr')
        .each(function() {
            var row = [];
            $(this).find('input').each(function() {row.push(interpret($(this).val()))});
            matrix.push(row);
        });
    this.setText("matrix(QQ,"+JSON.stringify(matrix)+")");
}

// From http://stackoverflow.com/a/2897510/1200039
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

// from http://stackoverflow.com/q/499126/1200039
$.fn.setCursorPosition = function(pos) {
    if ($(this).get(0).setSelectionRange) {
        $(this).get(0).setSelectionRange(pos, pos);
    } else if ($(this).get(0).createTextRange) {
        var range = $(this).get(0).createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
}

function interpret(n) {
    if (n!== "" && !isNaN(n)) {
        n = +n; // convert n to number
    }
    return n;
}