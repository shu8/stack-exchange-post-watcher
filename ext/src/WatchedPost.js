class WatchedPost {
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
}
