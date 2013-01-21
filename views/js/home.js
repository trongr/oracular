$(document).ready(function(){
    $("#new_post_button").click(function(){create_post(); return false;});
    $("#random_post").click(function(){edit_random_post(); return false;});
});

function edit_random_post(){
    $("#random_post").css({
        "display": "none",
    });
    $("#random_edit_form").css({
        "display": "block",
    });
    $("title_edit").focus();
}

function create_post(){
    $("#new_post_form").css({
        "display": "block",
    });
    $("#new_post_form_title").focus();
}
