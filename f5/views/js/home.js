// todo. separate edit post from new post form. right now they share
// the same modal

// var HOMEPAGE = "http://localhost:8000/journal/";
var HOMEPAGE = "http://ffive.herokuapp.com/journal/";

var NUMCELLS = 9;
var POSTCOUNT = 9;
var POSTSPERCOL = 3;
var SPANWIDTH = 12 / POSTSPERCOL;

// keycodes
var KEYSPACE = 32;
var KEYENTER = 13;
var KEYE = 69;
var KEYTAB = 9;
var KEYCOMMA = 188;
var KEYPERIOD = 190;
var KEYSEMICOLON = 59;
var KEYONE = 49;                // shift + one = !
var KEYSLASH = 191;             // shift + slash = ?
var KEYBACKSPACE = 8;

// var mainpane;                   // div for relatedposts
var displaypanels;                   // divs for relatedposts
var whichpanel = -POSTSPERCOL;                  // which panel to load the next post
var relatedwords = "";

var inputtitle, inputtags;

$(document).ready(function(){
    loginout();
    initrandompostdivs();
    mkrandomposts();
    cachedivs();

    $("a").tooltip({'placement': 'bottom'});

    clickityclickclick(); // setting button onclicks
    $(document).bind("keydown", keyboardshortcuts);
    newpostformbindenterkeypress();

    $("input, textarea").focus(function(){$(this).select()});

    // return focus to window after pressing esc on new post form modal
    $("#newpostform").on("hide", function(){$("*:focus").blur()});

    // reading tab in newpostform tags input to load posts in bg
    tabinput();

    $('#signupform').click(function (e) {
        e.stopPropagation();
    });
});

// caching to save time
function cachedivs(){
    displaypanels = $(".randompost");
    inputtitle = $("#newposttitle");
    inputtags = $("#newpostsubject");
}

function readrelatedwords(key){
    // js can't read single quote ' from e.which, so hack:
    if (key == "222"){
        relatedwords += "'";
    } else {
        relatedwords += String.fromCharCode(key);
    }
}

// pressing backspace removes previous character instead of adding
// space char
function rollbackspace(){
    relatedwords = relatedwords.slice(0, -1);
}

function tabinput(){
    $("#newposttitle").keydown(function(e) {
        var key = e.which || e.keyCode;
        switch (key){
        case KEYSPACE:
        case KEYTAB:
            relatedwords = inputtitle.val();
            getrelatedposts("title");
            break;
        default:
            readrelatedwords(key);
        }
    });
    $("#newpostbody").keydown(function(e) {
        var key = e.which || e.keyCode;
        // if (e.shiftKey){        // detecting ? and !
        //     switch (key){
        //     case KEYONE:
        //     case KEYSLASH:
        //         getrelatedposts("body");
        //         break;
        //     }
        // }
        switch (key){
        // case KEYCOMMA:          // detecting , . ;
        // case KEYPERIOD:
        // case KEYSEMICOLON:
        //     getrelatedposts("body");
        //     break;
        // case KEYSLASH:          // don't want to read / by default
        //     break;
        case KEYSPACE:          // querying database on word
            getrelatedposts("body");
            break;
        case KEYBACKSPACE:
            if (e.ctrlKey){     // ctrl + backspace deletes last word
                relatedwords = "";
            } else {
                rollbackspace();
            }
            break;
        default:                // reading anything but punctuations
            readrelatedwords(key);
        }
    });
    // not storing subject input anymore
    // $("#newpostsubject").keydown(function(e) {
    //     var key = e.which || e.keyCode;
    //     switch (key){
    //     case KEYTAB:
    //         relatedwords = inputtags.val();
    //         getrelatedposts("subject");
    //         break;
    //     default:
    //     }
    // });
}

