import { Component, type ReactNode } from 'react'
import { copy } from './copy'

type Props = {
  children: ReactNode
  /** Where the fallback's escape leads — the lesson runner passes "back to the path". */
  onReset: () => void
  /**
   * When this changes, a previously-caught error is cleared. The runner keys it to the current
   * card, so moving to another card or leaving the lesson gives a clean slate instead of
   * leaving the fallback stuck on screen.
   */
  resetKey: unknown
}

type State = { failed: boolean }

/**
 * Contains a render crash in the lesson runner. Imported answer markdown is third-party
 * (ADR-0004); a malformed fence or a highlight.js edge case throwing during render must not
 * white-screen the whole app. React only surfaces render errors to class components, so this
 * is the one class in the UI. The fallback stays Spanish (ADR-0008) and always offers a way
 * out, honouring the card's promise that "a failed load still works".
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidUpdate(prev: Props): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <div className="empty">
        <p>{copy.lessonError}</p>
        <button type="button" className="secondary" onClick={this.props.onReset}>
          {copy.lessonErrorBack}
        </button>
      </div>
    )
  }
}
