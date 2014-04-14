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


        $(document).ready(function() {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'inline';



});



function getEditableCallback(item_id, field) {
    return function(response, newValue) {
        var result = ajax_modifyItem(item_id, { field: newValue } );
        if (result) { // ajax success
            _items[item_id][field] = newValue;
         } else {
            return "Error while sending data to the server";
        }
    }
}

    $(function() {
    $(".todo-header").each(function(i, obj) {
        $(this).editable({
            success: getEditableCallback(this.getAttribute('data-pk'), 'title')
        });
    });
    $(".todo-content").each(function(i, obj) {
        $(this).editable({
            success: getEditableCallback(this.getAttribute('data-pk'), 'text')
        });
    });



$( "#acscordion" ).accordion({  disabled: true, header: "h3" });
$( "#sortable").sortable();


});


    function renderPriorityButton(item_id, priority) {
        var clbl=["label-default", "label-primary", "label-danger"][priority];
        var ctxt=["Low priority", "Normal priority", "High priority"][priority];
        var is_enabled = ! _items[item_id].completed; // Cannot change priority for completed items

        return "<button " + (is_enabled ? "":" disabled ") + " type=\"button\" class=\"btn " + clbl +
                "\" id=\"btn-priority-" + item_id + "\" priority="+priority+" onclick=\"toggleItemPriority(" + item_id +
                ", true); \">" + ctxt + "</button>";
    }

    function toggleItemPriority(item_id, is_enabled) {
          // FIXME: just make sure, what will happen to the previous event handler after replaceWith?
            if (priorities[item_id] == undefined) {
                priorities[item_id] = 0;
            }
            priorities[item_id] = (priorities[item_id] + 1) % 3;
            setItemPriority(item_id, is_enabled);
    }
    function setItemPriority(item_id, is_enabled) {
            // FIXME: just make sure, what will happen to the previous event handler after replaceWith?
            if (priorities[item_id] == undefined) {
                priorities[item_id] = 0;
            }

            $('#btn-priority-'+item_id).replaceWith(renderPriorityButton(item_id, priorities[item_id]));

   }


    function markCompleted(item_id, is_completed) {
        i = _items[item_id];
        if (i.completed == is_completed) {
            return;
        }
        i.completed = is_completed;

        $('#todo-item-'+item_id).replaceWith(renderItemHTML(item_id, i.title, i.text, i.priority, i.completed));
        $(".todo-header").editable();
        $(".todo-content").editable();
    }



   function renderItemHTML(item_id, title, text, priority, is_completed) {

       return (is_completed ? "<div class=\"todo-item panel panel-success\" id=\"todo-item-"+item_id+"\">":
                "<div class=\"todo-item panel panel-default\"               id=\"todo-item-"+item_id+"\">") +
            "<div class=\"panel-heading\">"+
               (is_completed ?
                "<span class=\"label label-success\">Completed</span>" :
               "<span class=\"label label-default\">Pending</span>") +
                  renderPriorityButton(item_id, priority) +
"<u " + (is_completed ? "" : "class=\"todo-header\"") +  "data-type=\"text\" data-pk=\""+item_id+"\">"+
                "<b class=\"panel-title\" >" + title + "</b></u>" +
               (is_completed ?
                 "<em>(not editable any more)</em>" :
                 "<em>(click or tap to edit)</em>") +
            "</div>"+
            "<div class=\"panel-body " + (is_completed ? "" : " todo-content ")+
               "\" data-type=\"textarea\" data-pk=\""+item_id+"\">" + text + "</div>"+
            "<div class=\"panel-footer\">"+
               (is_completed ?
                  "<button type=\"button\" class=\"btn btn-sm\"    onclick=\"markCompleted("+item_id+", false);\">Revert to pending</button>" :
                "<button type=\"button\" class=\"btn btn-success\" onclick=\"markCompleted("+item_id+", true);\">Mark as completed</button>") +
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