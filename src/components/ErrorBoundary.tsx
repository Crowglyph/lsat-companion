import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  info: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Caught by ErrorBoundary:', error, info)
    this.setState({ error, info })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
            color: '#f4e8d2',
            background: '#1c1410',
            height: '100dvh',
            overflowY: 'auto',
            fontSize: '13px',
            lineHeight: 1.45,
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem' }}>Something broke</h2>
          <p style={{ margin: '0 0 1rem', opacity: 0.7 }}>
            {this.state.error.message}
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: '11px',
              background: 'rgba(0,0,0,0.4)',
              padding: '0.75rem',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            {this.state.error.stack}
          </pre>
          {this.state.info && (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: '11px',
                background: 'rgba(0,0,0,0.4)',
                padding: '0.75rem',
                borderRadius: 8,
                marginTop: '1rem',
                overflowX: 'auto',
              }}
            >
              {this.state.info.componentStack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null, info: null })
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              background: '#ffb86b',
              color: '#1c1410',
              border: 'none',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
