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

        if (post.unreadChanges.length) postLi.classList.add('unread');

        // The '/q' or '/a' slug works for any type of post so don't need to check for postType
        const postTitleAnchor = SEPostWatcher.helpers.newElement('a', {
          href: `https://${post.sitename}/q/${post.postId}`, innerText: post.title, className: 'post-title', target: '_blank',
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

        const watchedPostOptions = SEPostWatcher.helpers.newElement('span', { className: 'watched-post-watch-options' });
        watchOptionSpans.forEach(span => watchedPostOptions.appendChild(span));

        const actionsSpan = SEPostWatcher.helpers.newElement('span', { className: 'watched-post-actions' });

        const deleteWatchedPostSpan = SEPostWatcher.helpers.newElement('span', {
          innerText: 'Stop', className: 'stop-watching-post action', title: 'stop watching post',
        });
        deleteWatchedPostSpan.onclick = function () {
          browser.runtime.sendMessage({ action: 'STOP_WATCHING_POST', postId: post.postId, sitename: post.sitename });
          postLi.remove();
        };

        const markAsReadSpan = SEPostWatcher.helpers.newElement('span', {
          innerHTML: '&#10003;', className: 'mark-watched-post-read action', title: 'mark as read',
        });
        markAsReadSpan.onclick = function () {
          browser.runtime.sendMessage({ action: 'MARK_POST_AS_READ', postId: post.postId, sitename: post.sitename });
          postLi.classList.remove('unread');
          watchOptionSpans.forEach(span => span.classList.remove('unread'));
        };

        actionsSpan.appendChild(markAsReadSpan);
        actionsSpan.appendChild(deleteWatchedPostSpan);

        postLi.appendChild(postTitleAnchor);
        postLi.appendChild(watchedPostOptions);
        postLi.appendChild(actionsSpan);

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