var HOMEPAGE = "http://localhost:8000/journal/";

var POSTCOUNT = 6;

// keycodes
var KEYSPACE = 32;
var KEYENTER = 13;

$(document).ready(function(){
    // $("#newpostform").hide(); // don't do this: you can see it a split second before it hides
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});
    $(document).bind("keydown", keyboardshortcuts);
    mkrandomposts();
    newpostformbindenterkeypress();
    $("a").tooltip({'placement': 'bottom'});
});

// this is a hack to allow enter submit on form input, because for
// some reason <form/> won't let you ajax csrftoken, so had to switch
// to div, but then <input/> doesn't submit on enter keydown
function newpostformbindenterkeypress(){
    $("input").bind("keydown", inputkeydownsubmit);
}

function inputkeydownsubmit(e){
    switch (e.which || e.keyCode){
    case KEYENTER:
        submitpost();
        break;
    }
}

function keyboardshortcuts(e){
    switch (e.which || e.keyCode){
    case KEYSPACE:
        if (e.ctrlKey){
            mkrandomposts();
        }
        break;
    case KEYENTER:
        if (e.ctrlKey){
            shownewpostform();
        }
        break;
    }
}

function mkrandomposts(){
    $.getJSON(HOMEPAGE + "randomposts", {
        postcount: POSTCOUNT
    }, function(json){
        var randomposts = $("#randomposts");
        // todo. init empty randompost divs and remove else
        if (randomposts.children().length > 0){ // replace html's instead of creating
            $.each(json.posts, function(i, post){
                // nth-child is 1-indexed
                $("#randomposts .randompost:nth-child(" + (i + 1) + ")").html(post.title + " " + post.body + " " + post.subject + " " + post.updated);
            });
        } else {
            $.each(json.posts, function(i, post){
                randomposts.append(
                    $("<div/>", {
                        id: post.id,
                        class: "randompost",
                        html: post.title + " " + post.body + " " + post.subject + " " + post.updated,
                    }).click(function(){editpost(); return false;})
                );
            });
        }
    });
}

function editpost(){
    alert("hello");
}

function shownewpostform(){
    // $("#newpostdate").html(moment().format("MMM. D, YYYY, h:mm:ss a"));
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
    $.ajax({
        url: HOMEPAGE + "createpost",
        type: "POST",
        data: {
            title: title,
            body: body,
            subject: subject,
            csrfmiddlewaretoken: token,
        },
        success: function(post){
            clearnewpostform();
            // todo. repopulate randomposts divs. right now you're just adding more divs
            mkrandomposts();
        }
    });
}

function cancelnewpost(){
    $("#newpostform").hide();
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
