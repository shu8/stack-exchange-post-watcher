(function () {
  window.SEPostWatcher = window.SEPostWatcher || {};

  // Maintain a cache of watchedPosts to avoid lots of calls to storage API
  SEPostWatcher.watchedPosts = SEPostWatcher.watchedPosts || undefined;
  SEPostWatcher.apiSites = SEPostWatcher.apiSites || undefined;
  SEPostWatcher.accessToken = SEPostWatcher.accessToken || undefined;

  browser.storage.sync.get(['watchedPosts', 'accessToken']).then(items => {
    if ('watchedPosts' in items) {
      SEPostWatcher.watchedPosts = items.watchedPosts;
    } else {
      SEPostWatcher.watchedPosts = [];
      browser.storage.sync.set({ watchedPosts: SEPostWatcher.watchedPosts });
    }

    if ('accessToken' in items) {
      SEPostWatcher.accessToken = items.accessToken;
    } else {
      SEPostWatcher.accessToken = null;
      browser.storage.sync.set({ accessToken: SEPostWatcher.accessToken });
    }
  });

  // Use local for API site data as it is very large
  browser.storage.local.get(['apiSites']).then(async items => {
    // Reload site data when it is 2 days old
    if ('apiSites' in items && items.apiSites.lastChecked > new Date().getTime() - 60 * 60 * 24 * 2 * 1000) {
      SEPostWatcher.apiSites = items.apiSites.sites;
    } else {
      console.log('[background.js] Refreshing site data from API');
      const data = await SEPostWatcher.API.get('sites', { filter: '!)Qp_mmlbRWg6RSqskH1n7)Qa', pageSize: 10000 });
      SEPostWatcher.apiSites = data;
      browser.storage.local.set({
        apiSites: {
          lastChecked: new Date().getTime(),
          sites: data,
        },
      });
    }
  });

  browser.storage.onChanged.addListener(function (changes, areaName) {
    console.log(`[background.js] Storage changes ${areaName}`, changes);
    if (areaName === 'sync') {
      if ('watchedPosts' in changes) SEPostWatcher.watchedPosts = changes.watchedPosts.newValue;
      if ('accessToken' in changes) SEPostWatcher.accessToken = changes.accessToken.newValue;
    } else if (areaName === 'local') {
      if ('apiSites' in changes) SEPostWatcher.apiSites = changes.apiSites.newValue.sites;
    }
  });

  browser.runtime.onInstalled.addListener(function () {
    browser.notifications.create('getAccessToken', {
      type: 'basic',
      iconUrl: '../../icons/logo-16.png',
      title: 'Stack Exchange Post Watcher access token',
      message: 'Please click here to get an access token for the extension! This is required before you can use it.',
    });

    browser.notifications.onClicked.addListener(async function (notificationId) {
      if (notificationId !== 'getAccessToken') return;

      const accessToken = await SEPostWatcher.helpers.requestAccessToken();
      if (accessToken) {
        browser.storage.sync.set({ accessToken });
        SEPostWatcher.accessToken = accessToken;
      }
    });
  });

  // Show Page Action on SE sites only
  browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url && SEPostWatcher.HOSTNAMES.find(h => tab.url.match(h))) {
      browser.pageAction.show(tabId);
    } else {
      browser.pageAction.hide(tabId);
    }
  });

  browser.alarms.get('checkPostsForUpdates').then(alarm => {
    if (alarm) return;
    browser.alarms.create('checkPostsForUpdates', {
      periodInMinutes: 10,
      delayInMinutes: 10,
    });
  });

  browser.alarms.onAlarm.addListener(async function (alarm) {
    console.log('[background.js] Alarm fired', alarm);
    if (alarm.name !== 'checkPostsForUpdates') return;

    await SEPostWatcher.detectPostChanges(SEPostWatcher.watchedPosts);
    console.log('[background.js] Post-detectChanges watchedPosts', SEPostWatcher.watchedPosts);
    browser.storage.sync.set({ watchedPosts: SEPostWatcher.watchedPosts });

    // Display correct page action icon (unread changes or not)
    SEPostWatcher.helpers.updatePageActionIcon();
  });

  browser.tabs.onActivated.addListener(function () {
    // Display correct page action icon (unread changes or not)
    SEPostWatcher.helpers.updatePageActionIcon();
  });

  browser.runtime.onMessage.addListener(async function (request) {
    if (request.action === 'WATCH_POST') {
      const post = new SEPostWatcher.WatchedPost(request.postId, request.postType, request.sitename, request.title, request.watchOptions);
      console.log('[background.js] Watching post', post);
      SEPostWatcher.watchedPosts.push(post);
      await SEPostWatcher.getCurrentDetailsForPost(post);
      browser.storage.sync.set({ watchedPosts: SEPostWatcher.watchedPosts });

    } else if (request.action === 'GET_WATCHED_POSTS') {
      console.log('[background.js] Returning watched posts', SEPostWatcher.watchedPosts);
      return new Promise(resolve => resolve(SEPostWatcher.watchedPosts));

    } else if (request.action === 'STOP_WATCHING_POST') {
      console.log('[background.js] Removing post from watched posts', request.postId, request.sitename);
      const index = SEPostWatcher.watchedPosts.findIndex(p => p.postId === request.postId && p.sitename === request.sitename);
      if (index !== -1) SEPostWatcher.watchedPosts.splice(index, 1);
      browser.storage.sync.set({ watchedPosts: SEPostWatcher.watchedPosts });

    } else if (request.action === 'MARK_POST_AS_READ') {
      console.log('[background.js] Marking post as read', request.postId, request.sitename);
      SEPostWatcher.watchedPosts.find(p => p.postId === request.postId && p.sitename === request.sitename).unreadChanges = [];
      browser.storage.sync.set({ watchedPosts: SEPostWatcher.watchedPosts });

    } else if (request.action === 'GET_SITE_DATA') {
      console.log('[background.js] Returning site data', SEPostWatcher.apiSites);
      return new Promise(resolve => resolve(SEPostWatcher.apiSites));

    } else if (request.action === 'AUTHORISE_EXTENSION') {
      console.log('[background.js] Requesting access token');
      const accessToken = await SEPostWatcher.helpers.requestAccessToken();
      if (accessToken) {
        browser.storage.sync.set({ accessToken });
        SEPostWatcher.accessToken = accessToken;
        return new Promise(resolve => resolve(SEPostWatcher.accessToken));
      } else {
        return new Promise(resolve => resolve(false));
      }

    } else if (request.action === 'GET_ACCESS_TOKEN') {
      console.log('[background.js] Returning access token', SEPostWatcher.accessToken);
      return new Promise(resolve => resolve(SEPostWatcher.accessToken));
    }

    return new Promise(resolve => resolve(true));
  });
})();
