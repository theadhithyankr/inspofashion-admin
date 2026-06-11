import { Component } from 'react'
import { Button } from './Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 font-mono mb-4 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ error: null })
                this.props.onReset?.()
              }}
            >
              Go back
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
