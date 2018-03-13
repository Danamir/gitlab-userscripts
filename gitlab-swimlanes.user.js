// ==UserScript==
// @name            Gitlab swimlanes
// @namespace       https://github.com/Danamir/gitlab-swimlanes/
// @version         0.2
// @description     Add simlanes to Gilab issues board
// @author          Danamir
// @match           http*://*/*/boards
// @match           http*://*/*/boards?*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

/**
 * Userscript to display swimlanes in Gitlab issues board.
 *
 * Usage:
 *   - Append "--" or "-Category name-" to the label descriptions you want to use as swimlanes.
 *   - Alter the script to replace GITLAB_URL by your Gitlab server url.
 *   - Load the script with Tampermonkey: http://tampermonkey.net/ .
 *   - Click the Swimlanes button beside the search fields to toggle the swimlanes display :
 *      - Single click group by category labels.
 *      - Shift click group by assigned users.
 *      - Ctrl click group by all non-category labels. (Warning: Can be slow).
 *
 * Notes:
 *   - All interactions are disabled in the swimlanes, but still available in the main board.
 *   - The swimlanes_* global variables can be altered to customise the display.
 */
// configuration
var swimlane_min_height = 200;
var swimlane_max_height = 640; // -1 for unlimited height
var swimlane_tag = 'h4';
var swimlane_font_size = '16px';
var swimlane_animate = true;
var swimlane_types = ["label", "user", "all"];  // behaviour of click, shift + click, ctrl + click

// local variables
var hidden_lanes = [];
var swimlane_type = "";

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
 * Add swimlanes above the main board.
 * @param swimlanes The swimlanes objects.
 */
function update_boards(swimlanes) {
    var keys = $.map(swimlanes, function(v, k) {return k});
    keys = keys.sort().reverse();

    $.each(keys, function () {
        var id = '#'+swimlane_id(this);
        var swimlane = swimlanes[this];
        var current_swimlane = $(id);

        if (current_swimlane.length > 0) {
            current_swimlane.replaceWith(swimlane);
        } else {
            $('#board-app').children().first().after(swimlane);
        }

        hide_swimlane(id);

        if (!$.inArray(id, hidden_lanes) > -1) {
            show_swimlane(id, swimlane_animate);
        }

        $(id+'_title').on("click", function () {
            if($(id+'_title i').hasClass('fa-caret-down')) {
                hide_swimlane(id, swimlane_animate);
            } else {
                show_swimlane(id, swimlane_animate);
            }

        });
    });
}

/**
 * Show a swimlane.
 * @param id The swimlane id.
 * @param animate Use animations.
 */
function show_swimlane(id, animate) {
    $(id+'_title i').removeClass("fa-caret-right");
    $(id+'_title i').addClass("fa-caret-down");
    if (animate) {
        $(id+' ul').show(100);
        $(id+' .sw-inner-board').show(200);
    } else {
        $(id+' .sw-inner-board').show();
    }

    for (var i = hidden_lanes.length - 1; i >= 0; i--) {
        if (hidden_lanes[i] === id) {
            hidden_lanes.splice(i, 1);
        }
    }
}

/**
 * Hide a swimlane.
 * @param id The swimlane id.
 * @param animate Use animations.
 */
function hide_swimlane(id, animate) {
    $(id+'_title i').removeClass("fa-caret-down");
    $(id+'_title i').addClass("fa-caret-right");
    if (animate) {
        $(id+' ul').hide(800);
        $(id+' .sw-inner-board').hide(200);
    } else {
        $(id+' .sw-inner-board').hide();
    }

    hidden_lanes.push(id);
}

/**
 * Get tag id from swimlane title.
 * @param title The swimlane title.
 * @returns {*|string|void}
 */
function swimlane_id(title) {
    return title.replace(/[^A-Za-z]/g, "");
}

/**
 * Check if a swimlane already exists.
 * @param swimlanes The existing swimlanes.
 * @param title The swimlane title.
 * @returns {boolean}
 */
