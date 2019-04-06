(function () {
  window.SEPostWatcher = window.SEPostWatcher || {};

  SEPostWatcher.helpers = {
    newElement: function (type, properties) {
      const el = document.createElement(type);
      if (properties) Object.keys(properties).forEach(p => el[p] = properties[p]);
      return el;
    },

    requestAccessToken: async function () {
      const redirectUrl = 'https://shu8.github.io/stack-exchange-post-watcher/';
      const authTab = await browser.tabs.create({
        url: `${SEPostWatcher.API_AUTH_URL}&redirect_uri=${redirectUrl}`,
      });
      if (!authTab) return new Promise(resolve => resolve(false));

      return new Promise(resolve => {
        browser.tabs.onUpdated.addListener(function (changedTabId, changedTabInfo) {
          detectAccessTokenInUrl(authTab.id, changedTabId, changedTabInfo, resolve);
        });
      });
    },

    updatePageActionIcon: function () {
      browser.tabs.query({ currentWindow: true, active: true, windowType: 'normal' }).then(tabs => {
        // e.g. on extensions page
        if (!tabs || !tabs[0] || !tabs[0].id) return;

        const unreadChanges = !!SEPostWatcher.watchedPosts.find(post => post.unreadChanges.length);
        browser.pageAction.setIcon({
          path: {
            16: `../../icons/logo-16${unreadChanges ? '-badge' : ''}.png`,
            19: `../../icons/logo-19${unreadChanges ? '-badge' : ''}.png`,
            24: `../../icons/logo-24${unreadChanges ? '-badge' : ''}.png`,
            32: `../../icons/logo-32${unreadChanges ? '-badge' : ''}.png`,
            48: `../../icons/logo-48${unreadChanges ? '-badge' : ''}.png`,
            64: `../../icons/logo-64${unreadChanges ? '-badge' : ''}.png`,
            128: `../../icons/logo-128${unreadChanges ? '-badge' : ''}.png`,
          },
          tabId: tabs[0].id,
        });
      });
    },
  };

  SEPostWatcher.WatchedPost = class {
    constructor(postId, postType, sitename, title, watchOptions) {
      this.postId = postId;
      this.postType = postType;
      this.sitename = sitename;
      this.title = title;
      this.watchOptions = watchOptions;
      this.lastChecked = new Date().getTime();
      this.postDetailsAtLastCheck = {};
      this.unreadChanges = [];
    }
  };

  function detectAccessTokenInUrl(authTabId, changedTabId, changedTabInfo, resolve) {
    if (changedTabId !== authTabId) return;
    if (!('url' in changedTabInfo)) return;
    if (!changedTabInfo.url.includes('#access_token=')) return;

    const accessToken = changedTabInfo.url.split('#access_token=')[1];
    // Remove this listener if we find the access token
    browser.tabs.onUpdated.removeListener(detectAccessTokenInUrl);
    resolve(accessToken);
  }
})();
