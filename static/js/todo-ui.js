/**
 * (C) Created by Sergey Orshanskiy on 4/14/14.
 * The frontend side of the ForeverTodo application for managing lists of todo items.
 */

_items = {
    2: { title: 'Pick up milk', text: 'Really pick up milk', priority: 0, expires: new Date(2014, 10, 5), completed: false },
    3: { title: 'Learn python', text: 'Really learn python', priority: 1, expires: undefined, completed: true },
    4: { title: 'Pick up kefir', text: 'Really pick up kefir', priority: 2, expires: undefined, completed: false },
    5: { title: 'Learn django', text: 'Really learn django', priority: 0, expires: new Date(2010, 5, 10), completed: true }
}


$(document).ready(function () {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'inline';
});


/*
 returns true on success, false on failure
 */
function ajax_deleteItem(item_id) {
    return true;
}
/*
 item_diff only contains those fields that are modified
 returns true on success, false on failure
 */
function ajax_modifyItem(item_id, item_diff) {
    return true;
}
/*
 returns item_id received from the server on success, undefined on failure
 */
function ajax_createItem(item) {
    item_id = 8;
    return item_id;
}





/*
 * This function returns an X-editable style callback that is triggered when the user modifies
 * an item with id idem_id. Field shows what was modified: 'title' or 'text'.
 * The ajax call will only include the new data.
 * If the ajax call fails, the function returns an error message, so that X-editable won't update the ui.
 *
 * Binding: The function also updates the data in _items.
 */
function getEditableCallback(item_id, field) {
    return function (response, newValue) {
        var result = ajax_modifyItem(item_id, { field: newValue });
        if (result) { // ajax success
            _items[item_id][field] = newValue;
        } else {
            return "Error while sending data to the server";
        }
    }
}


$(function () {
    for (item_id in _items) {
        attachCallbacks(item_id);
    }
    /*
     $(".todo-header").each(function(i, obj) {
     $(this).editable({ // always success, url not specified, doing ajax call on our own
     success: getEditableCallback(this.getAttribute('data-pk'), 'title')
     });
     });
     $(".todo-content").each(function(i, obj) {
     $(this).editable({ // always success, url not specified, doing ajax call on our own
     success: getEditableCallback(this.getAttribute('data-pk'), 'text')
     });*/


    $("#main_item_list").sortable();


});


function renderPriorityButton(item_id, priority) {
    var clbl = ["label-default", "label-primary", "label-danger"][priority];
    var ctxt = ["Low priority", "Normal priority", "High priority"][priority];
    var is_enabled = !_items[item_id].completed; // Cannot change priority for completed items

    return "<button " + (is_enabled ? "" : " disabled ") + " type=\"button\" class=\"btn " + clbl +
        "\" id=\"btn-priority-" + item_id + "\" priority=" + priority + " onclick=\"toggleItemPriority(" + item_id +
        ", true); \">" + ctxt + "</button>";
}

/*
 * User toggled the priority of an item to the next value
 */
function toggleItemPriority(item_id, is_enabled) {
    setItemPriority(item_id, (_items[item_id].priority + 1) % 3);
}
function setItemPriority(item_id, priority) {

    var result = getEditableCallback(item_id, 'priority')(undefined, priority);
    if (result == undefined) { // success; update the ui
        // FIXME: just make sure, what will happen to the previous event handler after replaceWith?
        $('#btn-priority-' + item_id).replaceWith(renderPriorityButton(item_id, priority));
    } else { // ajax or validation failed; value not modified
        alert(result); // TODO: show gracefully
    }
}

/*
 * Attach jQuery X-editable callbacks for in-place editing of the item title and contents
 */
function attachCallbacks(item_id) {
    var element = $('#todo-item-' + item_id);
    element.find('.todo-header').editable({ // always success, url not specified, doing ajax call on our own
        success: getEditableCallback(item_id, 'title')
    });
    element.find('.todo-content').editable({ // always success, url not specified, doing ajax call on our own
        success: getEditableCallback(item_id, 'text')
    });

    var f = getEditableCallback(item_id, 'expires');
    var date=_items[item_id].expires;
    var picker = element.find('.datepicker').pickadate({
        clear: 'Never expires',
        onSet: function(context) {
            f(undefined, context.select); // or new Date(context.select)? unless it is undefined, of course
        }
    }).pickadate('picker').clear();
    if (date != undefined) {
        picker.set('select', date);
    }
}

/*
 * User chose to mark an item as completed or revert to pending (is_completed is true or false, respectively)
 */
function markCompleted(item_id, is_completed) {
    var result = getEditableCallback(item_id, 'completed')(undefined, is_completed);
    if (result == undefined) { // success: update the ui
        // TODO: do without replaceWith?
        var i = _items[item_id];
        $('#todo-item-' + item_id).replaceWith(renderItemHTML(item_id, i.title, i.text, i.priority, i.completed));
        // Reattach jQuery (X-editable) handlers
        attachCallbacks(item_id);
    } else { // ajax or validation failed; value not modified
        alert(result); // TODO: show gracefully
    }
}

function deleteItem(item_id) {
    var result = ajax_deleteItem(item_id);
    if (result) { // success; update the ui
        delete _items[item_id]; // remove the data
        $('#todo-item-'+item_id).remove(); // remove the ui
    } else {
        alert("Server error while trying to delete the item"); // TODO: prettify
    }
}

/*
 * Returns full html code for the div containing the item.
 *
 * This function has no side effects.
 */
function renderItemHTML(item_id, title, text, priority, is_completed) {

    return (is_completed ? "<div class=\"todo-item panel panel-success\" id=\"todo-item-" + item_id + "\">" :
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
        "&nbsp;Item expires: <input type=\"text\" class=\"datepicker\" autocomplete=\"off\" /><em>(click or tap to edit)</em>" +
        "<button type=\"button\" class=\"btn btn-warning pull-right\" onclick=\"deleteItem(" + item_id + ");\" >Delete</button>" +
        "</div></div>";
}

/*
 * Returns a dictionary of pairs { <item_id> : <HTML code for a rendered div> }
 *
 * This function has no side effects.
 */
function renderAllItems() {
    var result = {};
    for (var item_id in _items) {
        i = _items[item_id];
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
        expires: undefined,
        completed: false
    }
    item_id = ajax_createItem(item);
    if (item_id != undefined) {
        if (item_id in _items) {
            alert("Assertion failed! Server returned existing id: " + item_id);
            return;
        }
        // update the model
        window._items[item_id] = item;

        // display the item
        $('#main_item_list').prepend("<li>" + renderItemHTML(item_id, item.title, item.text, item.priority, item.completed) + "</li>");
        attachCallbacks(item_id);

    } else {
        alert("Server error while creating an item."); // TODO: prettify
    }

}

/*
 * Sort todo items by various attributes using the Tinysort jQuery plugin.
 * We are really just permuting elements in the DOM; all bindings remain in place.
 */

function uiSortByTitle() {
    $('li').tsort('.panel-title');
}

function uiSortByPriority() {
    $('li').tsort('.btn', {attr: 'priority'});
}

function uiSortByDate() {
    $('li').tsort('.datepicker', {sortFunction: function(a, b) { // a.e, b.e are jQuery objects to be compared
        return a.e.find('.datepicker').pickadate('picker').get() >
            b.e.find('.datepicker').pickadate('picker').get();
    }});
}