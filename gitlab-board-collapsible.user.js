// ==UserScript==
// @name            GitLab board collapsible lists
// @namespace       https://github.com/Danamir/gitlab-userscripts/
// @version         0.3.1
// @description     Make all board issues lists collapsible. Deprecated, functionality now available without userscript.
// @author          Danamir
// @match           http*://*/*/boards
// @match           http*://*/*/boards?*
// @match           http*://*/*/boards/*
// @require         https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

/**
 * Userscript to make all board issues lists collapsible.
 * Deprecated: This functionality is now directly available in GitLab CE.
 *
 * Usage:
 *   - Modifier key + Mouse over the list title to collapse/expand.
 * 
 * Notes:
 *   - Ctrl, Shift or Alt can be used as modifier key.
 *
 * Issues:
 *   - The draggable board state prevent the simple click from functionning.
 * 
 */
// configuration


// local variables
var project_id;
var collapsed_lists = [];

/**
 * Get URL parameters.
 * @param param Parameter name.
 * @returns {*}
 */
function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace(
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;
	}
	return vars;
}

/**
 * Set a cookie.
 * @param cname {string}
 * @param cvalue {string}
 * @param exdays {int}
 */
function setCookie(cname, cvalue, exdays) {
    if (exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    } else {
        document.cookie = cname + "=" + cvalue + ";path=/";
    }
}

/**
 * Get a cookie value.
 * @param cname {string}
 * @return {string}
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * Get project id from the page.
 * @returns {*|jQuery}
 */
function get_project_id() {
    return $('#search_project_id').prop('value');
}

/**
 * Alter the lists to add the collapse button.
 */
function alter_lists() {
    $('.board').each(function () {
        var list = $(this);

        if (list.hasClass("is-expandable")) {
            return true; // continue
        }

        list.addClass("is-expandable");

        // get title
        var board_title = $('.board-title-text', list);
        board_title.addClass("board-title-expandable");

        var title = board_title.text().trim();
        // console.log(title);

        // add arrow icon
        var arrow = '<i aria-hidden="true" class="fa fa-fw board-title-expandable-toggle fa-caret-down expandable-arrow" title="'+title+'"></i>';
        board_title.before(arrow);

        // toggle click actions
        $('.board-title-expandable-toggle', list).on("click", function (e) {
            var title = $(this).attr("title");
            toggle_collapsed(title);
        });

        board_title.on("click", function (e) {
            var title = $(this).text().trim();
            toggle_collapsed(title);
        });
        
        // toggle hover actions
        $('.board-title-expandable-toggle', list).on("mouseenter", function (e) {
            if (e.ctrlKey || e.shiftKey || e.altKey) {
                var title = $(this).attr("title");
                toggle_collapsed(title);
            }
        });
        
        board_title.on("mouseenter", function (e) {
            if (e.ctrlKey || e.shiftKey || e.altKey) {
                var title = $(this).text().trim();
                toggle_collapsed(title);
            }
        });

        // auto-collapse previously collapsed lists
        if (collapsed_lists.includes(title)) {
            toggle_collapsed(title)
        }
    });
}

/**
 * Toggle the collapsed state of a list.
 * @param title {string}
 */
function toggle_collapsed(title) {
    $('.board').each(function () {
        var list = $(this);

        // get title
        var board_title = $('.board-title-text', list);
        var list_title = board_title.text().trim();

        // check if collapsible
        if (!board_title.hasClass("board-title-expandable")) {
            return true; // continue
        }

        if (title !== list_title) {
            return true; // continue
        }

        // toggle collapsed state
        list.toggleClass("is-collapsed");
        $('header', list).toggleClass('position-relative position-absolute position-top-0 position-left-0 w-100 h-100');
        $('header h3', list).toggleClass('p-0 border-bottom-0 justify-content-center');
        $('button', list).toggleClass('d-none');
        $('.issue-count-badge', list).toggleClass('d-none');
        $('.board-list-count', list).toggleClass('d-none');
        $('.board-list-component', list).toggleClass('d-flex flex-column d-none');
        $('.board-title-expandable-toggle', list).toggleClass('fa-caret-down fa-caret-right');

        // update collapsed lists cookie
        if (list.hasClass("is-collapsed")) {
            // console.log(title+" collapsed");
            if (!collapsed_lists.includes(title)) {
                collapsed_lists.push(title);
            }
        } else {
            // console.log(title+" uncollapsed");
            var idx = collapsed_lists.indexOf(title);
            if (idx !== -1) {
                collapsed_lists.splice(idx, 1);
            }
        }

        setCookie("collapsed_lists_"+project_id, collapsed_lists);
    });
}

$(document).ready(function() {
    console.log('Loading GitLab board collapsible lists...');
    
    project_id = get_project_id();

    // check collapsed lists cookie
    if (getCookie("collapsed_lists_"+project_id)) {
        collapsed_lists = getCookie("collapsed_lists_"+project_id).split(",");
    }

    setTimeout(function () {
        // styles
        $('head').append('\
        <style type="text/css">\
            .board-title-expandable, .expandable-arrow {\
                cursor: pointer;\
            }\
            \
            .board.is-collapsed .board-title>span.board-title-expandable {\
                width: unset;\
                transform: rotate(90deg) translate(calc(50% + 15px), 0);\
                padding-bottom: 3px;\
            }\
        </style>');

        // first load
        alter_lists();

    }, 1000);
});
