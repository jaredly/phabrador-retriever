
import createCanduit from 'canduit'

const prom = fn => new Promise((res, rej) => fn((err, val) => err ? rej(err) : res(val)))

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

export const parseReviewStatus = (rev, comments) => {
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
    // TODO plan changes...

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

const collectUsers = (comments, reviews) => {
  const allUsers = new Set();
  Object.keys(comments).map(rid => {
    comments[rid].forEach(comment => {
      allUsers.add(comment.authorPHID);
    });
  });
  reviews.forEach(rev => {
    rev.reviewers.forEach(id => allUsers.add(id))
    allUsers.add(rev.authorPHID);
  });
  return allUsers;
}

const getUserInfo = async (uids, c) => {
  const userInfo = await exec('user.query', c, {phids: uids});
  const usersByPhid = userInfo.reduce((m, u) => (m[u.phid]=u,m), {})
  return usersByPhid;
}

// Get all the things!
export const getAllTheThings = async () => {
  const c = await prom(done => createCanduit(done));
  const user = await exec('user.whoami', c)

  const mine = await query(c, {authors: [user.phid], status: "status-open"});
  const reviewing = await query(c, {reviewers: [user.phid], status: 'status-open'});
  const all = mine.concat(reviewing);

  const allIds = all.map(r => +r.id);
  const allComments = await exec(
    'differential.getrevisioncomments', c, {ids: allIds});

  const userInfo = await getUserInfo(Array.from(collectUsers(allComments, all)), c);

  const result = {
    user: user,
    mine: mine.map(rev => {
      const {
        statuses,
        commentsYouHaventSeen
      } = parseReviewStatus(rev, allComments[rev.id]);
      const newComments = commentsYouHaventSeen[user.phid];
      let status = 'accepted';
      let waiting = 0
      rev.reviewers.some(phid => {
        if (statuses[phid] === 'rejected') {
          status = 'rejected';
          return true;
        }
        if (statuses[phid] === 'waiting') {
          waiting += 1;
          if (status !== 'rejected') {
            status = 'waiting';
          }
        }
      });
      return {
        status,
        waiting,
        title: rev.title,
        uri: rev.uri,
        id: rev.id,
        reviewers: rev.reviewers.map(phid => {
          return {
            user: userInfo[phid],
            userName: userInfo[phid].userName,
            realName: userInfo[phid].realName,
            newComments: newComments.has(phid),
            status: statuses[phid],
          }
        }),
      }
    }),

    others: reviewing.map(rev => {
      const {
        statuses,
        commentsYouHaventSeen
      } = parseReviewStatus(rev, allComments[rev.id]);
      const newComments = commentsYouHaventSeen[user.phid];
      const isRejected = rev.reviewers.some(id => statuses[id] === 'rejected')
      let status = statuses[user.phid];
      if (status === 'waiting' && isRejected) {
        status = 'other-rejected';
      }
      return {
        status,
        title: rev.title,
        uri: rev.uri,
        id: rev.id,
        author: userInfo[rev.authorPHID],
        reviewers: rev.reviewers.map(phid => {
          return {
            user: userInfo[phid],
            newComments: newComments.has(phid),
            status: statuses[phid],
          }
        }),
      }
    })
  }

  return result;
}