import './App.css'

function App() {
  return (
    <main className="popup">
      <header className="brand">
        <div className="brand__mark" aria-hidden="true">
          S
        </div>

        <div>
          <h1>Shrtn</h1>
          <p>Shorten. Scan. Share.</p>
        </div>
      </header>

      <section className="panel" aria-labelledby="create-link-heading">
        <h2 id="create-link-heading">Create a short link</h2>

        <label htmlFor="url">URL</label>

        <input
          id="url"
          name="url"
          type="url"
          placeholder="https://example.com"
          disabled
        />

        <button type="button" disabled>
          Shorten URL
        </button>

        <p className="helper">
          Current-tab detection and URL shortening will be added next.
        </p>
      </section>

      <footer className="status">
        <span className="status__dot" aria-hidden="true" />
        Extension foundation ready
      </footer>
    </main>
  )
}

export default App