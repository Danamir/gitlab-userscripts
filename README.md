# gitlab-userscripts
GitLab UserScripts to enhance usability:
  - Issues board Swimlanes
  - Show description in issues board
  
The scripts can be auto-loaded with [Tampermonkey](http://tampermonkey.net/) browser addon, or equivalent.

### gitlab-swimlanes
#### Description
Userscript to display swimlanes in GitLab issues board.

#### Usage
  - Append "--" or "-Category name-" to the label descriptions you want to use as swimlanes.
  - Alter the script to replace GITLAB_URL by your GitLab server url if the default detection doesn't work for your project.
  - Click the Swimlanes button beside the search fields to toggle the swimlanes display.

#### Notes
  - All interactions are disabled in the swimlanes, but still available in the main board.
