var HOMEPAGE = "http://localhost:8000/journal/";

var POSTCOUNT = 10;
var POSTSPERCOL = 3;
var SPANWIDTH = 12 / POSTSPERCOL;

// keycodes
var KEYSPACE = 32;
var KEYENTER = 13;

$(document).ready(function(){
    initrandompostdivs();
    mkrandomposts();

    $("a").tooltip({'placement': 'bottom'});

    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});
    $("#newpostsubmit").attr("onclick", "submitpost()");

    $(document).bind("keydown", keyboardshortcuts);

    newpostformbindenterkeypress();

    $("input, textarea").focus(function(){$(this).select()});

    $("#newpostform").on("hide", function(){
        // return focus to window, so you can ctrl + find
        $("*:focus").blur();
    });
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
            $("#newpostsubmit").click();
        }
        break;
    }
}

// todo. ctrl + n to edit nth box
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
            rp.attr("id", post.id);
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

function editpost(postid){
    shownewpostform();
    populateeditpost(postid);
}

// using new post form to edit old posts
function populateeditpost(postid){
    var post = $("#" + postid);
    // input's and textarea's must use .val() instead of .html()
    $("#editpostid").val(postid);
    $("#newposttitle").val(post.find(".posttitle").html());
    $("#newpostbody").val(post.find(".postbody").html());
    $("#newpostsubject").val(post.find(".postsubject").html());
    $("#newpostsubmit").attr("onclick", "submiteditpost()");
}

function submiteditpost(){
    var id = $("#editpostid").val();
    var title = $("#newposttitle").val();
    var body = $("#newpostbody").val();
    var subject = $("#newpostsubject").val();
    var token = getCookie('csrftoken');
    $.ajax({
        url: HOMEPAGE + "editpost",
        type: "POST",
        data: {
            id: id,
            title: title,
            body: body,
            subject: subject,
            csrfmiddlewaretoken: token,
        },
        success: function(post){ // todo
            $("#newpostform").hide();
            mkrandomposts();
        }
    });
    cancelnewpost();
    // reset new post submit function
    $("#newpostsubmit").attr("onclick", "submitpost()");
}

function shownewpostform(){
    $("#newpostform").modal();
    $("#newposttitle").focus();
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
            $("#newpostform").hide();
            mkrandomposts();
        }
    });
    cancelnewpost();
}

function cancelnewpost(){
    $("*:focus").blur();
    $("#newpostform").modal("hide");
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
