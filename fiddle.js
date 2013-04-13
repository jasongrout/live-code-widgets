$(function() {
    var cm = CodeMirror.fromTextArea($("#code")[0],
                                     {mode: "python",
                                      lineNumbers:true})
    $("#insert").click(function() {
        // change the marked range text to have delimiters
        cm.replaceSelection("\u2af7"+cm.getSelection()+"\u2af8")
        var from = cm.getCursor(true)
        var to = cm.getCursor(false)
        var widget = newWidget(cm)
        var m=cm.markText(from, to, {replacedWith: widget.domNode})
        widget.mark = m;
        widget.setValue();
        cm.setCursor(to);
        cm.focus();
    })
    var updateContents = function(cm) { $("#content").text(cm.getValue())};
    updateContents(cm)
    cm.on("change", updateContents);
    
    newWidget = function(cm) {
        var obj = {}
        var value = 0;
        var node = $(".widget-template").clone().removeClass('widget-template');
        var range = function() {
            var find = obj.mark.find()
            find.from.ch+=1
            find.to.ch-=1
            return find;
        }
        var replaceText = function(text) {
            var r = range()
            cm.replaceRange(text, r.from, r.to)
        }
        var getText = function() {
            var r = range()
            return cm.getRange(r.from, r.to)
        }
        var setValue = function() {
            var text = getText()
            var value = 0
            if (text !== "") {
                value = parseInt(text);
            }
            node.find('.value').text(value);
        }
        var changeValue = function(inc) {
            value += inc;
            replaceText(value.toString());
            node.find('.value').text(value);
        }
        node.find('.inc').click(function() {changeValue(1)})
        node.find('.dec').click(function() {changeValue(-1)})

        obj.setValue = setValue;
        obj.domNode = node[0];

        return obj
    }
});

