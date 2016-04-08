import React from 'react'
import openurl from 'openurl';
import {getAllTheThings} from "./canduit";
import Revision from './revision';
import {sortOrder} from './consts';
import moment from 'moment'

const revisionsSort = (a, b) => sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status)

const openAll = revs => {
  revs.forEach(rev => openurl.open(rev.uri));
}

const WAIT_TIME = 1000 * 60 * 5

class Ticker extends React.Component {
  constructor(props) {
    super(props)
    this.state = {tick: 0}
  }
  componentDidMount() {
    setInterval(() => {
      this.setState({tick: this.state.tick + 1});
    }, 1000 * 5);
  }
  componentWillUnmount() {
    clearInterval(this._tick)
  }
  render() {
    return <div style={styles.ticker}>last sync {moment(this.props.time).fromNow()}</div>
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    if (localStorage.data) {
      try {
        const {mine, others, user, syncTime} = JSON.parse(localStorage.data)
        this.state = {mine, others, user, syncTime};
      } catch (e) {
        this.state = {mine: [], others: [], user: {}, syncTime: null}
      }
    } else {
      this.state = {mine: [], others: [], user: {}, syncTime: null}
    }
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillUnmount() {
    clearTimeout(this._refresh);
  }

  refresh() {
    clearTimeout(this._refresh);
    this.setState({loading: true, error: null});
    getAllTheThings().then(({mine, others, user}) => {
      const syncTime = Date.now();
      localStorage.data = JSON.stringify({mine, others, user, syncTime});
      this.setState({
        mine, others, user, syncTime,
        loading: false,
        error: null,
      });
    }, err => {
      this.setState({error: err, loading: false});
    }).then(() => {
      this._refresh = setTimeout(this.refresh.bind(this), WAIT_TIME);
    });
  }

  render() {
    const ready = this.state.others.filter(
      r => r.status === 'waiting' || r.status === 'other-rejected');
    const done = this.state.others.filter(
      r => r.status !== 'waiting' && r.status !== 'other-rejected');
    ready.sort(revisionsSort);
    done.sort(revisionsSort);
    return <div style={styles.app}>
      {this.state.error &&
        <div style={styles.errorTitle}>
          Oops! Unable to sync with phabricator.
        </div>}
      <div style={{...styles.sectionTitle, ...styles.myRevisions}}>
        My revisions
        {/** TODO action required etc **/}
        <div style={styles.spacer} />
        {this.state.syncTime ? <Ticker time={this.state.syncTime} /> : null}
        {this.state.loading ?
          <div style={styles.loading}>loading...</div> :
          <div style={styles.button} onClick={() => this.refresh()}>refresh</div>}
      </div>
      <div style={{...styles.mine, ...styles.diffs}}>
        {this.state.mine.map(rev => <Revision me={this.state.user.phid} isMine={true} key={rev.id} rev={rev} />)}
      </div>
      <div style={{...styles.sectionTitle, ...styles.othersRevisions}}>
        Others revisions
      </div>
      <div style={{...styles.others, ...styles.diffs}}>
        <div style={{...styles.subheading, ...styles.actionRequired}}>
          Action required
          <div style={styles.spacer} />
          <div style={styles.openButton} onClick={() => openAll(ready)}>Open all</div>
        </div>
        {ready.map(rev => <Revision me={this.state.user.phid} key={rev.id} rev={rev} />)}
        <div style={{...styles.subheading, ...styles.waitingOnOthers}}>
          Waiting on others
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

  errorTitle: {
    textAlign: 'center',
    backgroundColor: '#f77',
    padding: '10px 20px',
  },

  ticker: {
    fontWeight: 'normal',
    fontSize: '60%',
    marginRight: 10,
  },

  loading: {
  },

  button: {
    cursor: 'pointer',
  },

  sectionTitle: {
    alignSelf: 'stretch',
    backgroundColor: 'rgb(223, 236, 255)',
    padding: '5px 15px',
    fontSize: '110%',
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },

  spacer: {flex: 1},

  subheading: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#efe',
    padding: '5px 15px',
    alignItems: 'center',
  },

  actionRequired: {
    backgroundColor: '#faa',
  },

  waitingOnOthers: {
    backgroundColor: '#eee',
  },

  // TODO what about if there was a code push after I accepted? or rejected?
}
