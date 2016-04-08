import React from 'react'
import openurl from 'openurl';
import {getAllTheThings} from "./canduit";
import Revision from './revision';
import {sortOrder} from './consts';

const revisionsSort = (a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status)

const openAll = revs => {
  revs.forEach(rev => openurl.open(rev.uri));
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
      return <div style={styles.loading}>Loading...</div>
    }
    const ready = this.state.others.filter(
      r => r.status === 'waiting' || r.status === 'other-rejected');
    const done = this.state.others.filter(
      r => r.status !== 'waiting' && r.status !== 'other-rejected');
    ready.sort(revisionsSort);
    done.sort(revisionsSort);
    return <div style={styles.app}>
      <div style={{...styles.sectionTitle, ...styles.myRevisions}}>
        My Revisions
        {/** TODO action required etc **/}
      </div>
      <div style={{...styles.mine, ...styles.diffs}}>
        {this.state.mine.map(rev => <Revision me={this.state.user.phid} isMine={true} key={rev.id} rev={rev} />)}
      </div>
      <div style={{...styles.sectionTitle, ...styles.othersRevisions}}>
        Others Revisions
      </div>
      <div style={{...styles.others, ...styles.diffs}}>
        <div style={{...styles.subheading, ...styles.actionRequired}}>
          Action Required
          <div style={styles.spacer} />
          <div style={styles.openButton} onClick={() => openAll(ready)}>Open all</div>
        </div>
        {ready.map(rev => <Revision me={this.state.user.phid} key={rev.id} rev={rev} />)}
        <div style={{...styles.subheading, ...styles.waitingOnOthers}}>
          Waiting on Others
          <div style={styles.spacer} />
          <div style={styles.openButton} onClick={() => openAll(done)}>Open all</div>
        </div>
        {done.map(rev => <Revision me={this.state.user.phid} key={rev.id} rev={rev} />)}
      </div>
    </div>
  }
}

const styles = {
  app: {
    fontFamily: 'sans-serif',
  },

  loading: {
    padding: 200,
    textAlign: 'center',
  },

  sectionTitle: {
    alignSelf: 'stretch',
    backgroundColor: 'rgb(223, 236, 255)',
    padding: '5px 15px',
    fontSize: '110%',
    fontWeight: 'bold',
    flexDirection: 'row',
  },

  spacer: {flex: 1},

  subheading: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#efe',
    padding: '5px 15px',
  },

  actionRequired: {
    backgroundColor: '#faa',
  },

  waitingOnOthers: {
    backgroundColor: '#eee',
  },

  // TODO what about if there was a code push after I accepted? or rejected?
}
