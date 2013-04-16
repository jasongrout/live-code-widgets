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

    t = this.node.find('table');
    t.keydown('ctrl+.', function(event) {_this.insertRow(event); _this.updateText();})
    t.keydown('ctrl+,', function(event) {_this.insertColumn(event); _this.updateText();})
    t.find('input').first().keydown('shift+tab', $.proxy(this,'exitLeft'))
    t.find('input').last().keydown('tab', $.proxy(this,'exitRight'))
    this.updateText();
}

TableWidget.prototype.exitLeft = function() {
    this.cm.focus();
    this.cm.setCursor(this.mark.find().from);
    return false;
}

TableWidget.prototype.exitRight = function() {
    this.cm.focus();
    this.cm.setCursor(this.mark.find().to);
    return false;
}

TableWidget.prototype = Object.create(Widget.prototype)

TableWidget.prototype.insertRow = function(event) {
    var tr = $(event.target).closest('tr');
    var newtr = tr.clone();
    tr.after(newtr);
    // if last tr, we need to remove the event handler and add it to the new last input
    if (newtr.next('tr').length === 0) {
        tr.find('input').last().off('keydown');
        newtr.find('input').last().keydown('tab', $.proxy(this,'exitRight'))
    }
}

TableWidget.prototype.insertColumn = function(event) {
    console.log('insert column');
}


TableWidget.prototype.updateText = function() {
    var matrix = [];
    this.node.find('tr').each(function() {
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
/***********************************************************************/
/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){
	
	jQuery.hotkeys = {
		version: "0.8",

		specialKeys: {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
		    120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
		},
	
		shiftNums: {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
			".": ">",  "/": "?",  "\\": "|"
		},
            exceptions: {
                186: 59, // ;
                187: 61, // =
                188: 44, // ,
                189: 45, // -
                190: 46, // .
                191: 47, // /
                192: 96, // `
                219: 91, // [
                220: 92, // \
                221: 93, // ]
                222: 39  // '
            }
	};

	function keyHandler( handleObj ) {
		// Only care when a possible input has been specified
		if ( typeof handleObj.data !== "string" ) {
			return;
		}
		
		var origHandler = handleObj.handler,
			keys = handleObj.data.toLowerCase().split(" ")
	    //textAcceptingInputTypes = ["text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime", "datetime-local", "search", "color"];
	
		handleObj.handler = function( event ) {
			// Don't fire in text-accepting inputs that we didn't directly bind to
			/*if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
				jQuery.inArray(event.target.type, textAcceptingInputTypes) > -1 ) ) {
				return;
			}
                        */
			
			// Keypress represents characters, not special keys
			var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
		    character = String.fromCharCode( jQuery.hotkeys.exceptions[event.which] || event.which ).toLowerCase(),
				key, modif = "", possible = {};

			// check combinations (alt|ctrl|shift+anything)
			if ( event.altKey && special !== "alt" ) {
				modif += "alt+";
			}

			if ( event.ctrlKey && special !== "ctrl" ) {
				modif += "ctrl+";
			}
			
			// TODO: Need to make sure this works consistently across platforms
			if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
				modif += "meta+";
			}

			if ( event.shiftKey && special !== "shift" ) {
				modif += "shift+";
			}

			if ( special ) {
				possible[ modif + special ] = true;

			} else {
				possible[ modif + character ] = true;
				possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
				if ( modif === "shift+" ) {
					possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
				}
			}
			for ( var i = 0, l = keys.length; i < l; i++ ) {
				if ( possible[ keys[i] ] ) {
					return origHandler.apply( this, arguments );
				}
			}
		};
	}

	jQuery.each([ "keydown", "keyup", "keypress" ], function() {
		jQuery.event.special[ this ] = { add: keyHandler };
	});

})( jQuery );
/************ END Jquery hotkeys plugin *******************/