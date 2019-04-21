function createSiteContainer(siteData, post) {
  const site = siteData.find(s => s.site_url === `https://${post.sitename}`);
  const siteHeader = document.createElement('summary');
  const siteFavicon = SEPostWatcher.helpers.newElement('div', { className: 'site-header-favicon', innerHTML: '&nbsp;' });
  const siteNameSpan = SEPostWatcher.helpers.newElement('span', { innerText: site.name, className: 'site-header-site-name' });
  const sitePostsList = SEPostWatcher.helpers.newElement('ul', { id: post.sitename });
  const siteContainer = SEPostWatcher.helpers.newElement('details', { open: true, className: 'site-watched-posts-container' });

  siteFavicon.style.backgroundImage = `url(${site.favicon_url})`;
  siteHeader.appendChild(siteFavicon);
  siteHeader.appendChild(siteNameSpan);
  siteContainer.appendChild(siteHeader);
  siteContainer.appendChild(sitePostsList);

  document.getElementById('posts').appendChild(siteContainer);
}

function getDaysSinceAdded(dateAdded) {
  dateAdded = new Date(dateAdded);
  dateAdded.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const daysSinceAdded = Math.floor((now.getTime() - dateAdded.getTime()) / 1000 / 60 / 60 / 24);
  console.log(daysSinceAdded);
  return daysSinceAdded;
}

function showWatchedPosts() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('posts').style.display = 'block';
  browser.runtime.sendMessage({ action: 'GET_SITE_DATA' }).then(siteData => {
    browser.runtime.sendMessage({ action: 'GET_WATCHED_POSTS' }).then(watchedPosts => {
      console.log(watchedPosts);
      if (!watchedPosts || !watchedPosts.length) document.getElementById('posts-header').innerText = 'No Watched Posts';

      watchedPosts.forEach(post => {
        if (!document.getElementById(post.sitename)) createSiteContainer(siteData, post);
        const postLi = SEPostWatcher.helpers.newElement('li', { className: 'watched-post-entry' });
        postLi.setAttribute('data-title', post.title);
        if (post.unreadChanges.length) postLi.classList.add('unread');
        // post.dateAdded was introduced in v1.2.0
        if (post.dateAdded) postLi.setAttribute('data-date-added', post.dateAdded);

        // The '/q' or '/a' slug works for any type of post so don't need to check for postType
        const postTitleAnchor = SEPostWatcher.helpers.newElement('a', {
          href: `https://${post.sitename}/q/${post.postId}`,
          innerText: `${post.postType === 'question' ? 'Q' : 'A'}: ${post.title}`,
          className: 'post-title',
          target: '_blank',
        });

        const watchOptions = post.watchOptions.map(w => SEPostWatcher.WATCH_TYPES[post.postType].find(t => t.name === w));
        const watchOptionSpans = watchOptions.map(w => {
          const optionChanged = post.unreadChanges.find(change => change.name === w.name);
          let title = '';
          if (optionChanged) {
            if (optionChanged.name === 'edit') {
              // For edits, the value is a unix timestamp, so make it readable
              title = `edited ${new Date(optionChanged.new * 1000).toLocaleString()}`;
            } else {
              // If previous was undefined, don't show 'undefined => [new value]', but show 'now [new value]'
              title = optionChanged.previous ? `${optionChanged.previous} => ${optionChanged.new}` : `now ${optionChanged.new}`;
            }
          }
          const className = `${w.name} watch-option ${optionChanged ? 'unread' : ''}`;
          return SEPostWatcher.helpers.newElement('span', { className, innerText: w.description, title });
        });

        const watchedPostOptions = SEPostWatcher.helpers.newElement('div', { className: 'watched-post-watch-options' });
        watchOptionSpans.forEach(span => watchedPostOptions.appendChild(span));

        const titleActionsDiv = SEPostWatcher.helpers.newElement('div', { className: 'watched-post-title-actions' });

        const deleteWatchedPostSpan = SEPostWatcher.helpers.newElement('span', {
          innerText: 'stop watching', className: 'stop-watching-post action',
        });
        deleteWatchedPostSpan.onclick = function () {
          browser.runtime.sendMessage({ action: 'STOP_WATCHING_POST', postId: post.postId, sitename: post.sitename });
          postLi.remove();
        };

        const markAsReadSpan = SEPostWatcher.helpers.newElement('span', {
          innerHTML: 'mark as read', className: 'mark-watched-post-read action',
        });
        markAsReadSpan.onclick = function () {
          browser.runtime.sendMessage({ action: 'MARK_POST_AS_READ', postId: post.postId, sitename: post.sitename });
          postLi.classList.remove('unread');
          watchOptionSpans.forEach(span => span.classList.remove('unread'));
        };

        const unreadDot = SEPostWatcher.helpers.newElement('span', { className: 'unread-dot', innerHTML: '&nbsp;' });
        if (post.dateAdded) {
          const addedDaysAgo = getDaysSinceAdded(post.dateAdded);
          const dateAddedSpan = SEPostWatcher.helpers.newElement('span', {
            className: 'watched-post-added-date',
            // Show 'added today' or 'added x day(s) ago'
            innerText: addedDaysAgo === 0 ? 'added today' : `added ${addedDaysAgo} day${addedDaysAgo === 1 ? '' : 's'} ago`,
            title: new Date(post.dateAdded).toLocaleString(),
          });
          titleActionsDiv.appendChild(dateAddedSpan);
        }
        titleActionsDiv.appendChild(unreadDot);
        titleActionsDiv.appendChild(postTitleAnchor);
        titleActionsDiv.appendChild(markAsReadSpan);
        titleActionsDiv.appendChild(deleteWatchedPostSpan);

        postLi.appendChild(titleActionsDiv);
        postLi.appendChild(watchedPostOptions);

        document.getElementById(post.sitename).appendChild(postLi);
      });
    });
  });
}

function authorise() {
  document.getElementById('auth').style.display = 'block';
  document.getElementById('posts').style.display = 'none';
  document.getElementById('getAccessToken').addEventListener('click', function () {
    browser.runtime.sendMessage({ action: 'AUTHORISE_EXTENSION' }).then(result => {
      if (result) showWatchedPosts();
    });
  });
}

browser.runtime.sendMessage({ action: 'GET_ACCESS_TOKEN' }).then(accessToken => {
  if (accessToken) showWatchedPosts();
  else authorise();
});
