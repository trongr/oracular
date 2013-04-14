// todo. oracular could be used as a mass crowd-sourcing mechanism

// todo. trigger events on edit: what kinds of events?

// todo. search and list notes by modified time: first step to a
// proper editing environment: files.

// todo. put related word below flickr picture. then put thesaurus
// entries

// todo. resize pictures properly

// todo. load original image page instead of just the image on img
// click. just remove the file type extension

// todo. don't save or create empty notes

// todo. clip imgur titles.

// todo. show img url on image cell hover, i.e. including comment, not
// just image.

// todo opt. remove some of the common words: you want to maximize the
// number of imgur requests and results. maybe let user choose which
// words to not request.

// todo opt. autoresize textarea height

// todo. save files by mere virtue of modifying them, without having
// to click save.... aw that means we're losing the red and blue pill
// buttons.......... MAYBE NOT. IT'S NOT INTUITIVE

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
var INSTAROW_SIZE = 4;          // number of pics in instagram row
var FLICKR_WIDTH = 200;         // size of img.instagram

var displaypanels;              // divs for random posts

var relatedPost;                // div for related post
var relatedwords = "";
var COMMON_WORDS = {
    "the":true, "or":true, "will":true,
    "of":true, "just": true,
    "no":true, "and":true,
    "had":true,
    "a":true, "by":true, "about":true,
    "could":true, "to":true,
    "out":true, "in":true,
    "but":true, "my":true,
    "is":true, "not":true, "then":true,
    "than":true, "you":true, "you're": true,
    "you've":true,
    "them":true, "it":true,
    "were":true, "so":true, "been":true,
    "he":true, "we":true, "some":true,
    "was":true, "when":true,
    "her":true, "who":true, "for":true,
    "your":true, "would":true,
    "on":true, "can":true,
    "its":true, "are":true, "said":true,
    "now":true, "as":true,
    "here":true, "here's":true, "there":true,
    "there're":true, "him":true, "find":true,
    "with":true, "into":true,
    "his":true, "an":true,
    "they":true,
    "has":true,
    "i":true, "i'm":true, "which":true,
    "very":true,
    "did":true, "at":true, "she":true,
    "get":true, "be":true,
    "do":true, "does":true,
    "this":true, "how":true,
    "have":true, "their":true,
    "may":true, "from":true,
    "if":true,
    "that":true, "that's":true,
};

var feedback, feedbackSignal, feedbackMsg;

var isLoggedIn = false;

$(document).ready(function(){
    loginout();

    clearNewPostForm();

    initRelatedPicDivs();
    loadInterestingFlickrPics();

    initPostDivs();
    mkrandomposts(true);

    cachedivs();

    registerBindings();

    tooltips();
});

function tooltips(){
    $("a").tooltip({'placement': 'bottom'});
    $("img").tooltip({'placement': 'bottom'});
    $("button").tooltip({'placement': 'top'});
}

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
            // var thumbPic = basePic + '_q.jpg';
            var medPic = basePic + ".jpg";
            var largePic = basePic + "_b.jpg";
            instagrams.eq(i).find(".instagram")
                .attr("src", medPic)
            // .attr("src", thumbPic)
                .attr("data-src", largePic);
        }
    }
}

function registerBindings(){
    clickityclickclick(); // setting button onclicks
    $(document).bind("keydown", keyboardshortcuts);
    inputEnterKeypress();
    $("#newPostTitle, #newPostBody, #editPostTitle, #editPostBody")
        .keydown(onEditKeydown)
        .on("blur", onPostInputBlur);
}

function onPostInputBlur(){
    if ($(this).val() != ""){
        $(this).removeClass("postInputGrey").addClass("postInputBlack");
    } else {
        $(this).removeClass("postInputBlack").addClass("postInputGrey");
    }
}

function openInstagramSrc(){
    window.open($(this).attr("data-src"));
}

