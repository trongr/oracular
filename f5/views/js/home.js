var HOMEPAGE = "http://localhost:8000/journal/";

var POSTCOUNT = 11;
var POSTSPERCOL = 3;
var SPANWIDTH = 12 / POSTSPERCOL;

// keycodes
var KEYSPACE = 32;
var KEYENTER = 13;

$(document).ready(function(){
    loginout();
    initrandompostdivs();
    mkrandomposts();

    $("a").tooltip({'placement': 'bottom'});

    $("#loginbutton").click(function(){loginbutton(); return false;});
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});
    $("#logout").click(function(){logout(); return false;});
    $("#newpostsubmit").attr("onclick", "submitpost()");

    $(document).bind("keydown", keyboardshortcuts);

    newpostformbindenterkeypress();

    $("input, textarea").focus(function(){$(this).select()});

    // return focus to window after pressing esc on new post form modal
    $("#newpostform").on("hide", function(){$("*:focus").blur()});
});

function logout(){
    $.ajax({
        url: HOMEPAGE + "logout",
        type: "GET",
        success: function(json){
            showhideloginbar(json.isloggedin);
        }
    });
}

function loginout(){
    $.ajax({
        url: HOMEPAGE + "isloggedin",
        type: "GET",
        success: function(json){
            showhideloginbar(json.isloggedin);
        }
    });
}

// hack fix for firefox placeholder cursor invisible when input empty
function removeplaceholder(id){
    if (id == "username"){
        $("#username").removeAttr("placeholder");
        $("#password").attr("placeholder", "password");
    } else {
        $("#password").removeAttr("placeholder");
        $("#username").attr("placeholder", "username");
    }
}

function showhideloginbar(isloggedin){
    if (isloggedin == true){
        // have to blur before hide or focus won't be returned
        $("*:focus").blur();
        $("#loginbar").hide();
        $("#logout").show();
    } else {
        $("#logout").hide();
        $("#loginbar").show();
    }
}

function loginbutton(){
    $.ajax({
        url: HOMEPAGE + "login",
        type: "GET",
        data: {
            username: $("#username").val(),
            password: $("#password").val()
        },
        success: function(json){
            // todo. get return status and hide login bar
            showhideloginbar(json.isloggedin);
            mkrandomposts();
        }
    });
}

// too much dom manipulation makes it slow: generate all divs just
// once in the beginning
function initrandompostdivs(){
    var rp = $("#randomposts");
    // <= means there'll be extra divs with no posts: that's ok
    for (var i = 0; i <= POSTCOUNT / POSTSPERCOL; i++){
        var row = $("<div/>", {
            class: "row-fluid myrandomrow",
        }).appendTo(rp);
        for (var j = 0; j < POSTSPERCOL; j++){
            row.append(
                "<div class='span" + SPANWIDTH + "'>" +
                    "<a href='#' class='randompost'>" +
                        "<span class='posttitle'></span> " +
                        "<span class='postbody'></span> " +
                        "<span class='postsubject'></span> " +
                        "<span class='postdate'></span>" +
                    "</a>" +
                "</div>"
            );
        }
    }
}

// this is a hack to allow enter submit on form input, because for
// some reason <form/> won't let you ajax csrftoken, so had to switch
// to div, but then <input/> doesn't submit on enter keydown
function newpostformbindenterkeypress(){
    $("#newposttitle, #newpostsubject").bind("keydown", inputkeydownsubmit);
    $("#username, #password").bind("keydown", inputkeydownlogin);
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

function inputkeydownlogin(e){
    switch (e.which || e.keyCode){
    case KEYENTER:
        if (!e.ctrlKey){
            $("#loginbutton").click();
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
            rp.find(".postdate").html(parsedatetime(post.updated));
        });
    });
}

function parsedatetime(t){
    var m = "2013-02-19T04:11:51-05:00".match(/(\d+|[a-zA-Z])/g);
    return moment(t).format("H:mm ddd DD MMM YYYY"); //.calendar();
}

function editpost(postid){
    populateeditpost(postid);
    shownewpostform();
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
            // $("#newpostform").hide();
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
            // $("#newpostform").hide();
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