// getting a post with the same words as what you're writing
//
// todo. smarter algorithm to get posts with similar ideas
function getrelatedposts(where){
    if (relatedwords.length >= 4){
        $.ajax({
            url: HOMEPAGE + "relatedposts",
            type: "GET",
            data: {
                where: where,
                relatedwords: relatedwordsarray(),
                // by default, the server loads just one. it's probably
                // better because people don't have the ability to
                // simultaneously write something __and__ read more than
                // one related posts
                //
                // postcount: POSTCOUNT,
            },
            success: function(json){
                // whichpanel++;
                whichpanel = (whichpanel + POSTSPERCOL) % NUMCELLS;
                loadrelatedposts(json);
                highlightpost();
            },
            complete: function(){
                relatedwords = "";
            }
        });
    } else {
        relatedwords = "";
    }
}

function relatedwordsarray(){
    relatedwords = relatedwords.replace(/[^'\w]/g, " ").trim().toLowerCase();
    // relatedwords = relatedwords.trim().toLowerCase();
    return relatedwords.split(" ");
}

function highlightpost(){
    var rw = relatedwords.split(" ");
    for (var i = 0; i < rw.length; i++){
        displaypanels.eq(whichpanel).highlight(rw[i]);
    }
}

// closeallmodals() before opening another one, otw bootstrap too much
// recursion error
function clickityclickclick(){
    $("#newpostbutton").click(function(){shownewpostform(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});

    $("#logout").click(function(){logout(); return false;});
    $("#loginbutton").click(function(){loginbutton(); return false;});
    $("#signupbtn").click(function(){signup(); return false;});

    $("#newpostsubmit").attr("onclick", "submitpost()");

    $("#settingsbutton").click(function(){settingsbutton();});
    // $("#tagsbutton").click(function(){tagsbutton(); return false;});
}

// todo. validate inputs and user feedback
function signup(){
    var username = $("#signupusername").val();
    var password = $("#signuppassword").val();
    var repassword = $("#signuprepassword").val();
    var token = getCookie('csrftoken');
    $.ajax({
        url: HOMEPAGE + "register",
        type: "POST",
        data: {
            username: $("#signupusername").val(),
            password: $("#signuppassword").val(),
            repassword: $("#signuprepassword").val(),
            csrfmiddlewaretoken: token,
        },
        success: function(json){
            if (json.error){
                alert(json.error);
            } else {
                showhideloginbar(json.isloggedin);
                mkrandomposts();
            }
        }
    });
}

// // considering implementing a dynamic display as you type in post
// // form, so listing tags might not be necessary anymore.
// //
// // todo. get tags list: views.gettags()
// function tagsbutton(){
//     $.ajax({
//         url: HOMEPAGE + "gettags",
//         type: "GET",
//         success: function(json){
//             // todo
//         }
//     });
// }

// todo. show default tab
function settingsbutton(){
    closeallmodals();
    $("#settingsmodal").modal();
}

function closeallmodals(){
    $("#settingsmodal").modal("hide");
    $("#newpostform").modal("hide");
}

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

// same hack fix for newpostform. someone needs to write a library for
// this ff bug
function removepostplaceholder(id){
    if (id == "title"){
        $("#newposttitle").removeAttr("placeholder");
        $("#newpostsubject").attr("placeholder", "tags");
        $("#newpostbody").attr("placeholder", "note");
    } else if (id == "tags"){
        $("#newposttitle").attr("placeholder", "title");
        $("#newpostsubject").removeAttr("placeholder");
        $("#newpostbody").attr("placeholder", "note");
    } else {
        $("#newposttitle").attr("placeholder", "title");
        $("#newpostsubject").attr("placeholder", "tags");
        $("#newpostbody").removeAttr("placeholder");
    }
}

// same hack fix for signupform. someone needs to write a library for
// this ff bug
function removesignupplaceholder(id){
    if (id == "signupusername"){
        $("#signupusername").removeAttr("placeholder");
        $("#signuppassword").attr("placeholder", "password");
        $("#signuprepassword").attr("placeholder", "repassword");
    } else if (id == "signuppassword"){
        $("#signupusername").attr("placeholder", "username");
        $("#signuppassword").removeAttr("placeholder");
        $("#signuprepassword").attr("placeholder", "repassword");
    } else {
        $("#signupusername").attr("placeholder", "username");
        $("#signuppassword").attr("placeholder", "password");
        $("#signuprepassword").removeAttr("placeholder");
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
// once in the beginning.... even better:
//
// todo. concat strings before hand and insert into the DOM just once
function initrandompostdivs(){
    var rp = $("#randomposts");

    // todo. concat strings before hand and insert into the DOM just
    // once. this for loop is bad:

    // <= means there'll be extra divs with no posts: that's ok
    for (var i = 0; i <= POSTCOUNT / POSTSPERCOL; i++){
        var row = $("<div/>", {
            class: "row-fluid myrandomrow",
        }).appendTo(rp);
        for (var j = 0; j < POSTSPERCOL; j++){
            row.append(
                "<div class='span" + SPANWIDTH + "'>" +
                    "<a href='#' class='randompost'>" +
                        "<span class='posttitle'></span> " + // putting spaces after spans let them fill over to new lines
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
    if (e.ctrlKey){
        switch (e.which || e.keyCode){
        case KEYSPACE:
            mkrandomposts();
            break;
        case KEYENTER:
            shownewpostform();
            break;
        case KEYE:
            $("#settingsbutton").click();
            break;
        }
    }
}

function mkrandomposts(){
    $.getJSON(HOMEPAGE + "randomposts", {
        postcount: POSTCOUNT
    }, function(json){
        loadposts(json);
    });
}

function loadposts(json){
    // var rps = $(".randompost");
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(i);
        rp.attr("id", post.id);
        rp.attr("onclick", "editpost(" + post.id + ")");
        rp.find(".posttitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".postsubject").html(post.subject);
        rp.find(".postdate").html(parsedatetime(post.updated));
    });
}

function loadrelatedposts(json){
    // var rps = $(".randompost");
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(whichpanel);
        rp.attr("id", post.id);
        rp.attr("onclick", "editpost(" + post.id + ")");
        rp.find(".posttitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".postsubject").html(post.subject);
        rp.find(".postdate").html(parsedatetime(post.updated));
        // rp.parent().css({
        //     "border": "1px solid #fff",
        //     "border-radius": "5px",
        //     "padding": "5px",
        // });
    });
}

function parsedatetime(t){
    // var m = "2013-02-19T04:11:51-05:00".match(/(\d+|[a-zA-Z])/g);
    return moment(t).format("H:mm ddd DD MMM YYYY"); //.calendar();
}

function editpost(postid){
    populateeditpost(postid);
    showpostform();
}

// using new post form to edit old posts
function populateeditpost(postid){
    var post = $("#" + postid);
    // input's and textarea's must use .val() instead of .html()
    $("#editpostid").val(postid);
    $("#newposttitle").val(post.find(".posttitle").unhighlight().html());
    $("#newpostbody").val(post.find(".postbody").unhighlight().html());
    $("#newpostsubject").val(post.find(".postsubject").unhighlight().html());

    // replacing onclick behaviour. this is bad design: todo: give
    // each function its own view
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
        success: function(json){
            // console.log(json.body);
        }
    });
    mkrandomposts();
    cancelnewpost();
}

function showpostform(){
    closeallmodals();
    $("#newpostform").modal();
    $("#newposttitle").focus();
}

function shownewpostform(){
    prepnewpostform();
    showpostform();
}

function prepnewpostform(){
    // input's and textarea's must use .val() instead of .html()
    $("#newposttitle").val("");
    $("#newpostbody").val("");
    $("#newpostsubject").val("");
    // replacing onclick behaviour. this is bad design: todo: give
    // each function its own view
    $("#newpostsubmit").attr("onclick", "submitpost()");
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
        success: function(json){
            // console.log(json.body);
        }
    });
    mkrandomposts();
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
