## :hankey: Privacy Oriented Origin Policy

Prevent Firefox from sending `Origin` headers for any given request that fulfills the following conditions:

- uses the GET method.
- does not include one or more Cookie headers.

Once an `Origin` is stripped this way, the related response is modified to ensure that it includes an `Access-Control-Allow-Origin: *` header.

See [this topic][issue] for more detailed information.

## Privacy
This addon neither collects nor shares any kind of information whatsoever.

## Acknowledgements:
Thanks [@crssi](https://github.com/crssi) for bringing attention to this previously overlooked tracking vector!

## Disclaimer
I wrote this to be as safe as possible, but it *is* somewhat experimental. Use at your own risk.

[issue]: https://github.com/ghacksuserjs/ghacks-user.js/issues/509
