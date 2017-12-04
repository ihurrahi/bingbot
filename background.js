BASE_URL = "https://www.bing.com/search?q=";
MOBILE_UA = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Mobile Safari/537.36";
DESKTOP_SEARCHES = 30;
MOBILE_SEARCHES = 20;

var tabs = {};
var updated = {};

function getSearchString() {
  // Random strings to search for
  return Math.random().toString(36).substring(8);
}

function getTimeout() {
  // Use random timeouts between 1-2 seconds for mobile search to properly take effect
  return (Math.random() * 1000) + 1000
}

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  if (tabs[details.tabId] == "mobile") {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = MOBILE_UA;
        break;
      }
    }
  }
  return {requestHeaders: details.requestHeaders};
},
{urls: ["*://www.bing.com/*"]},
["blocking", "requestHeaders"]
);

chrome.browserAction.onClicked.addListener(function(tab) {
  function loop(desktopSearches, mobileSearches) {
    if (desktopSearches <= 0 && mobileSearches <= 0) {
      return;
    }

    setTimeout(function() {
      chrome.tabs.create({active: false}, function(newtab) {
        type = desktopSearches > 0 ? "desktop" : "mobile";
        tabs[newtab.id] = type;
        updated[newtab.id] = false;
        setTimeout(function() {
          searchString = getSearchString();
          url = BASE_URL + searchString;
          chrome.tabs.update(newtab.id, {url: url}, function() {
            updated[newtab.id] = true;
          });
        }, getTimeout());
      });

      if (desktopSearches > 0) {
        loop(desktopSearches - 1, mobileSearches);
      } else if (mobileSearches > 0) {
        loop(desktopSearches, mobileSearches - 1);
      }
    }, getTimeout());
  }
  loop(DESKTOP_SEARCHES, MOBILE_SEARCHES);
});

chrome.tabs.onUpdated.addListener(function(tabId, info) {
  if (tabs.hasOwnProperty(tabId) && updated.hasOwnProperty(tabId) && updated[tabId] == true && info.status == "complete") {
    setTimeout(function() {
      chrome.tabs.remove(tabId);
      delete tabs[tabId];
      delete updated[tabId];
    }, getTimeout());
  }
});

