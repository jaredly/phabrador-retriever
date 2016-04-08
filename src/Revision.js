import React from 'react'
import openurl from 'openurl'
import moment from 'moment'
import stated from './stated'
import {statusText} from './consts'

const stripes = 'repeating-linear-gradient(45deg, transparent, transparent 5px, #aaa 5px, #aaa 10px)'

const dstyles = {
  spacer: {flex: 1},
  subTitle: {
    fontSize: '80%',
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'center',
  },
  id: {
    color: 'blue',
    marginRight: 5,
  },
  author: {
    fontWeight: 'bold',
    fontSize: '110%',
    color: 'black',
  },

  created: {
    marginLeft: 5,
    color: 'black',
  },
  modified: {
    color: 'black',
    marginRight: 5,
    marginLeft: 5,
    fontWeight: 'bold',
  },
}

const styles = {

  diff: {
    padding: 10,
  },
  diffTop: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '10px 20px 10px 0',
    flex: 1,
  },
  titles: {
    flex: 1,
  },
  diffMain: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
  },

  idLink: {
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
    paddingRight: 10,
  },

  commentsText: {
    fontSize: '80%',
    fontWeight: 'bold',
  },

  noComments: {
    color: "#aaa",
    fontWeight: 'normal',
  },

  title: {
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewer: {
  },

  spacer: {
    flex: 1,
  },

  statusText: {
    marginBottom: 5,
    marginTop: 5,
  },

  status: {
    width: 20,
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: '50%',
    marginRight: 10,
  },

  statusDots: {
    display: 'flex',
    flexDirection: 'row',
  },

  statusDot: {
    width: 10,
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: '50%',
    marginRight: 5,
  },

  reviewerStatus: {
    width: 20,
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: '50%',
    marginRight: 10,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    marginRight: 10,
    backgroundSize: 'contain',
  },

  statuses: {

    'waiting': {
      backgroundColor: '#ccc',
    },

    'accepted': {
      backgroundColor: '#7fa',
    },

    'rejected': {
      backgroundColor: '#f77',
    },

    'other-rejected': {
      backgroundColor: '#fa0',
    },
  },
  reviewerStatuses: {
    'waiting': {
      backgroundColor: '#ccc',
    },

    'accepted': {
      backgroundColor: '#7fa',
    },

    'rejected': {
      backgroundColor: '#f77',
    },
  },

  smallStatus: {
    // fontSize: '80%',
    flexDirection: 'row',
    marginRight: 5,
    alignItems: 'center',
  },

  titleStatus: {
    color: '#555',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallComments: {
    // fontSize: '80%',
    padding: '0px 3px',
    backgroundColor: '#359835',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '30%',
    marginLeft: 5,
  },

  smallerComments: {
    fontSize: '80%',
  },

  uri: {
    textDecoration: 'underline',
  },
};

const Comments = ({num}) => (
  <div style={{
    ...styles.commentsText,
    ...(!num ? styles.noComments : {})
  }}>
    {num} new comments
  </div>
)

const Link = ({id, uri}) => (
  <div
    style={styles.idLink}
    onClick={evt => {
      evt.preventDefault()
      evt.stopPropagation()
      openurl.open(uri)
    }}
  >
    <div style={dstyles.id}>D{id}</div>
  </div>
)

const SubTitle = ({id, uri, author, full, authorComments}) => (
  <div style={dstyles.subTitle}>
    <Link id={id} uri={uri} />
    <div style={dstyles.author}>{author.userName}</div>
    {!!authorComments && <div style={styles.smallComments}>
      {authorComments}
    </div>}
    <div style={dstyles.spacer} />
    <div style={dstyles.modified}>{moment(full.dateModified * 1000).fromNow()}</div>
    (created
    <div style={dstyles.created}>{moment(full.dateCreated * 1000).fromNow()}</div>)
  </div>
)

const DiffTop = ({rev, isMine, toggleOpen}) => {
  const {full, status, title, uri, id, reviewers, waiting, author, authorComments} = rev;
  return <div style={styles.diffTop} onClick={/*toggleOpen*/null}>
    <div style={{...styles.status, ...styles.statuses[status]}}/>
    <div style={{...styles.avatar, backgroundImage: `url(${author.image}), ${stripes}` }} />
    <div style={styles.titles}>
      <div style={styles.title}>
        {title}
      </div>
      <SubTitle id={id} uri={uri} author={author} authorComments={authorComments} full={full} />
      <div style={styles.titleStatus}>
        <div style={styles.topStatus}>
          <div style={styles.statusText}>
            {statusText[isMine ? 'mine' : 'others'][status]}
          </div>
          <div style={styles.statusDots}>
            {reviewers.map(r => (
              <div style={styles.smallStatus}>
                <div
                  key={r.user.phid}
                  style={{...styles.statusDot, ...styles.reviewerStatuses[r.status]}}
                />
                <div style={styles.smallPerson}>
                  {r.user.userName}
                </div>
                {!!r.newComments && <div style={{...styles.smallComments, ...styles.smallerComments}}>
                  {r.newComments}
                </div>}
              </div>
            ))}
          </div>
        </div>
        <div style={styles.spacer} />
        <Comments num={rev.newComments} />
      </div>
    </div>
  </div>
};

const Reviewer = ({reviewer, me}) => (
  <tr style={styles.reviewer}>
    <td>
      <div style={{
        ...styles.reviewerStatus,
        ...styles.reviewerStatuses[reviewer.status]
      }} />
    </td>
    <td>
      <div style={{
        ...styles.avatar,
        backgroundImage: `url(${reviewer.user.image}), ${stripes}`
      }} />
    </td>
    <td>
      <span style={styles.personName}>{reviewer.user.userName}</span>
    </td>
    {me !== reviewer.user.phid && <td>
      <Comments num={reviewer.newComments} />
    </td>}
  </tr>
)

const Diff = ({rev, me, isMine/*, open, onChange*/}) => {
  const {full, status, title, uri, id, reviewers, waiting, author, authorComments} = rev;
  return <div style={styles.diff} >
    <DiffTop
      rev={rev}
      isMine={isMine}
      toggleOpen={() => onChange('open', !open)}
    />
    {/* TODO maybe list the comments here or something?
        open && <div style={styles.diffMain}>
      <table style={styles.reviewers}>
        <tbody>
        {reviewers.map(reviewer => <Reviewer key={reviewer.user.phid} me={me} reviewer={reviewer} />)}
        </tbody>
      </table>
    </div>*/}
  </div>;
}

// const StatedDiff = stated(Diff, {open: false});

export default Diff // StatedDiff
