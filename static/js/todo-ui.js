/**
 * (C) Created by Sergey Orshanskiy on 4/14/14.
 * The frontend side of the ForeverTodo application for managing lists of todo items.
 */

// TODO: BROWSER CACHE CONTROL (index.html etc)
// TODO: WRAP INTO A FUNCTION


window._items = {
    2: { title: 'Pick up milk', text: 'Really pick up milk', priority: 0, expires: new Date(2014, 10, 5), completed: false },
    3: { title: 'Learn python', text: 'Really learn python', priority: 1, expires: null, completed: true },
    4: { title: 'Pick up kefir', text: 'Really pick up kefir', priority: 2, expires: null, completed: false },
    5: { title: 'Learn django', text: 'Really learn django', priority: 0, expires: new Date(2010, 5, 10), completed: true }
}


$(document).ready(function () {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'inline';
});

// FIXME: cache????
var api_base="/api/v1/todo/";
var user_str_prefix="/api/v1/user/";
var user_str=undefined;
function ajax_getAllItems(current_user_id) {
    user_str=user_str_prefix + current_user_id + '/';
    console.log("loading json, user_str "+user_str);
    $.ajax({
        cache: false,
        url: api_base + "?limit=999999",
        dataType: "json",
        success: function(data) {
            window._items = {}
            for (var i = 0, l = data.objects.length; i<l; i++) {
                var item = data.objects[i];
                // convert from string such as "Sun, 20 Apr 2014 01:19:24 +0000" to Date()
                if (item.expires) { // if it is null, leave it. Don't change to Dec 1969.
                    item.expires = new Date(item.expires);
                }
                window._items[item.id] = item;

                // FIXME: refactor
                //update the ui
                // IMPORTANT: update the ui only after the data has been received!
                $('#main_item_list').append(renderItemHTML(item.id, item.title, item.text, item.priority, item.completed));
                attachCallbacks(item.id);
            }
        },
        error: function(request, status, error) {
            alert("We are so sorry! Loading your items failed: " + error + ". You can try to refresh the page or come back later.");
            throw "getAllItems failed: " + error + ", " + request.status
        }
    });
}

function ajax_deleteItem_async(item_id) {
    $.ajax({
        type: "DELETE", // JQuery has this cryptic note in the documentation that
        //  Note: "Other HTTP request methods, such as PUT and DELETE, can also be used here, but they are not
        // supported by all browsers."
        //
        // I assume that, in fact, as of 2014, all major browsers do support PUT and DELETE.
        url: api_base + item_id + '/',
        success: function(data, status, xhr) {
            delete window._items[item_id]; // remove the data
            $('#todo-item-'+item_id).remove(); // remove the ui
        },
        error: function(request, status, error) {
            alert("We are so sorry! Delete unexpectedly failed: " + error);
            throw "Delete failed: " + error + ", " + request.status
        }
    });
}

function ajax_modifyItem_async(item_id, field, newValue, onsuccess, onerror) {
    $.ajax({
        type: "PUT",
        url: api_base + item_id + '/',
        data: stringifyUpdatedItem({name: field, value: newValue, pk:item_id}),
        contentType: 'application/json',
        success: function(data, status, xhr) {
            // console.log(data);
            // console.log(status);
            // console.log(xhr);
            window._items[item_id][field] = newValue;
            onsuccess();
        },
        error: function(request, status, error) {
            alert("We are so sorry! Update unexpectedly failed: " + error);
            throw "Update failed: " + error + ", " + request.status
            onerror();
        }
    })
}
/*
 returns nothing
 */
function ajax_createItem_async(item) {
    item.user = user_str;
    var str = JSON.stringify(item);
    var item_id;
    $.ajax({
        type:"POST",
        url:api_base,
        data:str,
        success: function(data, status, xhr) {
            var location = xhr.getResponseHeader("Location");
            // Location is a URL such as http://server.com/api/v1/todo/9/
            // Technically we could issue another ajax request to properly obtain the ID
            // But let's just parse the URL. (Theoretically may have issues with maintainability.)
            var s = location.split('/')
            item_id=parseInt(s[s.length - 2]);
            if (isNaN(item_id)) {
                throw "Error while parsing "+location+" to get item id";
            } else if (item_id in window._items) {
                throw "Server returned duplicate item id " + item_id + " for a new element";
            } else {
                _items[item_id] = item;
                // update the ui
                $('#main_item_list').prepend(renderItemHTML(item_id, item.title, item.text, item.priority, item.completed));
                attachCallbacks(item_id);
            }
        },
        error: function(request, status, error) {
            alert("We are so sorry! Create unexpectedly failed: " + error);
            throw "Create failed: " + error + ", " + request.status
        },
        contentType: 'application/json'
    });
}





