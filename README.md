# gitlab-swimlanes
GitLab Swimlanes UserScript

#### Description
Userscript to display swimlanes in Gitlab issues board.

#### Usage
  - Append "--" or "-Category name-" to the label descriptions you want to use as swimlanes.
  - Alter the script to replace GITLAB_URL by your Gitlab server url.
  - Load the script with Tampermonkey: http://tampermonkey.net/ .
  - Click the Swimlanes button beside the search fields to toggle the swimlanes display.

#### Notes
  - All interactions are disabled in the swimlanes, but still available in the main board.
  - The swimlanes_* global variables can be altered to customise the display.
