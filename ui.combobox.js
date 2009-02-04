/* 
* vim: noexpandtab 
*/

/**
* JQuery UI combobox plugin.  This may be called on any element; the element
* is replaced by a text field and drop-down div.  If the replaced element was
* a select, the combobox options can be picked up from the contents of the
* select.  Otherwise, the 'data' option must be provided to specify choice.
*
* Method names in documentation are relative to the JQuery UI infrastructure,
* i.e. the method call is always 'combobox', and then the method name is
* passed as the first (string) argument.
*
* @fileoverview
* @author Jonathan Tang
* @dependency jquery-1.2.6.js
* @dependency ui.core.js
*/
function createCombo(element, bAutoShow, bArrowVisible, width) {
    var sArrowURL = document.getElementById("_skinurl").value + "/drop_down.png";
    var sArrowClickedURL = document.getElementById("_skinurl").value + "/drop_down_clicked.png";
    var elemFakeEdit = document.getElementById(element + "_edit");
    if (elemFakeEdit == null)
        return;
    var options = { width: width, fakeEdit: elemFakeEdit, selectedValue: elemFakeEdit.value, autoShow: bAutoShow, arrowURL: sArrowURL, arrowClickedURL: sArrowClickedURL, arrowVisible: bArrowVisible };
    $('#' + element).combobox(options);
};

