/**
 * (C) Created by Sergey Orshanskiy on 4/14/14.
 * The frontend side of the ForeverTodo application for managing lists of todo items.
 */


_items = {
    2: { title: 'Pick up milk', text: 'Really pick up milk', priority: 0, completed: false },
    3: { title: 'Learn python', text: 'Really learn python', priority: 1, completed: true },
    4: { title: 'Pick up kefir', text: 'Really pick up kefir', priority: 2, completed: false },
    5: { title: 'Learn django', text: 'Really learn django', priority: 0, completed: true }
}

/*
 returns true on success, false on failure
 */
function ajax_deleteItem(item_id) {
    return false;
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
    return 8;
}


$(document).ready(function () {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'inline';


});


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


    $("#sortable").sortable();


});


function renderPriorityButton(item_id, priority) {
    var clbl = ["label-default", "label-primary", "label-danger"][priority];
    var ctxt = ["Low priority", "Normal priority", "High priority"][priority];
    var is_enabled = !_items[item_id].completed; // Cannot change priority for completed items

    return "<button " + (is_enabled ? "" : " disabled ") + " type=\"button\" class=\"btn " + clbl +
        "\" id=\"btn-priority-" + item_id + "\" priority=" + priority + " onclick=\"toggleItemPriority(" + item_id +
        ", true); \">" + ctxt + "</button>";
}

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


function attachCallbacks(item_id) {
    var element = $('#todo-item-' + item_id);
    element.find('.todo-header').editable({ // always success, url not specified, doing ajax call on our own
        success: getEditableCallback(item_id, 'title')
    });
    element.find('.todo-content').editable({ // always success, url not specified, doing ajax call on our own
        success: getEditableCallback(item_id, 'text')
    });
}

function markCompleted(item_id, is_completed) {
    i = _items[item_id];
    if (i.completed == is_completed) {
        return;
    }
    i.completed = is_completed;

    // TODO: do without replaceWith?
    $('#todo-item-' + item_id).replaceWith(renderItemHTML(item_id, i.title, i.text, i.priority, i.completed));

    // Reattach jQuery (X-editable) handlers
    attachCallbacks(item_id);

}


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
        "<div class=\"panel-footer\">" +
        (is_completed ?
            "<button type=\"button\" class=\"btn btn-sm\"    onclick=\"markCompleted(" + item_id + ", false);\">Revert to pending</button>" :
            "<button type=\"button\" class=\"btn btn-success\" onclick=\"markCompleted(" + item_id + ", true);\">Mark as completed</button>") +
        "<button type=\"button\" class=\"btn btn-warning pull-right\" >Delete</button>" +
        "</div></div>";
}

/*
 returns a dictionary of pairs { <item_id> : <HTML code for a rendered div> }
 */
function renderAllItems() {
    var result = {};
    for (var item_id in _items) {
        i = _items[item_id];
        result[item_id] = renderItemHTML(item_id, i.title, i.text, i.priority, i.completed);
    }
    return result;
}