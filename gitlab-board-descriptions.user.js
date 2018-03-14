// ==UserScript==
// @name            GitLab board descriptions
// @namespace       https://github.com/Danamir/gitlab-userscripts/
// @version         0.1
// @description     Display issues description in GiLab issues board
// @author          Danamir
// @match           http*://*/*/boards
// @match           http*://*/*/boards?*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @requireaaaaaa         https://raw.githubusercontent.com/Danamir/gitlab-userscripts/develop/lib/Markdown.Converter.js
// @require         https://cdn.rawgit.com/showdownjs/showdown/master/dist/showdown.min.js
// ==/UserScript==

/**
 * Userscript to display issues description preview in GitLab issues board.
 *
 * Usage:
 *   - Click the descriptions button to toggle the display.
 *
 * Notes:
 *   - Limited to the dislayed issues on first load.
 */

// local variables
var project_id;

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
 * Get project id from the page.
 * @returns {*|jQuery}
 */
function get_project_id() {
    return $('#search_project_id').prop('value');
}

/**
 * Get all displayed issues ids.
 * @param board The board to scan. (default = main board)
 * @returns {Array}
 */
function get_issue_ids(board) {
    if (!board || board.length === 0) {
        board = $('#main-list'); // gitlab-swimlanes compatibility
        if (board.length === 0) {
            board = $('.boards-list');
        }
    }

    var iids = [];
    $('.card-number', board).each(function () {
        var id = $(this).text().trim().replace(/^#/, '');
        if ($.inArray(id, iids) === -1) {
            iids.push(id);
        }
    });

    return iids;
}

/**
 * Fetch descriptions
 * @param iids The issues ids.
 */
function refresh_descriptions(iids) {
    if (!project_id) {
        console.log("Project id not found.");
        return;
    }

    var issues = {};

    $.ajax({
        url: "/api/v4/projects/"+project_id+"/issues",
        data: {
            per_page: 100,
            iids: iids
        },
        type: "GET",
        success: function (data) {
            $.each(data, function () {
                var issue = this;

                issues[issue['iid']] = issue;
            });

            display_descriptions(issues);
        }
    });
}

/**
 * Display descriptions in board(s).
 * @param issues
 */
function display_descriptions(issues) {
    console.log("issues", issues);
    var converter = new Showdown.Converter();
    var text      = '#hello, markdown!';
    var html      = converter.makeHtml(text);
    console.log(html);

    /*var converter = new Markdown.Converter();
    console.log(converter.makeHtml("**I am bold!**"));*/

    $('.boards-list').each(function () {
        var board = $(this);

        $('.card', board).each(function () {
            var card = $(this);
            var header = $('.card-header', card);
            var id = $('.card-number', header).text().trim().replace(/^#/, '');

            if(issues[id] && issues[id]['description']) {
                var description = issues[id]['description'];
                var body = $('.card-body', card);


                description = converter.makeHtml(description);

                if (body.length === 0) {
                    body = '<div class="card-body">'+description+'</div>';
                    header.after(body);
                }

                if (body.text !== undefined) {
                    body.text(description);
                }
            }
        });
    });
}

$(document).ready(function() {
    console.log('Loading GitLab board descriptions...');

    setTimeout(function () {
        project_id = get_project_id();

        var btn = $('.board-extra-actions button:first-child').clone();
        var tooltip = '<span style="white-space: nowrap">Toggle descriptions</span>';
        tooltip += '<br><span style="font-size: 0.85em; white-space: nowrap">Ctrl : Refresh descriptions</span>';

        btn.addClass("btn-display-board-descriptions has-tooltip active");
        btn.attr("data-toggle", "button");
        btn.attr("data-html", "true");
        btn.attr("title", tooltip);
        btn.attr("aria-pressed", "true");
        btn.text("");
        btn.append('<i class="fa fa-align-left"></i>');

        $('.board-extra-actions').append(btn);

        // per_page = 100

        $('.btn-display-board-descriptions').on("click", function (e) {
            if (e && e.ctrlKey) {
                // always toggle
                btn.attr("aria-pressed", "false");
                btn.removeClass('active');
            }

            if(btn.attr("aria-pressed") === "false") {
                var iids = get_issue_ids();
                refresh_descriptions(iids);
            }
        });
    }, 110);
});