// caching to save time
function cachedivs(){
    relatedPost = $(".relatedpost");
    displaypanels = $(".randompost");
    instagrams = $(".instaCell");
    feedback = $("#feedback");
    feedbackSignal = $("#feedbackSignal");
    feedbackMsg = $("#feedbackMsg");
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
    showFeedback("TYPING", relatedwords);
}

// pressing backspace removes previous character instead of adding
// space char
function rollbackspace(){
    relatedwords = relatedwords.slice(0, -1);
    showFeedback("TYPING", relatedwords);
}

function onEditKeydown(e) {
    var key = e.which || e.keyCode;
    switch (key){
    case KEYTAB:
    case KEYSPACE:          // querying database on word
    case KEYENTER:
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
    insertMathBrackets(e, $(this));
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
        if (isLoggedIn){
            getOwnPosts(relatedwordsarray());
        }
        getImgurPics(relatedwordsarray()[0]);
        // getFlickrPics(relatedwordsarray()[0]);
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
        // throw "home.js:getFlickrPics:" + JSON.stringify(json, 0, 2)
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

function getImgurPics(relatedWord){
    $.ajax({
        url: "https://api.imgur.com/3/gallery/search.json",
        type: "GET",
        headers: {
            Authorization: 'Client-ID eb3d9689067c943',
        },
        data: {
            q: relatedWord,
            // todo. random page, for variety: need to know how many total for each keyword
            page: 1,
            sort: "time",       // top | time
            window: "all"       // day | week | month | year | all
        },
        dataType: "json",
        success: function(json){ // todo. color-coded feedback
            if (!json.data || json.data.length === 0){
                throw "home.js:getImgurPics:" + JSON.stringify(json, 0, 2);
            } else {
                loadImgurPic(json.data, relatedWord);
            }
        },
    });
}

// optional. put postType on gifs.
function loadImgurPic(posts, relatedWord){
    var index = getRandomImgurPostIndex(posts);
    var post = posts[index];
    var cell = instagrams.eq(instapos);
    cell.find(".instagram")
        .attr("src", post.link)
        .attr("data-src", post.link)
        .attr("alt", post.link)
        .attr("data-original-title", post.title);
    // cell.find(".imgurPostType").html(getImgurPostType(post));
    cell.find(".instaComment")
        .html(post.title)
        .highlight(relatedWord);
    instapos = (instapos + 1) % INSTAROW_SIZE;
    reloadGifs();
}

// cause after a while gifs stop loading, probably because of the
// autoresizing
function reloadGifs(){
    for (var i = 0; i < INSTAROW_SIZE; i++){
        var post = instagrams.eq(i).find(".instagram");
        post.attr("src", post.attr("src"));
    }
}

function getRandomImgurPostIndex(posts){
    // randomize through posts until non-album found, if not found
    // return index 0
    var index = 0;
    for (var i = 0; i < posts.length; i++){
        index = Math.floor(Math.random() * posts.length);
        // type == "image/<type>", if doesn't exist probably an album,
        // more than one picture so can't display
        if (posts[index].type && posts[index].type.split("/")[0] == "image"){
            break;
        }
    }
    return index;
}

// only putting postType because sometimes gifs don't play, because
// your css auto-resizes them, so the animation has to stop
function getImgurPostType(post){
    var postType = "";
    if (post.type && post.type.split("/")[1] == "gif"){
        postType = ".gif";
    }
    return postType;
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
    $("#newpostbutton").click(function(){newPost(); return false;});
    $("#reloadbutton").click(function(){mkrandomposts(); return false;});

    $(".randompost, .relatedpost").on("click", editPost);

    $("#newPostSubmit").on("click", submitNewPost);
    $("#editPostSubmit").on("click", submitEditPost);
    $("#editPostCancel").on("click", cancelEditPost);

    // fixing bug making register box closing when clicking on input
    $('#signupform').click(function (e) {e.stopPropagation();});

    $("#logout").click(function(){logout(); return false;});
    $("#loginbutton").click(function(){loginbutton(); return false;});
    $("#signupbtn").click(function(){signup(); return false;});

    // $("#settingsbutton").click(function(){settingsbutton()});
    $("#aboutbutton").click(function(){aboutbutton();});

    $(".instagram").on("click", openInstagramSrc);
}

function cancelEditPost(){
    $("#editPostForm").hide();
    // clearNewPostForm();
    $("#newPostForm").show();
    window.location = "#";
}

// todo. validate inputs and user feedback
function signup(){
    var username = $("#signupusername").val();
    var password = $("#signuppassword").val();
    var repassword = $("#signuprepassword").val();
    var token = getCSRF("signupcsrf"); // getCookie('csrftoken');
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
                isLoggedIn = json.isloggedin;
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
}

function logout(){
    $.ajax({
        url: HOMEPAGE + "logout",
        type: "GET",
        success: function(json){
            isLoggedIn = json.isloggedin;
            showhideloginbar(json.isloggedin);
        }
    });
}

function loginout(){
    $.ajax({
        url: HOMEPAGE + "isloggedin",
        type: "GET",
        success: function(json){
            isLoggedIn = json.isloggedin;
            showhideloginbar(json.isloggedin);
            getrelatedposts();
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
        $("#newpostbutton").show();
        $("#reloadbutton").show();
    } else {
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
            isLoggedIn = json.isloggedin;
            showhideloginbar(json.isloggedin);
            clearrandomposts();
            mkrandomposts(true);
            getrelatedposts();
        }
    });
}

function initRelatedPicDivs(){
    // magicallyCalculateBootstrapDimensions();
    var stuff = "<div class='instaRow'>";
    for (var i = 0; i < INSTAROW_SIZE; i++){
        stuff += "<div class='instaCell'>" +
            "<div class='instaBox'>" +
            '<img src="" data-src="" alt="" class="instagram" rel="tooltip">' +
            "<div class='imgurPostType'></div>" +
            "</div>" +
            "<div class='instaComment'></div>" +
            "</div>"
    }
    stuff += "</div>";
    $("#relatedpics").html(stuff);
}

// function magicallyCalculateBootstrapDimensions(){
//     var size = $(window).width() / FLICKR_WIDTH;
//     var divisors = [1, 2, 3, 4, 6, 12];
//     for (var i = 0; i < divisors.length; i++){
//         if (size >= divisors[i]){
//             INSTAROW_SIZE = divisors[i];
//         }
//     }
// }

function initPostDivs(){
    var rp = $("#randomposts");
    var stuff = "";
    for (var i = 0; i < POSTCOUNT / POSTSPERCOL; i++){
        stuff += "<div class='row-fluid myrandomrow'>";
        for (var j = 0; j < POSTSPERCOL; j++){
            stuff += "<div class='span" + SPANWIDTH + "'>" +
                "<a href='#' class='randompost'>" +
                "<span class='posttitle'></span> " + // putting spaces after spans let them fill over to new lines
                "<span class='hiddentitle hide tex2jax_ignore'></span> " + // putting spaces after spans let them fill over to new lines
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
function inputEnterKeypress(){
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
            $("#reloadbutton").click();
            break;
        case KEYENTER:
            newPost();
            break;
        }
    }
}

function mkrandomposts(firstTime){
    $.getJSON(HOMEPAGE + "randomposts", {
        postcount: POSTCOUNT
    }, function(json){
        loadposts(json);
        if (!firstTime){
            window.location = "#randomposts";
        }
    });
}

function loadposts(json){
    $.each(json.posts, function(i, post){
        var rp = displaypanels.eq(i);
        rp.attr("id", post.id);
        rp.find(".posttitle").html(post.title);
        rp.find(".hiddentitle").html(post.title);
        rp.find(".postbody").html(post.body);
        rp.find(".hiddenbody").html(post.body);
        rp.find(".postdate").html(parsedatetime(post.created));
    });
    rejax();
}

function loadrelatedposts(json){
    $.each(json.posts, function(i, post){
        relatedPost.attr("id", post.id);
        relatedPost.find(".posttitle").html(post.title);
        relatedPost.find(".hiddentitle").html(post.title);
        relatedPost.find(".postbody").html(post.body);
        relatedPost.find(".hiddenbody").html(post.body);
        relatedPost.find(".postdate").html(parsedatetime(post.created));
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
    populateEditPost($(this));
    $("#newPostForm").hide();
    $("#editPostForm").show();
    $("#editPostTitle").focus();
}

function populateEditPost(post){
    var title = post.find(".hiddentitle").unhighlight().html();
    var body = post.find(".hiddenbody").unhighlight().html();
    $("#editPostID").val(post.attr("id"));
    var postTitle = $("#editPostTitle").val(title);
    var postBody = $("#editPostBody").val(body);
    if (title != ""){
        postTitle.removeClass("postInputGrey").addClass("postInputBlack");
    } else {
        postTitle.removeClass("postInputBlack").addClass("postInputGrey");
    }
    if (body != ""){
        postBody.removeClass("postInputGrey").addClass("postInputBlack");
    } else {
        postBody.removeClass("postInputBlack").addClass("postInputGrey");
    }
}

function submitEditPost(){
    $.ajax({
        url: HOMEPAGE + "editpost",
        type: "POST",
        data: {
            id: $("#editPostID").val(),
            title: $("#editPostTitle").val(),
            body: $("#editPostBody").val(),
            subject: "",
            csrfmiddlewaretoken: getCSRF("editPostCSRF"),
        },
        success: function(json){ // todo. check json status
            showFeedback("SAVED", json.title, json.id);
            showSubmittedPost(json);
        },
        // complete: function(){
        // }
    });
    cancelEditPost();
    window.location = "#";
}

function clearEditPostForm(){
    $("#editPostTitle").val("");
    $("#editPostBody").val("");
}

function showSubmittedPost(post){
    relatedPost.attr("id", post.id);
    relatedPost.find(".posttitle").html(post.title);
    relatedPost.find(".hiddentitle").html(post.title);
    relatedPost.find(".postbody").html(post.body).addClass("recentbody");
    relatedPost.find(".hiddenbody").html(post.body);
    relatedPost.find(".postdate").html(parsedatetime(post.created));

    rejax();
}

function changeMode(newMode){
    moode = newMode;
}

function newPost(){
    $("#editPostForm").hide();
    // clearNewPostForm();
    $("#newPostForm").show();
    $("#newPostTitle").focus();
    window.location = "#";
}

function submitNewPost(){
    $.ajax({
        url: HOMEPAGE + "createpost",
        type: "POST",
        data: {
            title: $("#newPostTitle").val(),
            body: $("#newPostBody").val(),
            subject: "",
            csrfmiddlewaretoken: getCSRF("newPostCSRF"),
        },
        success: function(json){
            showFeedback("CREATED", json.title, json.id); // todo. check response status
            showSubmittedPost(json);
        },
        // complete: function(){
        // }
    });
    clearNewPostForm();
    $("*:focus").blur();        // onfocusing submit button, cause it glows
    window.location = "#";
}

function clearNewPostForm(){
    $("#newPostTitle").val("").removeClass("postInputBlack").addClass("postInputGrey");
    $("#newPostBody").val("").removeClass("postInputBlack").addClass("postInputGrey");
}

function showFeedback(signal, msg, hrefID){
    feedback.attr("href", "#" + (hrefID ? hrefID : ""));
    feedbackSignal.html(signal);
    feedbackMsg.html(msg);
}

function getCSRF(id){
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

function insertMathBrackets(e, editor){
    var key = e.which || e.keyCode;
    if (e.ctrlKey && key === KEY_M){
        editor.insertAtCaret("\\(\\)");
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