var HOMEPAGE = "http://localhost:8000/journal/";

$(document).ready(function(){
    $("#random_post").click(function(){edit_random_post(); return false;});
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#newpostform").hide();
});

function shownewpostform(){
    $("#newpostdate").html(moment().format("MMM. D, YYYY, h:mm:ss a"));
    $("#newpostform").show();
    $("#newposttitle").focus();
}

function edit_random_post(){
    $("#random_post").css({
        "display": "none",
    });
    $("#random_edit_form").css({
        "display": "block",
    });
    $("title_edit").focus();
}

function submitpost(){
    var title = $("#newposttitle").val();
    var body = $("#newpostbody").val();
    var subject = $("#newpostsubject").val();
    var token = getCookie('csrftoken');
    $.post(HOMEPAGE + "create_post", {
        title: title,
        body: body,
        subject: subject,
        csrfmiddlewaretoken: token,
    }, function(post){
        // clearnewpostform();
        // mkpost(post);
        console.log(post);
    });
}

function clearnewpostform(){

}

function mkpost(post){

}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
