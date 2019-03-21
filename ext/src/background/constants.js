(function () {
  window.SEPostWatcher = window.SEPostWatcher || {};

  SEPostWatcher.WATCH_TYPES = {
    question: [
      { name: 'edit', description: 'Edits', apiEndpoint: 'posts/{ids}', apiField: 'last_edit_date', apiFieldOptional: true },
      { name: 'newComment', description: 'New comments', apiEndpoint: 'posts/{ids}', apiField: 'comment_count' },
      { name: 'state', description: 'State changes', apiEndpoint: 'questions/{ids}', apiField: 'closed_reason', apiFieldOptional: true },
      { name: 'newAnswer', description: 'New answers', apiEndpoint: 'questions/{ids}', apiField: 'answer_count' },
      { name: 'voteChange', description: 'Vote count changes', apiEndpoint: 'posts/{ids}', apiField: 'score' },
    ],
    answer: [
      { name: 'edit', description: 'Edits', apiEndpoint: 'posts/{ids}', apiField: 'last_edit_date', apiFieldOptional: true },
      { name: 'newComment', description: 'New comments', apiEndpoint: 'posts/{ids}', apiField: 'comment_count' },
      { name: 'voteChange', description: 'Vote count changes', apiEndpoint: 'posts/{ids}', apiField: 'score' },
    ],
  };

  SEPostWatcher.UNIQUE_WATCH_TYPES = Object.values(SEPostWatcher.WATCH_TYPES).flat().reduce((acc, cur) => {
    if (!acc.find(t => t.name === cur.name)) acc.push(cur);
    return acc;
  }, []);

  SEPostWatcher.HOSTNAMES = [
    'stackoverflow.com',
    'stackexchange.com',
    'superuser.com',
    'serverfault.com',
    'askubuntu.com',
    'stackapps.com',
    'mathoverflow.net',
  ];

  SEPostWatcher.API_AUTH_URL = 'https://stackexchange.com/oauth/dialog?client_id=14395&scope=no_expiry';
  SEPostWatcher.API_KEY = 'R4bkbtGLYdmiDviA1lg4ag((';
  SEPostWatcher.API_BASE_URL = 'https://api.stackexchange.com/2.2';
  SEPostWatcher.API_FILTERS_FOR_ENDPOINTS = {
    'posts/{ids}': '!0Ryp5YRqvRhiY3Bmc)s6SxJMV',
    'questions/{ids}': '!9Z(-wviXh',
  };
})();
