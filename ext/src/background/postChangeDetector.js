(function () {
  window.SEPostWatcher = window.SEPostWatcher || {};

  SEPostWatcher.detectPostChanges = async function (watchedPosts) {
    const sites = {};

    // API calls are restricted to one site each, so seperate posts by sitename
    // Posts for each site will then be checked against the API seperately
    watchedPosts.forEach(post => {
      if (sites[post.sitename]) {
        sites[post.sitename].push(post);
      } else {
        sites[post.sitename] = [post];
      }
    });

    for (const sitename of Object.keys(sites)) {
      const postsSeparatedByWatchType = seperatePostsByWatchType(sites[sitename]);

      // Different watch types require querying different API endpoints, and only one can be queried at a time
      // Here, watched posts for the current site are seperated into the endpoint they require
      // Each endpoint is then queried for all posts that need it, on this site
      const postsGroupedByApiEndpoint = groupPostsByApiEndpoint(postsSeparatedByWatchType);
      for (const endpoint of Object.keys(postsGroupedByApiEndpoint)) {
        const posts = postsGroupedByApiEndpoint[endpoint];
        await updatePostsWithChangeFromAPI(endpoint, sitename, posts);
      }
    }
  };

  SEPostWatcher.getCurrentDetailsForPost = async function (post) {
    const endpointsNeeded = [];
    SEPostWatcher.UNIQUE_WATCH_TYPES.forEach(watchType => {
      if (post.watchOptions.includes(watchType.name) && !endpointsNeeded.includes(watchType.apiEndpoint)) {
        endpointsNeeded.push(watchType.apiEndpoint);
      }
    });

    for (const endpoint of endpointsNeeded) {
      await updatePostsWithChangeFromAPI(endpoint, post.sitename, [post], true);
    }
  };

  async function updatePostsWithChangeFromAPI(endpoint, sitename, posts, isFirstCheck = false) {
    const items = await SEPostWatcher.API.get(endpoint, {
      site: sitename,
      ids: posts.map(post => post.postId),
    });

    // Special case: check for post deletions
    if (items.length !== posts.length) {
      const postsWithDeleteWatchOption = posts.filter(p => p.watchOptions.includes('delete'));
      postsWithDeleteWatchOption.forEach(post => {
        if (!items.find(item => item.post_id === +post.post_id)) {
          // `post` was deleted
          console.log('[ChangeDetector.js] Post deleted!', post.postId);
          post.unreadChanges.push({
            name: 'delete',
            previous: undefined,
            new: 'deleted',
          });
          post.lastChecked = new Date().getTime();
        }
      });
    }

    items.forEach(item => {
      // Get the WatchedPost object for the current post in the API's response
      const post = posts.find(p => (item.post_id ? +p.postId === item.post_id : +p.postId === item.question_id));

      // For each of the user's watch options for this WatchedPost, check the appropraite field in the API response
      // to see if a change has occured. If there has, add the change to the WatchedPost's unreadChanges object
      // In all cases, update the WatchedPost's postDetailsAtLastCheck object and lastChecked time with the data
      // we got from the API so we can use this to compare to later.
      post.watchOptions.forEach(watchOption => {
        // 'delete' special case is handled above, so skip here
        if (watchOption === 'delete') return;

        // Get the API field we want to check for changes that belongs to this watch type and endpoint
        const watchType = SEPostWatcher.UNIQUE_WATCH_TYPES.find(
          type => type.name === watchOption && type.apiEndpoint === endpoint,
        );
        // Some watch options would require a different API endpoint!
        if (!watchType) return;

        const apiField = watchType.apiField;
        // Some endpoints might not have a field another watch type needs so don't update actual data with undefined!
        if (post.postDetailsAtLastCheck[apiField] !== item[apiField] && typeof item[apiField] !== 'undefined') {
          if (!isFirstCheck) {
            // Don't check for post changes if this is the first check for the post, as there is nothing to compare with!
            console.log('[ChangeDetector.js] Post changed!', post.postId, apiField,
              `Old: ${post.postDetailsAtLastCheck[apiField]}, New: ${item[apiField]}`);

            const existingUnreadChange = post.unreadChanges.find(change => change.name === watchOption);

            // Don't append new unread change if one for this watch type already exists
            if (existingUnreadChange) {
              existingUnreadChange.previous = post.postDetailsAtLastCheck[apiField];
              existingUnreadChange.new = item[apiField];
            } else {
              post.unreadChanges.push({
                name: watchOption,
                previous: post.postDetailsAtLastCheck[apiField],
                new: item[apiField],
              });
            }
          }
        }
        post.postDetailsAtLastCheck[apiField] = item[apiField];
        post.lastChecked = new Date().getTime();
      });
    });
  }

  function groupPostsByApiEndpoint(posts) {
    // Group posts by API endpoint:
    // { edit: [WatchedPost1, WatchedPost2], newComment: [WatchedPost3, WatchedPost4], state: [WatchedPost1] } turns into:
    // { endpoint1: [WatchedPost1, WatchedPost2, WatchedPost3, WatchedPost4], endpoint2: [WatchedPost1] }
    return Object.keys(posts).reduce((acc, cur) => {
      const endpointForPostWatchOption = SEPostWatcher.UNIQUE_WATCH_TYPES.find(type => type.name === cur).apiEndpoint;
      if (!acc[endpointForPostWatchOption]) acc[endpointForPostWatchOption] = [];
      if (!acc[endpointForPostWatchOption].find(p => posts[cur].includes(p))) {
        acc[endpointForPostWatchOption].push(...posts[cur]);
      }
      return acc;
    }, {});
  }

  function seperatePostsByWatchType(posts) {
    // Returns object like:
    // { edit: [WatchedPost1, WatchedPost2], newComment: [WatchedPost3, WatchedPost4], state: [WatchedPost1], ... }
    const postsSeperatedByWatchType = {};
    SEPostWatcher.UNIQUE_WATCH_TYPES.forEach(watchType => {
      const postsWithCurrentWatchType = posts.filter(p => p.watchOptions.includes(watchType.name));
      if (postsWithCurrentWatchType.length) {
        if (!postsSeperatedByWatchType[watchType.name]) postsSeperatedByWatchType[watchType.name] = [];
        postsSeperatedByWatchType[watchType.name].push(...postsWithCurrentWatchType);
      }
    });
    return postsSeperatedByWatchType;
  }
})();
