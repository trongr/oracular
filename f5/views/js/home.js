// todo. separate edit post from new post form. right now they share
// the same modal

var HOMEPAGE = "http://localhost:8000/journal/";
// var HOMEPAGE = "http://oracular.herokuapp.com/journal/";

var NUMCELLS = 9;
var POSTCOUNT = 9;
var POSTSPERCOL = 3;
var SPANWIDTH = 12 / POSTSPERCOL;

// todo. use moode as a kind of namespace for shortcuts

// don't need this yet

var MODE_GLOBAL = "MODE_GLOBAL";
var MODE_EDIT = "MODE_EDIT";
var moode = MODE_GLOBAL;        // weird name to avoid nameclashing.
                                // should refactor and wrap all this
                                // in closure

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
var relatedwords = "";
var COMMON_WORDS = {"the":true, "or":true, "will":true,
                    "number":true, "of":true, "one":true,
                    "up":true, "no":true, "and":true,
                    "had":true, "other":true, "way":true,
                    "a":true, "by":true, "about":true,
                    "could":true, "to":true, "word":true,
                    "out":true, "people":true, "in":true,
                    "but":true, "many":true, "my":true,
                    "is":true, "not":true, "then":true,
                    "than":true, "you":true, "what":true,
                    "them":true, "first":true, "it":true,
                    "were":true, "so":true, "been":true,
                    "he":true, "we":true, "some":true,
                    "call":true, "was":true, "when":true,
                    "her":true, "who":true, "for":true,
                    "your":true, "would":true, "oil":true,
                    "on":true, "can":true, "make":true,
                    "its":true, "are":true, "said":true,
                    "like":true, "now":true, "as":true,
                    "there":true, "him":true, "find":true,
                    "with":true, "use":true, "into":true,
                    "long":true, "his":true, "an":true,
                    "time":true, "down":true, "they":true,
                    "each":true, "has":true, "day":true,
                    "I":true, "which":true, "look":true,
                    "did":true, "at":true, "she":true,
                    "two":true, "get":true, "be":true,
                    "do":true, "more":true, "come":true,
                    "this":true, "how":true, "write":true,
                    "made":true, "have":true, "their":true,
                    "go":true, "may":true, "from":true,
                    "if":true, "see":true, "part":true,
                    "that":true};

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

    // selects all text on focus
    // $("input, textarea").focus(function(){$(this).select()});

    // return focus to window after pressing esc on new post form modal
    $("#newpostform").on("hide", onPostFormHide);
    $("#newpostform").on("show", onPostFormShow);

    // reading tab in newpostform tags input to load posts in bg
    readWords();

    $('#signupform').click(function (e) {
        e.stopPropagation();
    });
});

function onPostFormHide(){
    $("*:focus").blur();
    changeMode(MODE_GLOBAL);
}

function onPostFormShow(){
    clearRelatedWords();
    changeMode(MODE_EDIT);
}

// caching to save time
function cachedivs(){
    displaypanels = $(".randompost");
    inputtitle = $("#newposttitle");
    inputtags = $("#newpostsubject");
}

function readChar(key){
    // js can't read single quote ' from e.which, so hack:
    var letter = parseInt(key);
    if (key == "222"){
        relatedwords += "'";
    } else if ((65 <= letter && letter <= 90) ||
               (97 <= letter && letter <= 122)) {
        relatedwords += String.fromCharCode(key);
    }
}

// pressing backspace removes previous character instead of adding
// space char
function rollbackspace(){
    relatedwords = relatedwords.slice(0, -1);
}

function readWords(){
    $("#newposttitle").keydown(function(e) {
        var key = e.which || e.keyCode;
        switch (key){
        case KEYSPACE:
        case KEYTAB:
            getrelatedposts("title");
            break;
        default:
            readChar(key);
        }
    });
    $("#newpostbody").keydown(function(e) {
        var key = e.which || e.keyCode;
        switch (key){
        case KEYSPACE:          // querying database on word
            getrelatedposts("body");
            break;
        case KEYBACKSPACE:
            if (e.ctrlKey){     // ctrl + backspace deletes last word
                clearRelatedWords();
            } else {
                rollbackspace();
            }
            break;
        default:                // reading anything but punctuations
            readChar(key);
        }
    });
}

function clearRelatedWords(){
    relatedwords = "";
}

// getting a post with the same words as what you're writing
//
// todo. smarter algorithm to get posts with similar ideas
function getrelatedposts(where){
    prepRelatedWords();
    // if (relatedwords.length >= 4){
    if (!isCommonWord(relatedwords)){
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
                loadrelatedposts(json);
                highlightpost();
            },
            complete: function(){
                clearRelatedWords();
            }
        });
    } else {
        clearRelatedWords();
    }
}

function isCommonWord(word){
    return COMMON_WORDS[word];
}

function relatedwordsarray(){
    // relatedwords = relatedwords.replace(/[^'\w]/g, " ").trim().toLowerCase();
    return relatedwords.split(" ");
}

