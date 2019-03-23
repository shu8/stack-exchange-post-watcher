# Stack Exchange Post Watcher

<img align="right" width="128" height="128" src="https://i.stack.imgur.com/UYJF0.png" title="Extension Logo">

Watching posts for changes is an _extremely_ heavily requested feature on Stack Exchange (see [1](https://meta.stackexchange.com/questions/45360/subscribing-to-questions-and-comments-that-dont-belong-to-you), [2](https://meta.stackexchange.com/questions/1803/mark-questions-to-receive-notifications-and-updates), [3](https://meta.stackexchange.com/questions/83343/adding-favorites-to-the-stack-exchange-global-inbox)).

This extension adds a 'watch' button to the actions under every post on the Stack Exchange network, letting you keep track of edits, vote changes, post state changes (e.g. closures), new comments, and new answers!

Now you can easily go back to a post once it's been modified to reconsider your vote or comments, or because you wanted to know the answer yourself!

It is available for [**_Firefox_**](https://addons.mozilla.org/en-GB/firefox/addon/stack-exchange-post-watcher/) and [**_Chrome_**](https://chrome.google.com/webstore/detail/stack-exchange-post-watch/kdjoaglbdcmgbmiahlkkhkkefncejmmm).

The extension adds an unobtrusive icon to your extension bar and adds a small coloured badge when a change has been detected. It checks the API every 10 minutes for any changes to posts in your watch list. It will prompt you for an access token on first install to give it a higher quota for querying the API.

If you would like any additional watch options, please make a feature request as an issue at the Github repo: https://github.com/shu8/stack-exchange-post-watcher/issues. I'll try my best to add it in!

## Install

[![Available on Chrome](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/stack-exchange-post-watch/kdjoaglbdcmgbmiahlkkhkkefncejmmm)
[![Available on Firefox](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/en-GB/firefox/addon/stack-exchange-post-watcher/)

## Contributing

Any feature requests or bug reports are very welcome! Please post them as [an issue on Github](https://github.com/shu8/stack-exchange-post-watcher).

If you would like to help by submitting a pull request for a bug fix or new feature, please feel free to do so! To add a new watch type, it might be as simple as [adding just _one line_](https://github.com/shu8/stack-exchange-post-watcher/blob/master/ext/src/background/constants.js#L4), so please have a go if you want!

## Screenshots

__Chrome__:

![Chrome watched posts](https://lh3.googleusercontent.com/hgVbtzIlDzvoepjzY4-xMAKUoSrQM10Joo_qGpLrjNqOqmy8UYejSzWhs5Zw9oF-P7If8u8K=w640-h400-e365)

__Firefox__:

![Firefox watch post dialog](https://addons.cdn.mozilla.net/user-media/previews/full/216/216784.png)