/*
 * This function returns an X-editable style callback that is triggered when the user modifies
 * an item with id idem_id. Field shows what was modified: 'title' or 'text'.
 * The ajax call will only include the new data.
 * If the ajax call fails, the function returns an error message, so that X-editable won't update the ui.
 *
 * Binding: The function also updates the data in window._items.
 */
function getEditableCallback(item_id, field) {
    return function (response, newValue) {
        var result = ajax_modifyItem(item_id, { field: newValue });
        if (result) { // ajax success
            window._items[item_id][field] = newValue;
        } else {
            return "Error while sending data to the server";
        }
    }
}



$(function () {
    // No good reason to put it here, since we are waiting for the ajax call to load anyway
    // However, sortable can be initialized before everything is loaded...
    $("#main_item_list").sortable();
    $.fn.editable.defaults.ajaxOptions = {type: 'PUT', contentType: 'application/json'};
});


function renderPriorityButton(item_id, priority) {
    var clbl = ["label-default", "label-primary", "label-danger"][priority];
    var ctxt = ["Low priority", "Normal priority", "High priority"][priority];
    var is_enabled = !window._items[item_id].completed; // Cannot change priority for completed items

    return "<button " + (is_enabled ? "" : " disabled ") + " type=\"button\" class=\"btn " + clbl +
        "\" id=\"btn-priority-" + item_id + "\" priority=" + priority + " onclick=\"toggleItemPriority(" + item_id +
        ", true); \">" + ctxt + "</button>";
}

/*
 * User toggled the priority of an item to the next value
 */
function toggleItemPriority(item_id, is_enabled) {
    setItemPriority(item_id, (window._items[item_id].priority + 1) % 3);
}
function setItemPriority(item_id, priority) {
    ajax_modifyItem_async(item_id, 'priority', priority, function() {
        $('#btn-priority-' + item_id).replaceWith(renderPriorityButton(item_id, priority));
    }, function(){});
    /*
    var result = getEditableCallback(item_id, 'priority')(undefined, priority);
    if (result == undefined) { // success; update the ui
        // FIXME: just make sure, what will happen to the previous event handler after replaceWith?
        $('#btn-priority-' + item_id).replaceWith(renderPriorityButton(item_id, priority));
    } else { // ajax or validation failed; value not modified
        alert(result); // TODO: show gracefully
    }*/
}

/*
 * Args: params is an object containing name, value, pk.
 * Name can be e.g. 'title' or 'expires', anything that items have. Value is the new value.
 * The function returns a string (JSON) representing the modified object #pk. 
 */
function stringifyUpdatedItem(params) {
    var data = {}
    var item = window._items[params.pk];
    for (prop in item) { // copy the existing item
        data[prop] = item[prop];
    }
    data[params.name] = params.value; // modify
    // Returning a string, not an object. This is an undocumented feature of X-editable, that
    // this works when contentType='application/json'.
    return JSON.stringify(data);
}

/*
 * Attach jQuery X-editable callbacks for in-place editing of the item title and contents
 */
function attachCallbacks(item_id) {
    var element = $('#todo-item-' + item_id);
    element.find('.todo-header').editable({ // always success, url not specified, doing ajax call on our own
        url: api_base + item_id + '/',
        name: 'title',
        params: stringifyUpdatedItem,
        error: function(response, newValue) {
            return "Edit unexpectedly failed: " + response.statusText;
        }
    });
    element.find('.todo-content').editable({ // always success, url not specified, doing ajax call on our own
        url: api_base + item_id + '/',
        name: 'text',
        params: stringifyUpdatedItem,
        error: function(response, newValue) {
            return "Edit unexpectedly failed: " + response.statusText;
        }
    });


    var f = getEditableCallback(item_id, 'expires');
    var date=window._items[item_id].expires;
    var picker = element.find('.datepicker').pickadate({
        clear: 'Never expires'
    }).pickadate('picker').clear();
    if (date != undefined) { // Populate the input field with the initial date
        picker.set('select', date);
    }

    if (!window._items[item_id].completed) { // Item not done yet --> the date can be changed
        picker.on('set', function(context) {
            f(undefined, context.select); // or new Date(context.select)? unless it is undefined, of course
        });
    } else { // Item done ---> the date is fixed. Disable the picker.
        picker.stop(); // We have still created the picker to consistently populate the input field
    }

}