function prepRelatedWords(){
    relatedwords = relatedwords.trim().toLowerCase();
}

function highlightpost(){
    var rw = relatedwords.split(" ");
    for (var i = 0; i < rw.length; i++){
        displaypanels.eq(0).highlight(rw[i]);
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

    // $("#settingsbutton").click(function(){settingsbutton();});
    $("#aboutbutton").click(function(){aboutbutton();});

    // $("#tagsbutton").click(function(){tagsbutton(); return false;});
}

// todo. validate inputs and user feedback
function signup(){
    var username = $("#signupusername").val();
    var password = $("#signuppassword").val();
    var repassword = $("#signuprepassword").val();
    var token = getcsrf("signupcsrf"); // getCookie('csrftoken');
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
                $("#signupmsg").html(json.error);
            } else {
                showhideloginbar(json.isloggedin);
                // mkrandomposts();
                clearrandomposts();
            }
        }
    });
}

function clearrandomposts(){
    for (var i = 0; i < POSTCOUNT; i++){
        var rp = displaypanels.eq(i);
        rp.find(".posttitle").html("");
        rp.find(".postbody").html("");
        rp.find(".postsubject").html("");
        rp.find(".postdate").html("");
    }
}

function aboutbutton(){
    closeallmodals();
    $("#aboutmodal").modal();
}

function closeallmodals(){
    $("#aboutmodal").modal("hide");
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
        $("#tools").show();
    } else {
        $("#tools").hide();
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
            clearrandomposts();
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
                        "<span class='posttitle tex2jax_ignore'></span> " + // putting spaces after spans let them fill over to new lines
                        "<span class='postbody'></span> " +
                        "<span class='hiddenbody hide tex2jax_ignore'></span>" +
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
    $("#signupusername, #signuppassword, #signuprepassword").bind("keydown", inputkeydownsignup);
}

// should write a library for this
function inputkeydownsignup(e){
    switch (e.which || e.keyCode){
    case KEYENTER:
        if (!e.ctrlKey){
            $("#signupbtn").click();
        }
        break;
    }
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

// todo opt. ctrl + n to edit nth box
function keyboardshortcuts(e){
    if (e.ctrlKey){
        switch (e.which || e.keyCode){
        case KEYSPACE:
            mkrandomposts();
            break;
        case KEYENTER:
            shownewpostform();
            break;
        // case KEYE:
        //     $("#settingsbutton").click();
        //     break;
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
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(i);
        rp.attr("id", post.id);
        rp.attr("onclick", "editpost(" + post.id + ")");
        rp.find(".posttitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".hiddenbody").html(post.body);
        rp.find(".postsubject").html(post.subject);
        rp.find(".postdate").html(parsedatetime(post.updated));
    });
    rejax();
}

function loadrelatedposts(json){
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(0);
        rp.attr("id", post.id);
        rp.attr("onclick", "editpost(" + post.id + ")");
        rp.find(".posttitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".hiddenbody").html(post.body);
        rp.find(".postsubject").html(post.subject);
        rp.find(".postdate").html(parsedatetime(post.updated));
    });
    rejax();
}

function parsedatetime(t){
    if (t){
        return moment(t).format("H:mm ddd DD MMM YYYY"); //.calendar();
    } else {
        return moment().format("H:mm ddd DD MMM YYYY"); //.calendar();
    }
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
    // postbody is just for show, e.g. highlight and mathjax.
    // hiddenbody is where we store the actual content
    //
    // NOTE. apparently jquery.highlight.js also highlights hidden divs
    $("#newpostbody").val(post.find(".hiddenbody").unhighlight().html());
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
    var token = getcsrf("newpostcsrf"); // getCookie('csrftoken');
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
            showsubmittedpost(json);
        },
        complete: function(){
        }
    });
    // mkrandomposts();
    cancelnewpost();
}

function showsubmittedpost(post){
    var rp = displaypanels.eq(1); // top second-left post
    rp.attr("id", post.id);
    rp.attr("onclick", "editpost(" + post.id + ")");
    rp.find(".posttitle").html(post.title);
    rp.find(".postbody").html("<span class='highlight'>" + post.body + "</span>");
    rp.find(".hiddenbody").html(post.body);
    rp.find(".postsubject").html(post.subject);
    rp.find(".postdate").html(parsedatetime());
    rejax();
}

function showpostform(){
    closeallmodals();
    $("#newpostform").modal();
    $("#newposttitle").focus();
}

function changeMode(newMode){
    moode = newMode;
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
    var token = getcsrf("newpostcsrf"); // getCookie('csrftoken');
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
            showsubmittedpost(json);
        },
        complete: function(){
        }
    });
    // mkrandomposts();
    cancelnewpost();
}

function cancelnewpost(){
    $("*:focus").blur();
    $("#newpostform").modal("hide");
}

function getcsrf(id){
    return $("#" + id).val();
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

function rejax(){
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
}