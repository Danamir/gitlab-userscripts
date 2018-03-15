// ==UserScript==
// @name            GitLab board descriptions
// @namespace       https://github.com/Danamir/gitlab-userscripts/
// @version         0.1
// @description     Display issues description in GiLab issues board
// @author          Danamir
// @match           http*://*/*/boards
// @match           http*://*/*/boards?*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
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
// configuration
var description_font_size = ".90em";
var description_height = "135px";
var description_markdown_quick_render = true;

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
 * @param iids The issues ids. (default = all visible ids)
 */
function refresh_descriptions(iids) {
    if (!project_id) {
        console.log("Project id not found.");
        return;
    }

    if (!iids) {
        iids = get_issue_ids();
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

            $('.btn-display-board-descriptions').removeClass("disabled");
            display_descriptions(issues);
        }
    });
}

/**
 * Display descriptions in board(s).
 * @param issues
 */
function display_descriptions(issues) {
    $('.boards-list').each(function () {
        var board = $(this);

        $('.card', board).each(function () {
            var card = $(this);
            var header = $('.card-header', card);
            var id = $('.card-number', header).text().trim().replace(/^#/, '');

            if(issues[id] && issues[id]['description']) {
                var description = issues[id]['description'].trim();

                if ($('.card-body', card).length === 0) {
                    header.after('<div class="card-body"><div class="card-description"></div></div>');
                }

                if (description_markdown_quick_render) {
                    description = markdown_quick_render(description);
                }

                $('.card-description', card).html(description);
            }
        });
    });

    $('.card-description').on("click", function (e) {
        var card = $(this);

        setTimeout(function () {
            var block_description = $('.js-issuable-update .block.description');
            if (block_description.length === 0) {
                block_description = '<div class="block description"><div class="title">Description</div><div class="value">' + card.html() + '</div></div>';

                var block_subscriptions = $('.js-issuable-update .block.subscriptions');
                if (block_subscriptions.length >= 0) {
                    block_subscriptions.before(block_description);
                } else {
                    $('.js-issuable-update div').last().after(block_description);
                }
            }

            $('.value', block_description).html(card.html());
        }, 10);
    });

    show_descriptions();
}

/**
 * Show descriptions.
 */
function show_descriptions() {
    $('.card-description').each(function () {
       $(this).css({display: ""});
    });
}

/**
 * Display descriptions.
 */
function hide_descriptions() {
    $('.card-description').each(function () {
       $(this).css({display: "none"});
    });
}

/**
 * Minimal markdown renderer.
 * @param text
 * @return {string}
 */
function markdown_quick_render(text) {
    if (!text) {
        return text;
    }

    var markdown = text;
    markdown = markdown.replace('<', '&lt;');
    markdown = markdown.replace('>', '&gt;');
    markdown = markdown.replace(/```(\S*)\n([\s\S]*)\n\s*```/gm, '<pre class="code code-$1">$2</pre>');
    markdown = markdown.replace(/`(.*)`/g, '<code class="code">$1</code>');
    // markdown = markdown.replace(/(#+)(.*)/g, '$1<strong>$2</strong>');
    markdown = markdown.replace(/##/g, '▪▪');
    markdown = markdown.replace(/([\s▪])#/g, '$1▪');
    markdown = markdown.replace(/ {2,10}[*\-]/g, '&nbsp;&nbsp;&nbsp;&nbsp;▫');
    markdown = markdown.replace(/ [*\-]/g, '&nbsp;•');
    markdown = markdown.replace(/\B[*\-]/g, '•');
    markdown = markdown.replace(/((&nbsp;)?[▫•]?\s*)(https?:\/\/\S+)/g, '<span style="white-space: nowrap; overflow-y: hidden;">$1$2 $3</span>');

    return markdown;
}

$(document).ready(function() {
    console.log('Loading GitLab board descriptions...');

    setTimeout(function () {
        project_id = get_project_id();

        // styles
        $('head').append('\
        <style type="text/css">\
            .card-body {\
                position: relative;\
            }\
            .card-description {\
                font-size: '+description_font_size+';\
                color: #909090;\
                white-space: pre-wrap;\
                overflow: hidden;\
                max-height: '+description_height+';\
                \
            }\
            .card-description:after {\
                content:"";\
                position:absolute;\
                bottom:0;\
                left:0;\
                top:calc('+description_height+' - 20px);\
                width:100%;\
                background: linear-gradient(rgba(255,255,255,0), #FFF);\
            }\
            .card-description code, .block.description code {\
                color: inherit;\
                background: #f0f0f0;\
                padding: 1px 2px;\
            }\
            .card-description pre.code, .block.description pre.code {\
                color: inherit;\
                padding: 1px 2px;\
                border-color: #f4f4f4;\
            }\
            .block.description .value {\
                font-size: '+description_font_size+';\
                color: #707070;\
                white-space: pre-wrap;\
            }\
        </style>');

        // descriptions button
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

        // first load
        refresh_descriptions();

        $('.btn-display-board-descriptions').on("click", function (e) {
            if (e && e.ctrlKey) {
                // always toggle
                btn.attr("aria-pressed", "false");
                btn.removeClass('active');
            }

            if(btn.attr("aria-pressed") === "false") {
                // $('.btn-display-board-descriptions').addClass("disabled");
                refresh_descriptions();
            } else {
                hide_descriptions();
            }
        });
    }, 500);
});
