# gitlab-userscripts
GitLab UserScripts to enhance usability:
  - Issues board Swimlanes
  - Issues board descriptions preview
  
The scripts can be auto-loaded with [Tampermonkey](http://tampermonkey.net/) browser addon, or equivalent, by clicking the *Raw* button on any `.user.js` file in the repository.

### gitlab-swimlanes
##### Description
Userscript to display swimlanes in GitLab issues board.

##### Usage
  - Append "--" or "-Category name-" to the label descriptions you want to use as category.
  - Alter the script to replace GITLAB_URL by your GitLab server url if the default detection doesn't work for your project.
  - Click the Swimlanes button beside the search fields to toggle the swimlanes display :
     - Single click group by category labels.
     - Ctrl click group by assigned users.
     - Shift click group by all non-category labels. (**Warning**: Can be slow).
  - Click a swimlane to toggle the swimlane :
     - Single click to show/hide this swimlane.
     - Ctrl click to show/hide all other swimlanes.

##### Notes
  - All interactions are disabled in the swimlanes, but still available in the main board.

### gitlab-board-descriptions
##### Description
Userscript to display issues description preview in GitLab issues board.

##### Usage
  - Click the descriptions button to toggle the display.

##### Notes
  - Limited to the dislayed issues on first load.
