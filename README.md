## Privacy-Oriented Origin Policy

Prevent Firefox from sending `Origin` headers for any given request that fulfills **ALL** of the following conditions:

- uses the GET method.
- does not include one or more `Cookie` or `Authorization` headers.
- does not include URL parameters (`protocol://hostname:port/path/?parameters`)

Once an `Origin` is stripped this way, the related response is modified to ensure that it includes an `Access-Control-Allow-Origin: *` header.

:bangbang: **IMPORTANT**: You should remove `Referer` headers too when the origin & target hostnames don't match, which this extension doesn't do on its own. You can use other extensions for that, or simply set `network.http.referer.XOriginPolicy` to `2` in `about:config`.

See [this topic][issue] for more detailed information.

Since you seem to care about your privacy, I recommend you to also check out [this project][user.js].

## Privacy
This extension neither collects nor shares any kind of information whatsoever. What would be the point otherwise?

## Acknowledgments:
Big thanks to [@crssi](https://github.com/crssi) for bringing attention to this previously overlooked tracking vector!


[issue]: https://github.com/ghacksuserjs/ghacks-user.js/issues/509
[user.js]: https://github.com/ghacksuserjs/ghacks-user.js