/*
 * User chose to mark an item as completed or revert to pending (is_completed is true or false, respectively)
 */
function markCompleted(item_id, is_completed) {
    ajax_modifyItem_async(item_id, 'completed', is_completed, function() {
        // TODO: do without replaceWith?
        var i = window._items[item_id];
        $('#todo-item-' + item_id).replaceWith(renderItemHTML(item_id, i.title, i.text, i.priority, i.completed));
        // Reattach event handlers
        attachCallbacks(item_id);
    }, function(){});
}


/*
 * Returns full html code for the div containing the item.
 *
 * This function has no side effects.
 */
function renderItemHTML(item_id, title, text, priority, is_completed) {

    return "<li data-pk=\"" + item_id + "\">" +
        (is_completed ? "<div class=\"todo-item panel panel-success\" id=\"todo-item-" + item_id + "\">" :
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
            "<button type=\"button\" class=\"btn btn-sm\"    onclick=\"markCompleted(" + item_id + ", false);\">Revert to pending</button>" :
            "<button type=\"button\" class=\"btn btn-success\" onclick=\"markCompleted(" + item_id + ", true);\">Mark as completed</button>") +
        "&nbsp;Item expires: <input type=\"text\" class=\"datepicker\" autocomplete=\"off\" " +
        (is_completed ? " disabled=true ": "") + " /><em>" +
        (is_completed ? "(not editable any more)" : "(click or tap to edit)") + "</em>" +
        "<button type=\"button\" class=\"btn btn-warning pull-right\" onclick=\"ajax_deleteItem_async(" + item_id + ");\" >Delete</button>" +
        "</div></div> +" +
        "</li>";
}

/*
 * Returns a dictionary of pairs { <item_id> : <HTML code for a rendered div> }
 *
 * This function has no side effects.
 */
function renderAllItems() {
    var result = {};
    for (var item_id in window._items) {
        i = window._items[item_id];
        console.log("renderAllItems "+item_id);
        result[item_id] = renderItemHTML(item_id, i.title, i.text, i.priority, i.completed);
    }
    return result;
}

/*
 * User requested to create a new item. Create something really standard, then let the user edit.
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
 * It should return -1, 0, or 1. The sorting is done by the associated data in window._items using the field 'field'.
 * If null_is_last is set to true, all null values will go to the end (typically null is the smallest value).
 * This is useful for e.g. expiration dates, to show first all entries with set dates in sorted order.
 */
function sortBy(field, null_is_last) {
    if (!null_is_last) {
        return function(a1, a2) {
            var value1 = window._items[a1.e.attr('data-pk')][field];
            var value2 = window._items[a2.e.attr('data-pk')][field];
            return value1==value2 ? 0 : (value1>value2 ? 1 : -1);
        }
    } else {
        return function(a1, a2) {
            var value1 = window._items[a1.e.attr('data-pk')][field];
            var value2 = window._items[a2.e.attr('data-pk')][field];
            if (!value1) { return 1;}
            if (!value2) { return -1;}
            return value1==value2 ? 0 : (value1>value2 ? 1 : -1);
        }
    }
}

function uiSortByTitle() {
      uiGetItems().tsort('.datepicker', {sortFunction: sortBy('title', false)});;
//    uiGetItems().tsort('.panel-title'); - works, but let's not use info in DOM elements for sorting
}

function uiSortByPriority() {
    uiGetItems().tsort('.datepicker', {sortFunction: sortBy('priority', false)});;
//    uiGetItems().tsort('.btn', {attr: 'priority'}); - works, but let's not use info in DOM elements for sorting
}

function uiSortByDate() {
    uiGetItems().tsort('.datepicker', {sortFunction: sortBy('expires', true)});;
}
