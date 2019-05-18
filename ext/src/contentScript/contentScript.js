// Maintain a local cache of the watched posts for this page in case they are updated/deleted
let watchedPosts;

browser.runtime.sendMessage({ action: 'GET_WATCHED_POSTS' }).then(originalWatchedPosts => {
  watchedPosts = originalWatchedPosts;
  const posts = [...document.querySelectorAll('.question, .answer')];

  console.log('SEPostWatched watched posts', watchedPosts);
  posts.forEach(post => {
    const postType = post.classList.contains('question') ? 'question' : 'answer';
    const postId = post.getAttribute(`data-${postType}id`);
    const postMenu = post.querySelector('.post-menu');
    const watchButton = SEPostWatcher.helpers.newElement('a', {
      href: '#', title: 'Watch this post for changes', innerText: 'watch', className: 'watch-post',
    });
    let existingWatchedPost = watchedPosts.find(p => p.postId === postId && p.sitename === location.hostname);
    if (existingWatchedPost) watchButton.style.fontWeight = 'bold';

    watchButton.onclick = function () {
      // This function binds the same existingWatchedPost for every click on this specific button
      // but the post's watch options may have been changed so re-set the variable before showing dialog
      existingWatchedPost = watchedPosts.find(p => p.postId === postId && p.sitename === location.hostname);
      showChooseWatchTypesDialog(postId, postType, existingWatchedPost);

      // Don't scroll to top due to href=#
      return false;
    };
    postMenu.appendChild(watchButton);
  });
});

function watchPost(postId, postType, watchOptions, alreadyWatched = false) {
  const post = document.getElementById(postType === 'question' ? 'question' : `answer-${postId}`);
  const title = document.querySelector('#question-header a').innerText;
  const sitename = location.hostname;

  post.querySelector('.watch-post').style.fontWeight = 'bold';
  if (alreadyWatched) {
    // If we're updating an old post, update the existing post to the new one
    browser.runtime.sendMessage({
      action: 'UDPATE_POST',
      postId,
      postType,
      watchOptions,
      sitename,
      title,
    }).then(newWatchedPost => {
      const index = watchedPosts.findIndex(p => p.postId === postId && p.sitename === sitename);
      if (index !== -1) watchedPosts[index] = newWatchedPost;
    });
  } else {
    browser.runtime.sendMessage({
      action: 'WATCH_POST',
      postId,
      postType,
      watchOptions,
      sitename,
      title,
    });
  }
}

function startWatchingPostHandler(postId, postType, dialog, alreadyWatched) {
  const watchOptions = [...dialog.querySelectorAll('input.watch-type-input')]
    .filter(el => el.checked)
    .map(el => el.value);

  watchPost(postId, postType, watchOptions, !!alreadyWatched);
}

function showChooseWatchTypesDialog(postId, postType, existingWatchedPost) {
  const post = document.getElementById(postType === 'question' ? 'question' : `answer-${postId}`);
  const watchButton = post.querySelector('.watch-post');

  const dialog = document.createElement('dialog');
  if (typeof dialogPolyfill !== 'undefined') dialogPolyfill.registerDialog(dialog);

  const intro = document.createElement('div');
  intro.innerHTML = 'Please choose the event(s) you want to be notified for.<br/>You can use the <kbd>TAB</kbd> and <kbd>ENTER</kbd> keys!';
  dialog.appendChild(intro);

  SEPostWatcher.WATCH_TYPES[postType].forEach(type => {
    const label = SEPostWatcher.helpers.newElement('label', { innerText: type.description, className: 'watch-type' });
    const checkbox = SEPostWatcher.helpers.newElement('input', { type: 'checkbox', value: type.name, className: 'watch-type-input' });

    label.prepend(checkbox);
    dialog.appendChild(label);
  });

  const watchBtn = SEPostWatcher.helpers.newElement('button', {
    innerText: existingWatchedPost ? 'Save changes' : 'Watch post',
    className: 'watch-btn',
  });
  watchBtn.onclick = function () {
    startWatchingPostHandler(postId, postType, dialog, !!existingWatchedPost);
    dialog.close();
  };
  dialog.appendChild(watchBtn);

  if (existingWatchedPost) {
    // Only add stop watching button if the post is already watched
    const stopBtn = SEPostWatcher.helpers.newElement('button', { innerText: 'Stop watching', className: 'stop-watching-btn' });
    stopBtn.onclick = function () {
      browser.runtime.sendMessage({ action: 'STOP_WATCHING_POST', postId: postId, sitename: location.hostname });
      dialog.remove();
      watchButton.style.fontWeight = 'unset';
    };
    dialog.appendChild(stopBtn);

    // If it's already been watched, also check the current watch option checkboxes so they can be edited
    existingWatchedPost.watchOptions.forEach(option => {
      dialog.querySelector(`input[value="${option}"]`).setAttribute('checked', true);
    });
  }

  document.body.appendChild(dialog);
  dialog.showModal();

  // User presses enter key
  dialog.addEventListener('keypress', function (event) {
    if (event.keyCode === 13) {
      startWatchingPostHandler(postId, postType, dialog);
      dialog.close();
    }
  });

  dialog.addEventListener('close', function () {
    dialog.remove();
  });
}