function has_swimlane(swimlanes, title) {
    var keys = $.map(swimlanes, function(v, k) {return k});
    return $.inArray(title, keys) > -1;
}

/**
 * Main button method: display swimlanes.
 */
function display_swimlanes() {
    var main_board;
    main_board = $('#main-list');
    if (main_board.length === 0) {
        main_board = $('.boards-list');
        main_board.prop('id', 'main-list');
    }

    main_board.before('<'+swimlane_tag+' class="board-inner" id="main-list_title" style="font-size: '+swimlane_font_size+'; font-weight: bold; padding: 6px 20px; margin-left: 8px; margin-right: 8px; margin-bottom: -14px;">Main board</'+swimlane_tag+'>');

    var swimlanes = {};

    var list_titles = [];
    $('.board-title-text', main_board).each(function () {
        var text = $(this).text().trim();
        if (text && $.inArray(text, list_titles) === -1) {
            list_titles.push(text);
        }
    });

    do {
        var current_board = main_board.clone();
        var current_swimlane_title = undefined;
        var swimlane_item = undefined;

        $('.card', current_board).each(function () {
            var card = $(this);
            var keep_card = false;

            if (swimlane_type === "label") {
                $('.card-footer button', card).each(function () {
                    var item = $(this);
                    var title = "";
                    if(item.prop("title")) {
                        title = item.prop("title");
                    } else if (item.attr("data-original-title")) {
                        title = item.attr("data-original-title");
                    }

                    if (title) {
                        var match = /^(.*)\s*-(.*)-$/.exec(title);

                        if (!match) {
                            // not a category label
                            return true; // continue
                        } else if (current_swimlane_title && title !== current_swimlane_title) {
                            // not current swimlane
                            return true; // continue
                        } else if (has_swimlane(swimlanes, title)) {
                            // swimlane already exists
                            return true; // continue
                        }

                        current_swimlane_title = title;
                        swimlane_item = item;
                        keep_card = true;
                    }
                });
            } else if (swimlane_type === "all") {
                $('.card-footer button', card).each(function () {
                    var item = $(this);
                    var title = item.text().trim();

                    var tooltip = "";
                    if(item.prop("title")) {
                        tooltip = item.prop("title");
                    } else if (item.attr("data-original-title")) {
                        tooltip = item.attr("data-original-title");
                    }

                    if (title) {
                        var match = /^(.*)\s*-(.*)-$/.exec(tooltip);

                        if (match) {
                            // category label
                            return true; // continue
                        } else if ($.inArray(title, list_titles) > -1) {
                            // already displayed as list
                            return true; // continue
                        } else if (current_swimlane_title && title !== current_swimlane_title) {
                            // not current swimlane
                            return true; // continue
                        } else if (has_swimlane(swimlanes, title)) {
                            // swimlane already exists
                            return true; // continue
                        }

                        current_swimlane_title = title;
                        swimlane_item = item;
                        keep_card = true;
                    }
                });
            } else if (swimlane_type === "user") {
                $('.card-assignee img', card).each(function () {
                    var item = $(this);
                    var title = "";
                    if(item.prop("title")) {
                        title = item.prop("title");
                    } else if (item.attr("data-original-title")) {
                        title = item.attr("data-original-title");
                    }

                    if (title) {
                        var match = /^Assi\S* \S+ (.*)$/.exec(title);

                        if (!match) {
                            // not a swimline title
                            return true; // continue
                        } else if (current_swimlane_title && title !== current_swimlane_title) {
                            // not current swimlane
                            return true; // continue
                        } else if (has_swimlane(swimlanes, title)) {
                            // swimlane already exists
                            return true; // continue
                        }

                        current_swimlane_title = title;
                        swimlane_item = item;
                        keep_card = true;
                    }
                });
            } else {
                console.log("Unknown swimlane type: "+swimlane_type);
            }

            if (!keep_card) {
                card.remove();
                return true; // continue
            }
        });

        // add swimlane
        if (current_swimlane_title) {
            current_board.prop("id", swimlane_id(current_swimlane_title));
            current_board.html('<div class="sw-inner-board">'+current_board.html()+'</div>');

            // update tags
            $('.board-list-count', current_board).remove();
            $('.issue-count-badge', current_board).remove();
            $('.issue-count-badge-count', current_board).remove();
            $('.board-delete', current_board).remove();
            $('.is-expandable', current_board).removeClass('is-expandable');
            $('.user-can-drag', current_board).removeClass('user-can-drag');
            $('.card-footer button', current_board).css({'cursor': 'default'});
            $('ul', current_board).css({'min-height': swimlane_min_height+'px'});
            if(swimlane_max_height > -1) {
                $('ul', current_board).css({'max-height': swimlane_max_height+'px'});
            }
            $('.is-collapsed .board-inner', current_board).css({'min-height': (swimlane_min_height+50)+'px'});
            current_board.css({'height': 'auto', 'overflow': 'auto', 'min-height': '0px', 'padding-top': '0px', 'padding-bottom': '0px'});

            // title
            var title = "";
            var item = "";
            if (swimlane_type === "label") {
                var title = /^(.*)\s*-(.*)-$/.exec(current_swimlane_title);
                title = title[1]+'<span style="font-size: 0.65em; vertical-align: top; font-style: italic;">'+title[2]+'</span>';
            } else if (swimlane_type === "all") {
                title = current_swimlane_title;
            } else if (swimlane_type === "user") {
                var title = /^Assi\S* \S+ (.*)$/.exec(current_swimlane_title);
                title = title[1];
            }

            if (swimlane_item.length > 0) {
                swimlane_item.css({border: "0", outline: "0", position: "absolute", right: "10px"});
                swimlane_item.removeClass("has-tooltip");
                swimlane_item.prop("title", "");
                item = swimlane_item.prop('outerHTML');
            }

            current_board.first().prepend('<'+swimlane_tag+' class="board-inner" id="'+swimlane_id(current_swimlane_title)+'_title" style="cursor: pointer; font-size: '+swimlane_font_size+'; padding: 6px;"><i aria-hidden="true" class="fa fa-fw fa-caret-down"></i>'+title+item+'</'+swimlane_tag+'>');

            swimlanes[current_swimlane_title] = current_board;
        }

    } while (current_swimlane_title);

    update_boards(swimlanes);
}

