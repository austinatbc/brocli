/**
 * config.js -- Dynamic extension or configuration variables and objected defined and initialized here
 */

var storageHelper = (function(){
    
    var settingKeys = [
        "executeFromAddressbar",
        "defaultSearchUrl",
        "brocliCommandFolderId"
    ];

    var settings = [];
    
    var loadSettings = function (callback) {
        var s;
        settingKeys.forEach(function(el){
            chrome.storage.local.get(el, function(items){
                if (items[el]) {
                    settings.push({el: items[el]});
                    if (typeof callback == "function")
                        callback({key: el, value: items[el]})
                } else {
                    settings.push({el: undefined});
                } 
            });
        });
    }

    var onSettingLoaded = function (settingObject) {
        var key = settingObject.key;
        var val = settingObject.value;
        switch(key)
        {
            case "defaultSearchUrl":
                var defaultSearch = new URL(val);
                settings.push({defaultSearchPath: defaultSearch.origin + defaultSearch.pathname});
                settings.push({defaultSearchUrl: defaultSearch.href});
                settings.push({searchParam:  getParams(defaultSearch.href)['%s']});
                break;
        }
    }

    var getSetting = function(key) {
        return settings[key];
    }
    
    return {
        loadSettings: loadSettings,
        getSetting: getSetting
    }

})();

storageHelper.loadSettings();
chrome.omnibox.setDefaultSuggestion({description: "<url><match>Welcome to Brocli!</match></url><dim> - Enter <match>-h</match> to go to docs. Enter <match>-cmds</match> to see a list of commands. Enter <match>-k</match> to set keyboard shortcuts.</dim>"});

// for getting website field value
var zdDomain = 'https://americommerce.zendesk.com';

// Extension Specific Stuff
var extensionId = chrome.runtime.id;
var outputPageUrl = "chrome-extension://"+ extensionId +"/output.html";



// links and folders in this folder used to create custom bookmark commands
var defaultCommandFolder = "BrocliCommands";
var brocliCommandFolderId;
var commandNode;


// Bookmark Command Folder Helpers
function findSetCommandFolderId (folderTitle, callback) {
    chrome.bookmarks.search(folderTitle, function(res){
        if (res[0].id)
        {
            chrome.storage.local.set({'brocliCommandFolderId': res[0].id}, function() {
                console.log("brocli: command folder found. Set to " + res[0].title + " ID " + res[0].id);
                if (typeof callback === "function")
                    callback(res[0].id);
            });
        } else {
            console.log("brocli: command folder not set. Could not find folder with name " + folderTitle);
        }

    });
}

function getCommandNode (folderTitle, callback) {
    chrome.storage.local.get('brocliCommandFolderId', function (items) {
        if (!items.brocliCommandFolderId) {
            console.log("brocli: command folder not in storage. Searching for folder named " + folderTitle + "...");
            findSetCommandFolderId(folderTitle, callback);
        }
        else {
            if (typeof callback === "function")
                callback(items.brocliCommandFolderId);
        }
    });
}

function getBookmarkCommandUrl (commands, index, node) {
    if (node && node.url) {
        console.log("brocli: getBookmarkCommandUrl - " + node.url);
        return node.url;
    }
    if (node && commands && index >= 0) {
        var child = node.children.find(function(element){
            // returns element that matches to child var. Doesn't return this method.
            return element.title.split(" ")[0].toLowerCase() == commands[index].toLowerCase();
        });
        return getBookmarkCommandUrl(commands, index+1, child);
    }
    else {
        console.log("brocli: getBookmarkCommandUrl - No URL Found");
    }
}

function refreshCommandNode () {
    getCommandNode(defaultCommandFolder, function(id){
        brocliCommandFolderId = id;
        chrome.bookmarks.getSubTree(brocliCommandFolderId, function(items){
            commandNode = items[0];
        });
    });
}

refreshCommandNode();