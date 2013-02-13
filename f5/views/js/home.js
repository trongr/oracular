var HOMEPAGE = "http://localhost:8000/journal/";

$(document).ready(function(){
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#newpostform").hide();
    mkrandomposts();
});

function mkrandomposts(){
    $.getJSON(HOMEPAGE + "randomposts", function(json){
        var randomposts = $("#randomposts");
        $.each(json.posts, function(i, post){
            randomposts.append(
                $("<div/>", {
                    id: post.id,
                    class: "randompost",
                    html: post.title + " " + post.body + " " + post.subject + " " + post.updated,
                }).click(function(){editpost(); return false;})
            );
        });
    });
}

function editpost(){
    alert("hello");
}

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
    $.post(HOMEPAGE + "createpost", {
        title: title,
        body: body,
        subject: subject,
        csrfmiddlewaretoken: token,
    }, function(post){
        clearnewpostform();

        // todo. repopulate randomposts divs. right now you're just adding more divs
        mkrandomposts();
    });
}

// todo
function clearnewpostform(){
    $("#newpostform").hide();
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