/**
 * Main button method: remove swimlanes.
 */
function remove_swimlanes() {
    $('.boards-list').each(function () {
        var board = $(this);

        if (board.prop("id") && board.prop("id") !== 'main-list') {
            if (swimlane_animate) {
                $('ul', board).hide(800);
                $('.sw-inner-board', board).hide(200);
                setTimeout(function () {
                    board.remove();
                }, 200);
            } else {
                board.remove();
            }
        }
    });

    $('#main-list_title').remove();
}

$(document).ready(function() {
    console.log('Loading Gitlab swimlanes...');

    setTimeout(function () {
        var btn = $('.board-extra-actions button:first-child').clone();
        btn.addClass("btn-display-swimlanes has-tooltip");
        btn.attr("data-toggle", "button");
        btn.attr("title", "Toggle swimlanes");
        btn.text("Swimlanes");

        $('.board-extra-actions').append(btn);

        $('.btn-display-swimlanes').on("click", function (e) {
            if (e && e.shiftKey && swimlane_types.length > 1) {
                swimlane_type = swimlane_types[1];
            } else if (e && e.ctrlKey && swimlane_types.length > 2) {
                swimlane_type = swimlane_types[2];
            } else {
                swimlane_type = swimlane_types[0];
            }

            if(!btn.attr("aria-pressed") || btn.attr("aria-pressed") === "false") {
                display_swimlanes();
            } else {
                remove_swimlanes();
            }
        });

        $('#filtered-search-boards').on("click", function () {
            btn.removeClass("active");
            btn.attr("aria-pressed", "false");
            remove_swimlanes();
        })
    }, 100);
});
