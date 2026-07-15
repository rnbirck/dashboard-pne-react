import { Component, type ReactNode } from 'react'
import { ContentState } from '../components/ContentState'

interface PageLoadBoundaryProps {
  children: ReactNode
}

interface PageLoadBoundaryState {
  hasError: boolean
}

export class PageLoadBoundary extends Component<PageLoadBoundaryProps, PageLoadBoundaryState> {
  state: PageLoadBoundaryState = { hasError: false }

  static getDerivedStateFromError(): PageLoadBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ContentState kind="error" className="state-box state-box--error">
          <strong>Não foi possível carregar a página.</strong>
          <span>Verifique sua conexão e tente novamente.</span>
          <button className="platform-navigation-button" type="button" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </ContentState>
      )
    }

    return this.props.children
  }
}
