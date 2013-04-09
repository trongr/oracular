// todo. new layout: don't use modal, put inputs on the page

var HOMEPAGE = "http://localhost:8000/journal/";
// var HOMEPAGE = "http://oracular.herokuapp.com/journal/";

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
var KEY_M = 77;

var BOOTSTRAP_GRID = 12;

var NUMCELLS = 9;
var POSTCOUNT = 9;
var POSTSPERCOL = 3;
var SPANWIDTH = BOOTSTRAP_GRID / POSTSPERCOL;

var instagrams;
var instapos = 0;
var INSTAROW_SIZE = 4;         // number of pics in instagram row
var INSTA_SPANWIDTH = BOOTSTRAP_GRID / INSTAROW_SIZE;
var FLICKR_WIDTH = 150;

var recentpanels;              // divs for newly submitted posts
var recentpostpos = 0;         // where to insert the next recent post

var relatedPost;                // div for related post

var displaypanels;              // divs for random posts
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
                    "than":true, "you":true, "you're": true,
                    "you've":true, "what":true,
                    "them":true, "first":true, "it":true,
                    "were":true, "so":true, "been":true,
                    "he":true, "we":true, "some":true,
                    "call":true, "was":true, "when":true,
                    "her":true, "who":true, "for":true,
                    "your":true, "would":true, "oil":true,
                    "on":true, "can":true, "make":true,
                    "its":true, "are":true, "said":true,
                    "like":true, "now":true, "as":true,
                    "there":true, "there're":true,
                    "him":true, "find":true,
                    "with":true, "use":true, "into":true,
                    "long":true, "his":true, "an":true,
                    "time":true, "down":true, "they":true,
                    "each":true, "has":true, "day":true,
                    "i":true, "i'm":true, "which":true,
                    "look":true, "very":true,
                    "did":true, "at":true, "she":true,
                    "two":true, "get":true, "be":true,
                    "do":true, "does":true,
                    "more":true, "come":true,
                    "this":true, "how":true, "write":true,
                    "made":true, "have":true, "their":true,
                    "go":true, "may":true, "from":true,
                    "if":true, "see":true, "part":true,
                    "that":true, "that's":true, "thing":true};

$(document).ready(function(){
    loginout();

    initRelatedPicDivs();
    loadInterestingFlickrPics();

    initPostDivs();
    mkrandomposts();

    cachedivs();

    registerBindings();

    $("a").tooltip({'placement': 'bottom'});
});

function loadInterestingFlickrPics(){
    $.ajax({
        url: "https://secure.flickr.com/services/rest?jsoncallback=?",
        type: "GET",
        data: {
            method: "flickr.interestingness.getList",
            api_key: "4a3005acb063ad3234d2f7da3ab1f801", // flickr key
            format: "json",
            per_page: INSTAROW_SIZE,
        },
        dataType: "jsonp",
        success: function(json){
            loadInterestingness(json);
        }
    });
}

function loadInterestingness(json){
    if (!json.photos || !json.photos.photo){
        throw "home.js:loadInterestingness:" + JSON.stringify(json, 0, 2)
    } else {
        for (var i = 0; i < INSTAROW_SIZE; i++){
            var item = json.photos.photo[i];
            var basePic = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret;
            var thumbPic = basePic + '_q.jpg';
            // var medPic = basePic + ".jpg";
            var largePic = basePic + "_b.jpg";
            instagrams.eq(i)
                .attr("src", thumbPic)
            // .attr("data-src", medPic);
                .attr("data-src", largePic);
        }
    }
}

// todo now
function registerBindings(){
    clickityclickclick(); // setting button onclicks
    $(document).bind("keydown", keyboardshortcuts);
    newpostformbindenterkeypress();

    // return focus to window after pressing esc on new post form modal
    $("#newpostform").on("hide", onPostFormHide);
    $("#newpostform").on("show", onPostFormShow);

    // fixing bug making register box closing when clicking on input
    $('#signupform').click(function (e) {e.stopPropagation();});

    $("#newposttitle").keydown(onEditKeydown);
    $("#newpostbody").keydown(onEditKeydown);

    $(".randompost, .relatedpost").on("click", editPost);
    $(".instagram").on("click", openInstagramSrc);
}

function openInstagramSrc(){
    window.open($(this).attr("data-src"));
}

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
    relatedPost = $(".relatedpost");
    displaypanels = $(".randompost");
    recentpanels = $(".recentpost");
    instagrams = $(".instagram");
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

