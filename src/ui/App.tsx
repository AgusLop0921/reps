import { copy } from './copy'

export function App() {
  return (
    <main className="app">
      <h1 className="app-name">{copy.appName}</h1>
      <p className="app-tagline">{copy.tagline}</p>
    </main>
  )
}
