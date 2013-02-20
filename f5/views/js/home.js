var HOMEPAGE = "http://localhost:8000/journal/";

var POSTCOUNT = 12;
var POSTSPERCOL = 3;
var SPANWIDTH = 12 / POSTSPERCOL;

// keycodes
var KEYSPACE = 32;
var KEYENTER = 13;

$(document).ready(function(){
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});
    $(document).bind("keydown", keyboardshortcuts);
    mkrandomposts();
    newpostformbindenterkeypress();
    $("a").tooltip({'placement': 'bottom'});
    initrandompostdivs();
});

// too much dom manipulation makes it slow: generate all divs just
// once in the beginning
function initrandompostdivs(){
    var rp = $("#randomposts");
    // <= means there'll be extra divs with no posts: that's ok
    for (var i = 0; i <= POSTCOUNT / POSTSPERCOL; i++){
        var row = $("<div/>", {
            class: "row-fluid",
        }).appendTo(rp);
        for (var j = 0; j < POSTSPERCOL; j++){
            row.append(
                "<div class='span" + SPANWIDTH + "'>" +
                    "<div class='randompost'>" +
                        "<a><div class='posttitle'></div></a>" +
                        "<div class='postbody'></div>" +
                        "<div class='postsubject'></div>" +
                        "<div class='postdate'></div>" +
                    "</div>" +
                "</div>"
            );
        }
    }
}

// this is a hack to allow enter submit on form input, because for
// some reason <form/> won't let you ajax csrftoken, so had to switch
// to div, but then <input/> doesn't submit on enter keydown
function newpostformbindenterkeypress(){
    $("input").bind("keydown", inputkeydownsubmit);
}

function inputkeydownsubmit(e){
    switch (e.which || e.keyCode){
    case KEYENTER:
        if (!e.ctrlKey){
            submitpost();
        }
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
        var rps = $(".randompost");
        $.each(json.posts, function(i, post){
            var rp = rps.eq(i);
            rp.attr("onclick", "editpost(" + post.id + ")");
            rp.find(".posttitle").html(post.title);
            rp.find(".postbody").html(post.body);
            rp.find(".postsubject").html(post.subject);
            rp.find(".postdate").html(parsedatetime(post.created));
        });
    });
}

function parsedatetime(t){
    var m = "2013-02-19T04:11:51-05:00".match(/(\d+|[a-zA-Z])/g);
    return moment(t).format("H:mm ddd DD MMM YYYY"); //.calendar();
}

function editpost(){
    alert("hello");
}

// todo. do something about window losing focus on form hide
function shownewpostform(){
    // todo. clear previous note
    $("#newpostform").modal().on("hide", function(){
        // return focus to window, so you can ctrl + find
        $("*:focus").blur();
    });
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
            // todo. repopulate randomposts divs. right now you're
            // just adding more divs
            mkrandomposts();
        }
    });
    cancelnewpost();
}

function cancelnewpost(){
    $("*:focus").blur();
    $("#newpostform").modal("hide");
    // $("#newpostform").hide();
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
