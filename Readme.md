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

These things will require making a [plugin](https://secure.phabricator.com/book/phabcontrib/article/adding_new_classes/) for phabricator... because [their API](https://github.com/phacility/phabricator/blob/121e68e3adae4cd21731b79c07ca89676def7e19/src/applications/differential/conduit/DifferentialGetRevisionCommentsConduitAPIMethod.php) is old and crufty, and doesn't provide [enough information](https://github.com/phacility/phabricator/blob/121e68e3adae4cd21731b79c07ca89676def7e19/src/applications/differential/storage/DifferentialTransaction.php).

- tracking the "plan changes" event
- better tracking of when new commits are added
- better tracking of inline comments, whether they're done, etc


