# Phabrador Retriever
Fetchin yer diffs

## How to run?
```
npm i
npm run dev
```

Then you can hack on the files in `/src`, and `cmd-r` in phabrador will reload
w/ your changes.

## What things are yet to be?

- notifications? if people want them

These things will require making a plugin for phabricator... because their API
is old and crufty, and doesn't provide enough information.

- tracking the "plan changes" event
- better tracking of when new commits are added
- better tracking of inline comments, whether they're done, etc


