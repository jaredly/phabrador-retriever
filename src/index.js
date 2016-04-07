import React from 'react'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {loading: true}
  }
  componentDidMount() {
  }
  render() {
    return <div>
      The App!
      {this.state.loading ?
        "Loading!" :
        "Something"}
    </div>
  }
}