function onEditKeydown(e) {
    var key = e.which || e.keyCode;
    switch (key){
    case KEYTAB:
    case KEYSPACE:          // querying database on word
        getrelatedposts();
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
    insertMathBrackets(e);
}

function clearRelatedWords(){
    relatedwords = "";
}

// getting a post with the same words as what you're writing
//
// todo. smarter algorithm to get posts with similar ideas
function getrelatedposts(){
    prepRelatedWords();
    if (!isCommonWord(relatedwords)){
        getOwnPosts(relatedwordsarray());
        // getImgurPics(relatedwordsarray()[0]); // todo today
        getFlickrPics(relatedwordsarray()[0]);
        // getInstagramPics(relatedwordsarray()[0]);
    }
    clearRelatedWords();
}

function getFlickrPics(relatedWord){
    $.ajax({
        url: "https://secure.flickr.com/services/rest?jsoncallback=?",
        type: "GET",
        data: {
            method: "flickr.photos.search",
            api_key: "4a3005acb063ad3234d2f7da3ab1f801", // flickr key
            format: "json",
            tags: relatedWord,
            per_page: 1,
        },
        dataType: "jsonp",
        success: function(json){
            jsonFlickrApi(json);
        }
    });
}

// flickr's api is not intuitive at all
function jsonFlickrApi(json){
    if (!json.photos || !json.photos.photo[0]){
        throw "home.js:getFlickrPics:" + JSON.stringify(json, 0, 2)
    } else {
        var item = json.photos.photo[0];
        var basePic = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret;
        var thumbPic = basePic + '_q.jpg';
        // var medPic = basePic + ".jpg";
        var largePic = basePic + "_b.jpg";
        instagrams.eq(instapos)
            .attr("src", thumbPic)
            // .attr("data-src", medPic);
            .attr("data-src", largePic);
        instapos = (instapos + 1) % INSTAROW_SIZE;
    }
}

function getInstagramPics(relatedWord){
    $.ajax({
        url: "https://api.instagram.com/v1/tags/" + relatedWord + "/media/recent",
        type: "GET",
        data: {
            client_id: "d4d42f8e08c04b90a44f9c762e266642", // instagram client id
            count: 1
        },
        dataType: "jsonp",
        success: function(json){
            if (!json.data || !json.data[0]){
                throw "home.js:getInstagramPics:" + JSON.stringify(json, 0, 2);
            } else {
                instagrams.eq(instapos)
                    .attr("src", json.data[0].images.thumbnail.url)
                    .attr("data-src", json.data[0].link);
                instapos = (instapos + 1) % INSTAROW_SIZE;
            }
        },
    });
}

// todo today. wait for google group reply
function getImgurPics(relatedWord){
    $.ajax({
        url: "https://api.imgur.com/3/gallery/search.json",
        type: "GET",
        data: {
            client_id: "eb3d9689067c943",
            q: relatedWord,
        },
        dataType: "json",
        success: function(json){
            console.log(JSON.stringify(json, 0, 2));
            // if (!json.data || !json.data[0]){
            //     throw "home.js:getInstagramPics:" + JSON.stringify(json, 0, 2);
            // } else {
            //     instagrams.eq(instapos)
            //         .attr("src", json.data[0].images.thumbnail.url)
            //         .attr("data-src", json.data[0].link);
            //     instapos = (instapos + 1) % INSTAROW_SIZE;
            // }
        },
    });
}

function getOwnPosts(relatedWordsArray){
    $.ajax({
        url: HOMEPAGE + "relatedposts",
        type: "GET",
        data: {
            relatedwords: relatedWordsArray,
        },
        success: function(json){
            loadrelatedposts(json);
            highlightpost(relatedWordsArray);
        },
    });
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

function highlightpost(rw){
    for (var i = 0; i < rw.length; i++){
        relatedPost.highlight(rw[i]);
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
        $("#newpostbody").attr("placeholder", "note");
    } else if (id == "note") {
        $("#newposttitle").attr("placeholder", "title");
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
        $("#feedback").show();
        $("#newpostbutton").show();
        $("#reloadbutton").show();
    } else {
        $("#feedback").hide();
        $("#newpostbutton").hide();
        $("#reloadbutton").hide();
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
            // todo. check return status
            showhideloginbar(json.isloggedin);
            clearrandomposts();
            mkrandomposts();
        }
    });
}

function initRelatedPicDivs(){
    magicallyCalculateBootstrapDimensions();
    var stuff = "<div class='row-fluid myrandomrow'>";
    for (var i = 0; i < INSTAROW_SIZE; i++){
        stuff += "<div class='span" + INSTA_SPANWIDTH + "'>" +
            '<img src="" data-src="" class="instagram">' +
            "</div>"
    }
    stuff += "</div>";
    $("#relatedpics").html(stuff);
}

function magicallyCalculateBootstrapDimensions(){
    var size = $(window).width() / FLICKR_WIDTH;
    if (size >= 1){
        INSTAROW_SIZE = 1;
        INSTA_SPANWIDTH = 12;
    }
    if (size >= 2){
        INSTAROW_SIZE = 2;
        INSTA_SPANWIDTH = 6;
    }
    if (size >= 3){
        INSTAROW_SIZE = 3;
        INSTA_SPANWIDTH = 4;
    }
    if (size >= 4){
        INSTAROW_SIZE = 4;
        INSTA_SPANWIDTH = 3;
    }
    if (size >= 6){
        INSTAROW_SIZE = 6;
        INSTA_SPANWIDTH = 2;
    }
    if (size >= 12){
        INSTAROW_SIZE = 12;
        INSTA_SPANWIDTH = 1;
    }
}

