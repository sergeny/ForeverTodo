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
    returns true on success, false on failure
 */
function ajax_modifyItem(item_id, item) {
    return false;
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

    $(function() {
$(".todo-header").editable();
$(".todo-content").editable();
$( "#acscordion" ).accordion({  disabled: true, header: "h3" });
$( "#sortable").sortable();
        $('li').tsort();

});


    priorities=[];
    completed=[];

    function renderPriorityButton(item_id, priority, is_enabled) {
        var clbl=["label-default", "label-primary", "label-danger"][priority];
        var ctxt=["Low priority", "Normal priority", "High priority"][priority];
        return "<button " + (is_enabled ? "":" disabled ") + " type=\"button\" class=\"btn " + clbl +
                "\" id=\"btn-priority-" + item_id + "\" onclick=\"toggleItemPriority(" + item_id +
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

            $('#btn-priority-'+item_id).replaceWith(renderPriorityButton(item_id, priorities[item_id], is_enabled));

   }


    function markCompleted(item_id, is_completed) {
        completed[item_id]=is_completed;

        $('#todo-item-'+item_id).replaceWith(todoItemHTML(item_id));

        $(".todo-header").editable();
$(".todo-content").editable();
    }



   function renderItemHTML(item_id, title, text, priority, is_completed) {

       return (is_completed ? "<div class=\"panel panel-success\" id=\"todo-item-"+item_id+"\">":
                "<div class=\"panel panel-default\"               id=\"todo-item-"+item_id+"\">") +
            "<div class=\"panel-heading\">"+
               (is_completed ?
                "<span class=\"label label-success\">Completed</span>" :
               "<span class=\"label label-default\">Pending</span>") +
                  renderPriorityButton(item_id, priority, !is_completed) +
"<u " + (is_completed ? "" : "class=\"todo-header\"") +  "data-type=\"text\" data-pk=\""+item_id+"\">"+
                "<b class=\"panel-title\" >" + title + "</b></u>" +
               (is_completed ?
                 "<em>(not editable any more)</em>" :
                 "<em>(click or tap to edit)</em>") +
            "</div>"+
            "<div class=\"panel-body " + (is_completed ? "" : " todo-content ")+
               "\" data-type=\"textarea\">" + text + "</div>"+
            "<div class=\"panel-footer\">"+
               (is_completed ?
                  "<button type=\"button\" class=\"btn btn-sm\"    onclick=\"markCompleted("+item_id+", false);\">Revert to pending</button>" :
                "<button type=\"button\" class=\"btn btn-success\" onclick=\"markCompleted("+item_id+", true);\">Mark as completed</button>") +
     "<button type=\"button\" class=\"btn btn-warning pull-right\" >Delete</button>" +
        "</div></div>";
    }

    function todoItemHTML(item_id) {
       is_completed = completed[item_id];
       if (is_completed==undefined) { is_completed = false; } // FIxME


       return (is_completed ? "<div class=\"panel panel-success\" id=\"todo-item-"+item_id+"\">":
                "<div class=\"panel panel-default\"               id=\"todo-item-"+item_id+"\">") +
            "<div class=\"panel-heading\">"+
               (is_completed ?
                "<span class=\"label label-success\">Completed</span>" :
               "<span class=\"label label-default\">Pending</span>") +
                  renderPriorityButton(item_id, 0, !is_completed) +
"<u " + (is_completed ? "" : "class=\"todo-header\"") +  "data-type=\"text\" data-pk=\""+item_id+"\">"+
                "<b class=\"panel-title\" >Pick up milk</b></u>" +
               (is_completed ?
                 "<em>(not editable any more)</em>" :
                 "<em>(click or tap to edit)</em>") +
            "</div>"+
            "<div class=\"panel-body " + (is_completed ? "" : " todo-content ")+
               "\" data-type=\"textarea\">It is reeally important to pick up milk"+
            "Really really super</div>"+
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