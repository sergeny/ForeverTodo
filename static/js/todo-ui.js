/**
 * (C) Created by Sergey Orshanskiy on 4/14/14.
 * The frontend side of the ForeverTodo application for managing lists of todo items.
 */




// Check if jQuery is loaded
if (typeof $ == "undefined") {
    throw "jQuery is not loaded";
}

FOREVER_TODO_JS = function ($, NS) {

    // APPLICATION DATA
    //
    // Stores todo items indexed by integer keys (ids).
    var _items = {};

    $(function () {
        // We need to set default type to PUT so that the X-editable plugin will do a PUT request
        // when the user does in-place editing, instead of POST,
        // which is not RESTful for modifying a particular resource (and the API requires PUT anyway).
        $.fn.editable.defaults.ajaxOptions = {type: 'PUT', contentType: 'application/json'};

        // Configure the jQuery X-editable pugin: toggle `popup` / `inline` mode
        $.fn.editable.defaults.mode = 'inline';
    });


    var api_base = "/api/v1/todo/";
    var user_str_prefix = "/api/v1/user/";
    var user_str = undefined;

    /*
     * This function should be called once in the beginning. It will retrieve all the items belonging
     * to the given user via an API ajax call. (It would be faster to embed the current set of items into
     * HTML through templating and save some loading time; if you implement this, just pass the resulting
     * JS object to this function).
     *
     * The function will put the data in _items, create the UI, link it to the DOM so that it appears on the page,
     * and attach all event callbacks.
     *
     * It is asynchronous (control passes to on success, when the data is received from the server).
     */
    function init(current_user_id) {
        user_str = user_str_prefix + current_user_id + '/';
        $.ajax({
            cache: false,
            url: api_base + "?limit=999999", // Forget pagination for now.
            dataType: "json",
            success: function (data) {
                var frag = document.createDocumentFragment(); // For performance: construct, then attach to DOM.
                _items = {}
                for (var i = 0, l = data.objects.length; i < l; i++) {
                    var item = data.objects[i];
                    // convert from string such as "Sun, 20 Apr 2014 01:19:24 +0000" to Date()
                    if (item.expires) { // if it is null, leave it. Don't change to Dec 1969.

                        // Warning: the Tastypie API has issues with localization. If it is enabled,
                        // we might get a date in another language, which, of course, will fail.
                        item.expires = new Date(item.expires);
                    }
                    _items[item.id] = item;


                    var li = document.createElement('li');
                    li.setAttribute('data-pk', item.id);
                    li.innerHTML = renderItemHTML(item.id, item.title, item.text, item.priority, item.completed);
                    frag.appendChild(li);
                }

                document.getElementById('main_item_list').appendChild(frag);
                // First attach, then sort. It's just  easier to implement.

                uiSortByTitle();
                uiSortByDate();


                // This can get pretty slow with many items, mostly because of the Pickadate.js widget.
                // Fortunately, by this point we have nothing else to do,
                // and the user can probably live for half a second without some callbacks.
                for (var i = 0, l = data.objects.length; i < l; i++) {
                    attachCallbacks(data.objects[i].id);
                }

            },
            error: function (request, status, error) {
                alert("We are so sorry! Loading your items failed: " + error + ". You can try to refresh the page or come back later.");
                throw "getAllItems failed: " + error + ", " + request.status
            }
        });
    }

    /*
     * Asynchronously delete the item with the given ID, presumably belonging to the current user.
     * Done via an AJAX API call, using session authorization into the API.
     */
    function ajax_deleteItem_async(item_id) {
        $.ajax({
            type: "DELETE", // JQuery has this cryptic note in the documentation that
            //  Note: "Other HTTP request methods, such as PUT and DELETE, can also be used here, but they are not
            // supported by all browsers."
            //
            // I assume that, in fact, as of 2014, all major browsers do support PUT and DELETE.
            url: api_base + item_id + '/',
            success: function (data, status, xhr) {
                delete _items[item_id]; // remove the data
                var elt = $('#todo-item-' + item_id);
                // In case the user is very fast (or is using scripts),
                // quickly unbind & disable everything before the fadeout.
                elt.find('*').unbind().prop("disabled", true);
                elt.fadeOut("slow", function () {
                    elt.remove(); // now remove from the DOM
                });
            },
            error: function (request, status, error) {
                alert("We are so sorry! Delete unexpectedly failed: " + error);
                throw "Delete failed: " + error + ", " + request.status
            }
        });
    }

    /*
     * Asynchronously modify the item with the given ID, presumably belonging to the current user.
     * Done via an AJAX API call, using session authorization into the API.
     *
     * On success update the data in _items. No explicit UI updates, but it can call callbacks
     * onsuccess and onerror passed for this purpose.
     *
     * updateValue and sendValue are usually the same, except for dates. Then we send a string,
     * but we keep a Date() object for updating. Auto-converting does not work because of
     * date format and timezone issues.
     */

    function ajax_modifyItem_async(item_id, field, sendValue, updateValue, onsuccess, onerror) {
        $.ajax({
            type: "PUT",
            url: api_base + item_id + '/',
            data: stringifyUpdatedItem({name: field, value: sendValue, pk: item_id}),
            contentType: 'application/json',
            success: function (data, status, xhr) {
                // console.log(data);
                // console.log(status);
                // console.log(xhr);
                _items[item_id][field] = updateValue;
                onsuccess();
            },
            error: function (request, status, error) {
                alert("We are so sorry! Update unexpectedly failed: " + error);
                onerror();
                throw "Update failed: " + error + ", " + request.status
            }
        })
    }

   /*
     * Asynchronously create a new item belonging to the current server.
     * Done via an AJAX API call, using session authorization into the API.
     *
     * The server will respond with a Location uri. This uri is not followed; instead, the ID of the new
     * item is extracted from this uri. (Basically, it is https:/.../.../<id>/)
     *
     * On success add the new element to _items, create the UI element and attach all callbacks.
     */
    function ajax_createItem_async(item) {
        item.user = user_str;
        var str = JSON.stringify(item);
        var item_id;
        $.ajax({
            type: "POST",
            url: api_base,
            data: str,
            success: function (data, status, xhr) {
                var location = xhr.getResponseHeader("Location");
                // Location is a URL such as http://server.com/api/v1/todo/9/
                // Technically we could issue another ajax request to properly obtain the ID
                // But let's just parse the URL. (Theoretically may have issues with maintainability.)
                var s = location.split('/')
                item_id = parseInt(s[s.length - 2]);
                if (isNaN(item_id)) {
                    throw "Error while parsing " + location + " to get item id";
                } else if (item_id in _items) {
                    throw "Server returned duplicate item id " + item_id + " for a new element";
                } else {
                    _items[item_id] = item;
                    // update the ui
                    var li = document.createElement('li');
                    li.setAttribute('data-pk', item_id);
                    li.innerHTML = renderItemHTML(item_id, item.title, item.text, item.priority, item.completed);
                    li.style.display = "none";
                    var ul = document.getElementById("main_item_list");
                    ul.insertBefore(li, ul.firstChild);
                    $(li).fadeIn("slow");
                    attachCallbacks(item_id);
                }
            },
            error: function (request, status, error) {
                alert("We are so sorry! Create unexpectedly failed: " + error);
                throw "Create failed: " + error + ", " + request.status
            },
            contentType: 'application/json'
        });
    }





    /*
     * This function creates the HTML for the button to toggle item priority.
     *
     * Important: the button is recreated every time, and the callbacks are reattached.
     * This is done for the sake of readability and after confirming that there is no performance penalty.
     * (It is easier to understand HTML-like code below than lots of statements manipulating the DOM.)
     */

    function renderPriorityButton(item_id, priority) {
        var clbl = ["label-default", "label-primary", "label-danger"][priority];
        var ctxt = ["Low priority", "Normal priority", "High priority"][priority];
        var is_enabled = !_items[item_id].completed; // Cannot change priority for completed items

        return "<button " + (is_enabled ? "" : " disabled ") + " type=\"button\" class=\"btn " + clbl +
            "\" id=\"btn-priority-" + item_id + "\" priority=" + priority + " onclick=\"" + NS + ".toggleItemPriority(" + item_id +
            ", true); \">" + ctxt + "</button>";
    }

    /*
     * onClick event handler for changing the item priority.
     */
    function toggleItemPriority(item_id, is_enabled) {
        setItemPriority(item_id, (_items[item_id].priority + 1) % 3);
    }

    function setItemPriority(item_id, priority) {
        ajax_modifyItem_async(item_id, 'priority', priority, priority, function () { // update the data, and...
            $('#btn-priority-' + item_id).replaceWith(renderPriorityButton(item_id, priority)); // ...update the ui
        }, function () {
        });
    }

    /*
     * Helper function.
     *
     * Args: params is an object containing name, value, pk.
     * Name can be e.g. 'title' or 'expires', anything that items have. Value is the new value.
     * The function returns a string (JSON) representing the modified object #pk.
     */
    function stringifyUpdatedItem(params) {
        var data = {}
        var item = _items[params.pk];
        for (prop in item) { // copy the existing item
            data[prop] = item[prop];
        }
        data[params.name] = params.value; // modify
        // Returning a string, not an object. This is an undocumented feature of X-editable, that
        // this works when contentType='application/json'.
        return JSON.stringify(data);
    }

    /*
     * This function attaches callbacks for jQuery plugins X-editable and Datepicker.js for the
     * item #item_id. It is called often, as when there is a major change to an item (e.g. marked as completed),
     * it is recreated from scratch (HTML) instead of modifying lots of attributes, and then we need
     * to bind the handlers again.
     *
     * It is fairly slow.
     */
    function attachCallbacks(item_id) {
        var element = $('#todo-item-' + item_id);
        element.find('.todo-header').editable({ // always success, url not specified, doing ajax call on our own
            url: api_base + item_id + '/',
            name: 'title',
            params: stringifyUpdatedItem,
            success: function (response, newValue) {
                _items[item_id]['title'] = newValue;
            },
            error: function (response, newValue) {
                return "Edit unexpectedly failed: " + response.statusText;
            }
        });
        element.find('.todo-content').editable({ // always success, url not specified, doing ajax call on our own
            url: api_base + item_id + '/',
            name: 'text',
            params: stringifyUpdatedItem,
            success: function (response, newValue) {
                _items[item_id]['text'] = newValue;
            },
            error: function (response, newValue) {
                return "Edit unexpectedly failed: " + response.statusText;
            }
        });


        var date = _items[item_id].expires;
        var picker = element.find('.datepicker').pickadate({
            clear: 'Never expires'
        }).pickadate('picker').clear();
        if (date != undefined) { // Populate the input field with the initial date
            //console.log("Initializing the picker with date " + date + " (item_id=" + item_id + ")");
            picker.set('select', date);
        }

        if (!_items[item_id].completed) { // Item not done yet --> the date can be changed

            function onPickerSet(context) {
                // Important to use UTC String. Tastypie does not properly parse the typical JS date-time format.
                var newdatestr = (context.select != undefined) ? new Date(context.select).toUTCString() : null;
                var newdate = (context.select != undefined) ? new Date(context.select) : null;
                console.log("Modifying date, new: " + newdatestr + ", item_id=" + item_id);
                ajax_modifyItem_async(item_id, 'expires', newdatestr, newdate, function () {
                    },
                    function () {
                        // Revert the ui on failure
                        var prevdate = _items[item_id].expires;
                        if (prevdate) {
                            picker.set('select', prevdate, { muted: true});
                        } else {
                            // Terrible, ugly solution
                            // Because Pickadate.js does not have picker.clear({muted:true})
                            // So we cannot clear it without triggering the callback (clear works via set)
                            // picker.set('select', 'clear', {muted:true}) does not work either.
                            picker.off('set');
                            picker.clear();
                            picker.on('set', onPickerSet);
                        }
                    });
                //f(undefined, context.select); // or new Date(context.select)? unless it is undefined, of course
            }

            picker.on('set', onPickerSet);
        } else { // Item done ---> the date is fixed. Disable the picker.
            picker.stop(); // We have still created the picker to consistently populate the input field
        }

    }

    /*
     * onClick event handler for marking an item as completed or reverting to pending.
     */
    function markCompleted(item_id, is_completed) {
        ajax_modifyItem_async(item_id, 'completed', is_completed, is_completed, function () {
            // TODO: do without replaceWith?
            var i = _items[item_id];
            $('#todo-item-' + item_id).replaceWith(renderItemHTML(item_id, i.title, i.text, i.priority, i.completed));
            // Reattach event handlers
            attachCallbacks(item_id);
        }, function () {
        });
    }


    /*
     * Returns full html code for the div containing the item.
     *
     * This function has no side effects.
     */
    function renderItemHTML(item_id, title, text, priority, is_completed) {

        return  (is_completed ? "<div class=\"todo-item panel panel-success\" id=\"todo-item-" + item_id + "\">" :
            "<div class=\"todo-item panel panel-default\"               id=\"todo-item-" + item_id + "\">") +
            "<div class=\"panel-heading\">" +
            (is_completed ?
                "<span class=\"label label-success\">Completed</span>" :
                "<span class=\"label label-default\">Pending</span>") +
            renderPriorityButton(item_id, priority) +
            "<u " + (is_completed ? "" : "class=\"todo-header\"") + "data-type=\"text\" data-pk=\"" + item_id + "\">" +
            "<b class=\"panel-title\" >" + title + "</b></u>" +
            (is_completed ?
                "<em>(not editable any more)</em>" :
                "<em>(click or tap to edit)</em>") +
            "</div>" +
            "<div class=\"panel-body " + (is_completed ? "" : " todo-content ") +
            "\" data-type=\"textarea\" data-pk=\"" + item_id + "\">" + text + "</div>" +
            "<div class=\"panel-footer\" style=\"position: relative\">" +
            (is_completed ?
                "<button type=\"button\" class=\"btn btn-sm\"    onclick=\"" + NS + ".markCompleted(" + item_id + ", false);\">Revert to pending</button>" :
                "<button type=\"button\" class=\"btn btn-success\" onclick=\"" + NS + ".markCompleted(" + item_id + ", true);\">Mark as completed</button>") +
            "&nbsp;Item expires: <input type=\"text\" class=\"datepicker\" autocomplete=\"off\" " +
            (is_completed ? " disabled=true " : "") + " /><em>" +
            (is_completed ? "(not editable any more)" : "(click or tap to edit)") + "</em>" +
            "<button type=\"button\" class=\"btn btn-warning pull-right\" onclick=\"" + NS + ".ajax_deleteItem_async(" + item_id + ");\" >Delete</button>" +
            "</div></div>";
    }


    /*
     * onClick event handler to create a new item.
     */
    function onCreateNewItem() {
        var item = {
            title: 'New item: Enter the title.',
            text: 'New item: Enter the description of the item.',
            priority: 0,
            expires: null,
            completed: false
        }
        ajax_createItem_async(item);
    }

    /*
     * Sort todo items by various attributes using the Tinysort jQuery plugin.
     * We are really just permuting elements in the DOM; all bindings remain in place.
     */

    /*
     * This is a helper function. Returns a jQuery list of all elements containing user's items.
     */
    function uiGetItems() {
        return $('#main_item_list').find('li');
    }

    /*
     * This is a helper function.
     * It creates a comparator function to be used by the TinySort plugin (http://tinysort.sjeiti.com/).
     * The function should accept two arguments a1 and a2 such that a1.e and a2.e are the jQuery objects to be sorted.
     * It should return -1, 0, or 1. The sorting is done by the associated data in _items using the field 'field'.
     * If null_is_last is set to true, all null values will go to the end (typically null is the smallest value).
     * This is useful for e.g. expiration dates, to show first all entries with set dates in sorted order.
     */
    function sortBy(field, null_is_last) {
        if (!null_is_last) {
            return function (a1, a2) {
                var value1 = _items[a1.e.attr('data-pk')][field];
                var value2 = _items[a2.e.attr('data-pk')][field];
                return value1 == value2 ? 0 : (value1 > value2 ? 1 : -1);
            }
        } else {
            return function (a1, a2) {
                var value1 = _items[a1.e.attr('data-pk')][field];
                var value2 = _items[a2.e.attr('data-pk')][field];
                if (!value1) {
                    return (!value2) ? 0 : 1;
                }
                if (!value2) {
                    return (!value1) ? 0 : -1;
                }
                return value1 == value2 ? 0 : (value1 > value2 ? 1 : -1);
            }
        }
    }


    function uiSortByTitle() {
        uiGetItems().tsort('.datepicker', {sortFunction: sortBy('title', false)});
        ;
//    uiGetItems().tsort('.panel-title'); - works, but let's not use info in DOM elements for sorting
    }

    function uiSortByPriority() {
        uiGetItems().tsort('.datepicker', {sortFunction: sortBy('priority', false)});
        ;
//    uiGetItems().tsort('.btn', {attr: 'priority'}); - works, but let's not use info in DOM elements for sorting
    }

    function uiSortByDate() {
        uiGetItems().tsort('.datepicker', {sortFunction: sortBy('expires', true)});
        ;
    }


    return {
        init: init,
        onCreateNewItem: onCreateNewItem,
        markCompleted: markCompleted,
        ajax_deleteItem_async: ajax_deleteItem_async,
        toggleItemPriority: toggleItemPriority,
        uiSortByTitle: uiSortByTitle,
        uiSortByPriority: uiSortByPriority,
        uiSortByDate: uiSortByDate
    };
}($, "FOREVER_TODO_JS");