function initPostDivs(){
    var rp = $("#randomposts");
    var stuff = "";
    for (var i = 0; i < POSTCOUNT / POSTSPERCOL; i++){
        stuff += "<div class='row-fluid myrandomrow'>";
        for (var j = 0; j < POSTSPERCOL; j++){
            stuff += "<div class='span" + SPANWIDTH + "'>" +
                "<a href='#' class='randompost recentpost'>" +
                "<span class='posttitle tex2jax_ignore'></span> " + // putting spaces after spans let them fill over to new lines
                "<span class='postbody'></span> " +
                "<span class='hiddenbody hide tex2jax_ignore'></span> " +
                "<span class='postdate'></span>" +
                "</a>" +
                "</div>"
        }
        stuff += "</div>";
    }
    rp.html(stuff);
}

// this is a hack to allow enter submit on form input, because for
// some reason <form/> won't let you ajax csrftoken, so had to switch
// to div, but then <input/> doesn't submit on enter keydown
function newpostformbindenterkeypress(){
    $("#newposttitle").bind("keydown", inputkeydownsubmit);
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
            shownewpostform();  // todo now
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
        recentpostpos = 0;      // reset to top
    });
}

function loadposts(json){
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(i);
        rp.attr("id", post.id);
        rp.find(".posttitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".hiddenbody").html(post.body);
        rp.find(".postdate").html(parsedatetime(post.updated));
    });
    rejax();
}

function loadrelatedposts(json){
    $.each(json.posts, function(i, post){
        relatedPost.attr("id", post.id);
        relatedPost.find(".posttitle").html(post.title);
        relatedPost.find(".postbody").html(post.body);
        relatedPost.find(".hiddenbody").html(post.body);
        relatedPost.find(".postdate").html(parsedatetime(post.updated));
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

function editPost(){
    populateeditpost($(this));
    showpostform();
}

// using new post form to edit old posts
function populateeditpost(post){
    // input's and textarea's must use .val() instead of .html()
    $("#editpostid").val(post.attr("id"));
    $("#newposttitle").val(post.find(".posttitle").unhighlight().html());
    // postbody is just for show, e.g. highlight and mathjax.
    // hiddenbody is where we store the actual content
    //
    // NOTE. apparently jquery.highlight.js also highlights hidden divs
    $("#newpostbody").val(post.find(".hiddenbody").unhighlight().html());

    // replacing onclick behaviour. this is bad design: todo: give
    // each function its own view
    $("#newpostsubmit").attr("onclick", "submiteditpost()");
}

function submiteditpost(){
    var id = $("#editpostid").val();
    var title = $("#newposttitle").val();
    var body = $("#newpostbody").val();
    var subject = "";                   // todo. remove subject from
                                        // views and models.py, same
                                        // for submitpost
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
            showFeedback(json.title + " SAVED");
        },
        complete: function(){
        }
    });
    // mkrandomposts();
    cancelnewpost();
}

function showsubmittedpost(post){
    clearPreviousSubmittedPostStyle();

    var rp = recentpanels.eq(recentpostpos);
    recentpostpos = (recentpostpos + 1) % recentpanels.length;

    rp.attr("id", post.id);
    rp.find(".posttitle").html(post.title);
    rp.find(".postbody").html(post.body).addClass("recentbody");
    rp.find(".hiddenbody").html(post.body);
    rp.find(".postdate").html(parsedatetime());

    rejax();
}

function clearPreviousSubmittedPostStyle(){
    recentpanels.eq((recentpostpos - 1 + recentpanels.length) % recentpanels.length)
        .find(".postbody").removeClass("recentbody");
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
    // replacing onclick behaviour. this is bad design: todo: give
    // each function its own view
    $("#newpostsubmit").attr("onclick", "submitpost()");
}

function submitpost(){
    var title = $("#newposttitle").val();
    var body = $("#newpostbody").val();
    var subject = "";
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
            showFeedback(json.title + " saved");
        },
        complete: function(){
        }
    });
    // mkrandomposts();
    cancelnewpost();
}

function showFeedback(msg){
    $("#feedback").html(msg);
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

function insertMathBrackets(e){
    var key = e.which || e.keyCode;
    if (e.ctrlKey && key === KEY_M){
        $("#newpostbody").insertAtCaret("\\(\\)");
    }
};

// todo. use this to make a macro library
jQuery.fn.extend({
    insertAtCaret: function(myValue){
        return this.each(function(i) {
            if (document.selection) {
                //For browsers like Internet Explorer
                this.focus();
                sel = document.selection.createRange();
                sel.text = myValue;
                this.focus();
            } else if (this.selectionStart || this.selectionStart == '0') {
                //For browsers like Firefox and Webkit based
                var startPos = this.selectionStart;
                var endPos = this.selectionEnd;
                var scrollTop = this.scrollTop;
                this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
                this.focus();
                this.selectionStart = startPos + myValue.length - 2; // todo. change this
                this.selectionEnd = startPos + myValue.length - 2;
                this.scrollTop = scrollTop;
            } else {
                this.value += myValue;
                this.focus();
            }
        });
    }
});