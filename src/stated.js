import React from 'react'

export default (Component, initial) => {
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

