
import createCanduit from 'canduit'

const prom = fn => new Promise((res, rej) => fn((err, val) => err ? rej(err) : res(val)))

// const please = fn => (...args) => new Promise((res, rej) => fn(...args, (err, val) => err ? rej(err) : res(val)))

const exec = (endpoint, canduit, args = {}) => {
  return prom(done => canduit.exec(endpoint, args, done));
}

const query = exec.bind(null, 'differential.query');

const tolist = obj => {
  const res = [];
  for (let i=0; obj[i]; i++) {
    res.push(obj[i]);
  }
  return res
}

const parseReviewStatus = (rev, comments) => {
  const statuses = {}
  rev.reviewers.forEach(id => statuses[id] = "waiting");

  const shouldReadComments = {}
  shouldReadComments[rev.authorPHID] = false;
  rev.reviewers.forEach(id => shouldReadComments[id] = false);

  const otherNewComments = {}
  otherNewComments[rev.authorPHID] = false;
  rev.reviewers.forEach(id => otherNewComments[id] = false);

  comments.slice().reverse().forEach(comment => {
    const role = comment.authorPHID === rev.authorPHID ?  "author" :
      (rev.reviewers.indexOf(comment.authorPHID) !== -1 ?
       "reviewer": null)
    if (comment.action === 'request_review' && role === "author") {
      // reset everything
      rev.reviewers.forEach(id => statuses[id] = "waiting");
      shouldReadComments[rev.authorPHID] = false;
      otherNewComments[rev.authorPHID] = false;
      return;
    }

    if (comment.action === 'comment') {
      if (role === 'author') {
        rev.reviewers.forEach(id => shouldReadComments[id] = true)

        shouldReadComments[rev.authorPHID] = false;
        otherNewComments[rev.authorPHID] = false;
      } else if (role === 'reviewer') {
        rev.reviewers.forEach(id => otherNewComments[id] = true)

        shouldReadComments[comment.authorPHID] = false;
        otherNewComments[comment.authorPHID] = false;

        shouldReadComments[rev.authorPHID] = true;
      } else {
        rev.reviewers.forEach(id => otherNewComments[id] = true)

        shouldReadComments[rev.authorPHID] = true;
      }
    }

    // If not a reviewer, ignore
    if (role !== "reviewer") return;

    if (comment.action === 'reject') {
      statuses[comment.authorPHID] = 'rejected';
      shouldReadComments[comments.authorPHID] = false;
      otherNewComments[comments.authorPHID] = false;
    }
    if (comment.action === 'accept') {
      statuses[comment.authorPHID] = 'accepted';
      shouldReadComments[comments.authorPHID] = false;
      otherNewComments[comments.authorPHID] = false;
    }
  });

  return {statuses, shouldReadComments, otherNewComments};
}

const main = async () => {
  const c = await prom(done => createCanduit(done));
  const user = await exec('user.whoami', c)
  console.log('User', user);
  const mine = await query(c, {authors: [user.phid], status: "status-open"});
  console.log('I have ', mine.length, 'open revs');
  console.log(mine.map(item => item.title));
  const reviewing = await query(c, {reviewers: [user.phid], status: 'status-open'});
  console.log('reviewing', reviewing.length);

  const all = mine.concat(reviewing);

  const allIds = all.map(r => +r.id);
  const allComments = await exec('differential.getrevisioncomments', c, {
    ids: allIds,
  });

  const allUsers = new Set();
  const actions = new Set();
  Object.keys(allComments).map(rid => {
    allComments[rid].forEach(comment => {
      allUsers.add(comment.authorPHID);
      actions.add(comment.action)
    });
  });

  all.forEach(rev => {
    rev.reviewers.forEach(id => allUsers.add(id))
  });

  console.log('Actions', Array.from(actions))

  const userInfo = await exec('user.query', c, {
    phids: Array.from(allUsers),
  });

  userInfo.forEach(user => {
    console.log(user.userName, user.phid);
  });

  const usersByPhid = userInfo.reduce((m, u) => (m[u.phid]=u,m), {})

  mine.forEach(r => {
    console.log(r.title, allComments[r.id].length);
  });

  const res = parseReviewStatus(mine[0], allComments[mine[0].id]);
  Object.keys(res).forEach(section => {
    console.log ('===',section,'===')
    Object.keys(res[section]).forEach(id => {
      console.log(usersByPhid[id].userName, res[section][id]);
    });
  })
  console.log(res);
}

main().then(() => {
  console.log('DONE');
  process.exit(0);
}, err => {
  console.error('FAIL', err)
  console.error(err.stack);
  process.exit(1);
});