; (function($) {

    var KEY_UP = 38,
	KEY_DOWN = 40,
	KEY_ENTER = 13,
	KEY_ESC = 27,
	KEY_F4 = 115;

    $.widget('ui.combobox', {

        /**
        * Main JQuery method.  Call $(selector).combobox(options) on any element,
        * or collection of elements, to turn them into a combobox.
        * 
        * All event handlers take 2 arguments: the original browser event, and an
        * object with the following fields:<ul> 
        * <li>value: the current value of the input field</li>
        * <li>index: the index within the option list of the presently-selected
        * value, or -1 if directly inputted.</li>
        * <li>isCustom: true if the user has typed in an option not on the list</li>
        * <li>inputElement: JQuery object containing the input field</li>
        * <li>listElement: JQuery object containing the drop-down list</li>
        * </ul>
        * @function combobox
        * @param {Object} options Options hash
        * @option {Array<String>} data List of options for the combobox
        * 
        * @option {Boolean} autoShow If true (the default), then display the
        * drop-down whenever the input field receives focus.  Otherwise, the 
        * user must explicitly click the drop-down icon to show the list.
        * 
        * @option {Boolean} matchMiddle If true (the default), then the combobox
        * tries to match the typed text with any portion of any of the 
        * options, instead of just the beginning.
        * 
        * @option {Function(e, ui)} key Event handler called whenever a key is
        * pressed in the input box.
        * 
        * @option {Function(e, ui)} change Event handler called whenever a new
        * option is selected on the drop-down list (eg. down/up arrows, typing in 
        * the input field).
        * 
        * @option {Function(e, ui)} select Event handler called when a selection
        * is finished (enter pressed or input field loses focus)
        * 
        * @option {String} arrowUrl URL of the image used for the drop-down arrow.
        * Used only by the default arrowHTML function; if you override 
        * that, you don't need to supply this.  Defaults to "drop_down.png"
        * 
        * @option {Function()} arrowHTML Function that should return the HTML of
        * the element used to display the drop-down.  Defaults to an image tag.
        *
        * @option {String} listContainerTag Tag to hold the drop-down list element.
        *
        * @option {Function(String, Int)} listHTML Function that takes the option
        * datum and index within the list and returns an HTML fragment for each
        * option.  Default is a span of class ui-combobox-item.
        */
        init: function() {
            var that = this;
            var options = this.options;
            var inputElem = $('<input type = "text" syze= "' + options.width + '"/>');

            if (this.element[0].tagName.toLowerCase() == 'select') {
                fillDataFromSelect(options, this.element);
            }

            options.originElement = this.element[0];

            function closeListOnDocumentClick() {
                that.hideList();
                $(document).unbind('click', closeListOnDocumentClick);
            };

            function displayNormalArrow() {
                that.arrowElem[0].src = that.options.arrowURL;
                $(document).unbind('mouseover', closeListOnDocumentClick);
            };

            if (options.arrowVisible) {
                this.arrowElem = $(options.arrowHTML.call(this));
            }
            else {
                this.arrowElem = inputElem;
            }
            if (options.arrowVisible) {
                this.arrowElem
                .click(function(e) {
                    if (that.isListVisible()) {
                        that.hideList();
                    } else {
                        that.showList();
                    }
                    $(document).click(closeListOnDocumentClick);
                    return false;
                })
                .mousedown(function(e) {
                    that.arrowElem[0].src = that.options.arrowClickedURL;
                    $(document).mouseover(displayNormalArrow);
                    return false;
                })
                .mouseup(function(e) {
                    that.arrowElem[0].src = that.options.arrowURL;
                    return false;
                });
            }

            function maybeCopyAttr(name, elem) {
                var val = that.element.attr(name);
                if (val) {
                    if (name == 'class') {
                        elem.addClass(val);
                    } else {
                        elem.attr(name, val);
                    }
                }
            };

            maybeCopyAttr('class', inputElem);
            maybeCopyAttr('name', inputElem);
            maybeCopyAttr('title', inputElem);
            maybeCopyAttr('dir', inputElem);
            maybeCopyAttr('lang', inputElem);
            maybeCopyAttr('xml:lang', inputElem);
            maybeCopyAttr('size', inputElem);

            maybeCopyAttr('value', inputElem);
            if (options.selectedValue != "")
                inputElem.attr('value', options.selectedValue);

            // Maxlength comes back -1 if unset, which causes problems when set
            if (this.element.attr('maxlength') != -1) {
                inputElem.attr('maxlength', this.element.attr('maxlength'));
            }

            this.element.unbind('getData.combobox');
            this.element.unbind('setData.combobox');
            this.element.unbind('remove');
            if (options.arrowVisible) {
                this.element.after(this.arrowElem);
            }
            this.element.after(inputElem);
            this.element.remove();
            this.oldElem = this.element;

            this.listElem = this.buildList().insertAfter(this.arrowElem).hide();

            // ID copied afterwards so we never have two elements with the same
            // ID in the DOM.
            maybeCopyAttr('id', inputElem);
            maybeCopyAttr('class', this.listElem);
            maybeCopyAttr('class', this.arrowElem);

            this.element = inputElem
			.keyup(function(e) {
			    if (!that.isListVisible()) {
			        that.showList(e);
			    }
			})
            .keydown(function(e) {
                if (!that.isListVisible()) {
                    that.showList(e);
                }
            })
			.change(boundCallback(this, 'fireEvent', 'select'));

            function OnBlur(e) {
                that.finishSelection(that.selectedIndex, e);
                that.hideList();
            }

            if (options.autoShow) {
                this.element
                .focus(boundCallback(this, 'showList'))
				.blur(function(e) {
				    that.finishSelection(that.selectedIndex, e);
				    that.hideList();
				});
            }

        },

        _init: function() {
            // JQuery UI 1.6rc6 compatibility
            this.init.apply(this, arguments);
        },

        cleanup: function() {
            // Cleanup and destroy are split into two separate handlers because
            // one of them (cleanup, in this case) needs to be bound to the
            // 'remove' event handler to clean up the extra elements.  The
            // destroy handler removes the custom input element added by this
            // plugin, and so we get an infinite loop if they aren't split.
            if (this.boundKeyHandler) {
                $(document).unbind('keyup', this.boundKeyHandler);
            }
            this.arrowElem.remove();
            this.listElem.remove();
        },

        /**
        * Remove all combobox functionality from this element, restoring the
        * original element.
        */
        destroy: function() {
            var newElem = this.element;
            this.element = this.oldElem.insertBefore(this.arrowElem);
            newElem.remove(); // Triggers cleanup
        },

        /**
        * Dynamically changes one of the combobox options.
        * 
        * @param {String} key Option name.
        * @param {Object} value New value.
        */
        setData: function(key, value) {
            this.options[key] = value;

            if (key == 'disabled' && this.isListVisible()) {
                this.hideList();
            }

            if (key == 'data' || key == 'listContainerTag' || key == 'listHTML') {
                var isVisible = this.isListVisible();
                this.listElem = this.buildList().replaceAll(this.listElem);
                this[isVisible ? 'showList' : 'hideList']();
            }
        },

        buildList: function() {
            var that = this;
            var options = this.options;
            var tag = options.listContainerTag;
            var elem = $('<' + tag + ' class = "ui-combobox-list">' + '</' + tag + '>');

            $.each(options.data, function(i, val) {
                var item = $(options.listHTML(val, i));
                item.appendTo(elem);
                item.click(boundCallback(that, 'finishSelection', i));
                item.mouseover(boundCallback(that, 'changeSelection', i));
                elem.maxwidth = Math.max(val.length, elem.maxwidth || 0);
            });
            return elem;
        },

        isListVisible: function() {
            return this.listElem.is(':visible');
        },

        /**
        * Programmatically shows the drop-down list.
        * 
        * @param {Event} e Original event triggering this.
        */
        showList: function(e) {
            if (this.options.disabled) {
                return;
            }

            var theElement = this.element;
            var styles = theElement.position();
            // TODO: account for borders/margins.  Hardcode as '5' for now
            //TraceWindowElement("INPUT", theElement[0]);
            var bPanel = false;
            var elementOffset = GetElementOffsetFromParentPanel(theElement[0], undefined, bPanel);
            styles.top = elementOffset.y + theElement.height() + 5;
            styles.left = elementOffset.x;
            if (elementOffset.bPanel) {
                styles.top -= 24;
                styles.left -= 10;
            }
            styles.width = Math.max((this.listElem.maxwidth * 10) || (theElement.width() + 5), theElement.width() + 5);
            styles.position = 'absolute';

            this.boundKeyHandler = boundCallback(this, 'keyHandler');
            $(document).keyup(this.boundKeyHandler);
            $('.ui-combobox-list').hide();
            this.listElem.css(styles).show();
            this.changeSelection(this.findSelection(), e);
        },

        /**
        * Programmatically hide the drop-down list.
        */
        hideList: function() {
            this.listElem.hide();
            $(document).unbind('keyup', this.boundKeyHandler);
        },

        keyHandler: function(e) {
            if (this.options.disabled) {
                return;
            }

            var optionLength = this.options.data.length;
            switch (e.which) {
                case KEY_ESC:
                    this.hideList();
                    break;
                case KEY_UP:
                    // JavaScript modulus apparently doesn't handle negatives
                    var newIndex = this.selectedIndex - 1;
                    if (newIndex < 0) {
                        newIndex = optionLength - 1;
                    }
                    this.changeSelection(newIndex, e);
                    break;
                case KEY_DOWN:
                    this.changeSelection((this.selectedIndex + 1) % optionLength, e);
                    break;
                case KEY_ENTER:
                    this.finishSelection(this.selectedIndex, e);
                    break;
                default:
                    this.fireEvent('key', e);
                    this.changeSelection(this.findSelection());
                    break;
            }
        },

        prepareCallbackObj: function(val) {
            val = val || this.element.val();
            var index = $.inArray(val, this.options.data);
            return {
                value: val,
                index: index,
                isCustom: index == -1,
                inputElement: this.element,
                listElement: this.listElement
            };
        },

        fireEvent: function(eventName, e, val) {
            this.element.triggerHandler('combobox' + eventName, [
			e,
			this.prepareCallbackObj(val)
		], this.options[eventName]);
        },

        findSelection: function() {
            var data = this.options.data;
            var typed = this.element.val().toLowerCase();

            for (var i = 0, len = data.length; i < len; ++i) {
                var index = data[i].toLowerCase().indexOf(typed);
                if (index == 0) {
                    return i;
                }
            };

            if (this.options.matchMiddle) {
                for (var i = 0, len = data.length; i < len; ++i) {
                    var index = data[i].toLowerCase().indexOf(typed);
                    if (index != -1) {
                        return i;
                    }
                };
            }

            return -1;
        },

        changeSelection: function(index, e) {
            this.selectedIndex = index;
            this.listElem.children('.selected').removeClass('selected');
            if (this.options.data[index] != "<error>") {
                this.listElem.children(':eq(' + index + ')').addClass('selected');
            }
            if (e) {
                this.fireEvent('change', e, this.options.data[index]);
            }
        },

        finishSelection: function(index, e) {
            var value = "";
            var Options = this.options;
            if (Options.data[index] == "<error>")
                return;

            if ((index == -1) || ((index == -1) && (this.listElem.customchild == undefined))) {
                value = this.element[0].value;
                var theListElem = this.listElem;
                if (theListElem.customchild > -1) {
                    theListElem.children()[theListElem.customchild].innerHTML = value;
                    this.options.data[theListElem.customchild] = value;
                    theListElem.val(value);
                }
                else {
                    Options.data.push(value);
                    this.element.val(value);
                    var elem = $(defaultListHTML(value, undefined, value));
                    elem.click(boundCallback(this, 'finishSelection', theListElem.children().length));
                    elem.mouseover(boundCallback(this, 'changeSelection', theListElem.children().length));
                    theListElem.append(elem);
                    theListElem.customchild = theListElem.children().length - 1;
                    theListElem.maxwidth = Math.max(value.length, theListElem.maxwidth || 0);
                }
            }
            else {
                value = Options.data[index];
                this.element.val(value);
            }
            this.hideList();
            this.fireEvent('select', e);
            var theFakeEdit = Options.fakeEdit;
            if (theFakeEdit.value != value) {
                theFakeEdit.value = value;
                $(Options.originElement).trigger('onchange'); // trigger onchange event of the original overriden control
            }
        }

    });

    $.extend($.ui.combobox, {
        getter: 'getData',
        version: '1.0.6',
        defaults: {
            data: [],
            width: '50px',
            fakeEdit: null,
            originElement: null,
            selectedValue: '',
            autoShow: true,
            matchMiddle: true,
            change: function(e, ui) { },
            select: function(e, ui) { },
            key: function(e, ui) { },
            arrowVisible: true,
            arrowURL: 'drop_down.png',
            arrowClickedURL: 'drop_down.png',
            arrowHTML: function() {
                return $('<img class = "ui-combobox-arrow" border = "0" src = "'
				+ this.options.arrowURL + '" width = "16" height = "16" />')
            },
            listContainerTag: 'span',
            listHTML: defaultListHTML
        }
    });

    // Hack for chainability - since the combobox modifies this.element but 'this'
    // is only the UI instance, it leaves the JQuery collection itself pointing
    // at stale, removed-from-DOM instances.  This hack invokes the UI-factory 
    // plugin method first, then maps each instance in the JQuery collection to 
    // the new element.
    var oldPlugin = $.fn.combobox;
    $.fn.combobox = function() {
        var results = oldPlugin.apply(this, arguments);
        if (!(results instanceof $)) {
            return results;
        }

        var needsHack = false;
        var newResults = $($.map(results, function(dom) {
            var instance = $.data(dom, 'combobox');
            if (instance && instance.element[0] != dom) {
                needsHack = true;
                var newDOM = instance.element[0];
                $.data(newDOM, 'combobox', instance);
                return newDOM;
            } else {
                return dom;
            }
        }));

        return !needsHack ? results : newResults
		.bind('setData.combobox', function(e, key, value) {
		    return $.data(this, 'combobox').setData(key, value);
		})
		.bind('getData.combobox', function(e, key) {
		    return $.data(this, 'combobox').getData(key);
		})
		.bind('remove', function() {
		    return $.data(this, 'combobox').cleanup();
		});
    };

    function defaultListHTML(value, i, data) {
        var cls = i % 2 ? 'odd' : 'even';
        if (value == "") {
            return '<span class = "ui-combobox-item ' + cls + ' ">&nbsp;</span>';
        }
        else if (data == "<error>") {
            return '<span class = "ui-combobox-item-unselectable ' + cls + ' ">' + value + '</span>';
        }
        else {
            return '<span class = "ui-combobox-item ' + cls + ' ">' + value + '</span>';
        }
    };

    function boundCallback(that, methodName) {
        var extraArgs = [].slice.call(arguments, 2);
        return function() {
            that[methodName].apply(that, extraArgs.concat([].slice.call(arguments)));
        };
    };

    function fillDataFromSelect(options, element) {
        var optionMap = {}, computedData = [];
        var bSelectedValueExist = false;
        element.children().each(function(i) {
            if (this.tagName.toLowerCase() == 'option') {
                var text = $(this).text(),
				val = this.getAttribute('value') || text;
                bSelectedValueExist |= (options.selectedValue == val);
                optionMap[val] = text;
                computedData.push(val);
            }
        });

        if (!bSelectedValueExist && options.selectedValue != "") {
            optionMap[options.selectedValue] = options.selectedValue;
            computedData.push(options.selectedValue);
        }

        if (!options.data.length) {
            options.data = computedData;
        }

        if (options.listHTML == defaultListHTML) {
            options.listHTML = function(data, i) {
                return defaultListHTML(optionMap[data] || data, undefined, data);
            };
        }
    };

})(jQuery);

