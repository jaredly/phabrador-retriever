import React from 'react'
import {getAllTheThings} from "./canduit";
import openurl from 'openurl'

const stated = (Component, initial) => {
  return class Stated extends React.Component {
    constructor(props) {
      super(props)
      this.state = initial
    }
    onChange(name, val) {
      this.setState({[name]: val});
    }
    render() {
      return <Component
        {...this.props}
        {...this.state}
        onChange={this.onChange.bind(this)}
      />
    }
  }
}

const statusText = {
  mine: {
    accepted: "Ready to land!",
    rejected: "Changed requested",
    waiting: "Waiting for review...",
  },
  others: {
    accepted: "You've accepted it",
    rejected: "You've requested changes",
    waiting: "Ready for your review!",
    'other-rejected': "Rejected by another",
  },
}

const Diff = ({rev: {status, title, uri, id, reviewers, waiting, author}, isMine, open, onChange}) => {
  return <div style={styles.diff} >
    <div style={styles.diffTop}>
      <div style={{...styles.status, ...styles.statuses[status]}}/>
      {!isMine &&
        <img src={author.image} style={styles.avatar} />}
      <div style={styles.titles}>
        <div style={styles.title} onClick={() => onChange('open', !open)}>
          {title}
        </div>
        <div style={styles.titleStatus}>
          <span
            style={styles.link}
            onClick={() => openurl.open(uri)}
          >
            🔗
          </span>
          {statusText[isMine ? 'mine' : 'others'][status]}
        </div>
      </div>
    </div>
    {open && <div style={styles.diffMain}>
      <table style={styles.reviewers}>
      <tbody>
      {reviewers.map(reviewer => {
        return <tr style={styles.reviewer}>
        <td>
          <div style={{...styles.reviewerStatus, ...styles.reviewerStatuses[reviewer.status]}} />
          </td>
          <td>
          <img src={reviewer.user.image} style={styles.avatar} />
          </td>
          <td>
          <span style={styles.personName}>{reviewer.user.userName}</span>
          </td>
        </tr>;
      })}
      </tbody>
      </table>

      {JSON.stringify(reviewers, null, 2)}
    </div>}
  </div>;
}

const StatedDiff = stated(Diff, {open: false});

const styles = {
  app: {
    fontFamily: 'sans-serif',
  },
  diff: {
  },
  diffTop: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '10px 20px 10px 0',
  },
  diffMain: {
    padding: '10px 20px',
  },

  link: {
    fontWeight: 'normal',
    fontSize: 15,
    cursor: 'pointer',
    paddingRight: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },

  status: {
    width: 30,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: '50%',
    marginRight: 10,
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
    backgroundColor: '#ffd',
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

  titleStatus: {
    color: '#555',
  },

  uri: {
    textDecoration: 'underline',
  },

  // TODO what about if there was a code push after I accepted? or rejected?
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    if (localStorage.data) {
      try {
        const {mine, others, user} = JSON.parse(localStorage.data)
        this.state = {
          mine, others, user,
          loading: false,
        };
      } catch (e) {
        this.state = {loading: true}
      }
    } else {
      this.state = {loading: true}
    }
  }

  componentDidMount() {
    if (this.state.loading) {
      getAllTheThings().then(({mine, others, user}) => {
        console.log('worked!', mine, others, user);
        localStorage.data = JSON.stringify({mine, others, user});
        this.setState({
          mine, others, user,
          loading: false
        });
      }, err => {
        console.log('ERRR')
        console.log(err);
      });
    }
  }

  render() {
    if (this.state.loading) {
      return <div style={styles.app}>Loading...</div>
    }
    return <div style={styles.app}>
      My Revisions
      <div style={styles.mine}>
        {this.state.mine.map(rev => <StatedDiff isMine={true} key={rev.id} rev={rev} />)}
      </div>
      Others Revisions
      <div style={styles.others}>
        {this.state.others.map(rev => <StatedDiff key={rev.id} rev={rev} />)}
      </div>
    </div>
  }
}
