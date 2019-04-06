function watchPost(postId, postType, watchOptions) {
  const post = document.getElementById(postType === 'question' ? 'question' : `answer-${postId}`);
  post.querySelector('.watch-post').style.fontWeight = 'bold';

  browser.runtime.sendMessage({
    action: 'WATCH_POST',
    postId,
    postType,
    watchOptions,
    sitename: location.hostname,
    title: document.getElementById('question-header').children[0].innerText,
  });
}

function chooseWatchTypesDialogEnterHandler(dialog) {
  const watchOptions = [...dialog.querySelectorAll('input.watch-type-input')]
    .filter(el => el.checked)
    .map(el => el.value);
  dialog.close(watchOptions);
}

function showChooseWatchTypesDialog(postId, postType) {
  const dialog = document.createElement('dialog');
  if (typeof dialogPolyfill !== 'undefined') dialogPolyfill.registerDialog(dialog);

  const intro = document.createElement('div');
  intro.innerText = 'Please choose the event(s) you want to be notified for:';
  dialog.appendChild(intro);

  SEPostWatcher.WATCH_TYPES[postType].forEach(type => {
    const label = SEPostWatcher.helpers.newElement('label', { innerText: type.description, className: 'watch-type' });
    const checkbox = SEPostWatcher.helpers.newElement('input', { type: 'checkbox', value: type.name, className: 'watch-type-input' });

    label.prepend(checkbox);
    dialog.appendChild(label);
  });

  const btn = SEPostWatcher.helpers.newElement('button', { innerText: 'Watch post' });
  btn.onclick = function () { chooseWatchTypesDialogEnterHandler(dialog); };
  dialog.appendChild(btn);

  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.addEventListener('keypress', function (event) {
    // User presses enter
    if (event.keyCode === 13) chooseWatchTypesDialogEnterHandler(dialog);
  });

  dialog.addEventListener('close', function () {
    if (this.returnValue) {
      let watchOptions = this.returnValue;
      if (typeof watchOptions === 'string') {
        watchOptions = this.returnValue.split(',');
      }
      console.log('1', watchOptions);
      watchPost(postId, postType, watchOptions);
    }
    dialog.remove();
  });
}

browser.runtime.sendMessage({ action: 'GET_WATCHED_POSTS' }).then(watchedPosts => {
  const posts = [...document.querySelectorAll('.question, .answer')];

  console.log(watchedPosts);
  posts.forEach(post => {
    const postType = post.classList.contains('question') ? 'question' : 'answer';
    const postId = post.getAttribute(`data-${postType}id`);
    const postMenu = post.querySelector('.post-menu');
    const watchButton = SEPostWatcher.helpers.newElement('a', {
      href: '#', title: 'Watch this post for changes', innerText: 'watch', className: 'watch-post',
    });
    if (watchedPosts.find(p => p.postId === postId && p.sitename === location.hostname)) {
      watchButton.setAttribute('data-post-watched', true);
      watchButton.style.fontWeight = 'bold';
    }
    watchButton.onclick = function () {
      if (watchButton.getAttribute('data-post-watched') === true) {
        browser.runtime.sendMessage({ action: 'STOP_WATCHING_POST', postId: postId, sitename: location.hostname });
        watchButton.style.fontWeight = 'unset';
        watchButton.setAttribute('data-post-watched', false);
      } else {
        showChooseWatchTypesDialog(postId, postType);
      }

      // Don't scroll to top due to href=#
      return false;
    };
    postMenu.appendChild(watchButton);
  });
});
