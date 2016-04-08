
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

  const commentsYouHaventSeen = {}
  commentsYouHaventSeen[rev.authorPHID] = new Set();
  rev.reviewers.forEach(id => commentsYouHaventSeen[id] = new Set());

  comments.slice().reverse().forEach(comment => {
    const role = comment.authorPHID === rev.authorPHID ?  "author" :
      (rev.reviewers.indexOf(comment.authorPHID) !== -1 ?
       "reviewer": null)
    if (comment.action === 'request_review' && role === "author") {
      // reset everything
      rev.reviewers.forEach(id => statuses[id] = "waiting");
      commentsYouHaventSeen[rev.authorPHID] = new Set();
      return;
    }

    if (comment.action === 'comment') {
      rev.reviewers.forEach(id => commentsYouHaventSeen[id].add(comment.authorPHID))
      commentsYouHaventSeen[rev.authorPHID].add(comment.authorPHID);

      commentsYouHaventSeen[comment.authorPHID] = new Set();
    }

    // If not a reviewer, ignore
    if (role !== "reviewer") return;

    if (comment.action === 'reject') {
      statuses[comment.authorPHID] = 'rejected';
      commentsYouHaventSeen[comment.authorPHID] = new Set();
    }
    if (comment.action === 'accept') {
      statuses[comment.authorPHID] = 'accepted';
      commentsYouHaventSeen[comment.authorPHID] = new Set();
    }
  });

  return {statuses, commentsYouHaventSeen};
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
  console.log("Review Status");
  Object.keys(res.statuses).forEach(id => {
    console.log(usersByPhid[id].userName, res.statuses[id]);
  });
  console.log('Comments');
  Object.keys(res.commentsYouHaventSeen).forEach(id => {
    console.log(usersByPhid[id].userName, ':',
                Array.from(res.commentsYouHaventSeen[id]).map(id => usersByPhid[id].userName))
  })
  // console.log(res);
}

main().then(() => {
  console.log('DONE');
  process.exit(0);
}, err => {
  console.error('FAIL', err)
  console.error(err.stack);
  process.exit(1);
});

