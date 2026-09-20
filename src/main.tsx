import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="landing">
      <section className="card" aria-labelledby="app-title">
        <p className="eyebrow">Condomínio Residencial Formoso</p>
        <h1 id="app-title">ENTREGA FÁCIL - RES. FORMOSO</h1>
        <p>Gestão simples e segura de encomendas para condomínios.</p>
        <div className="actions">
          <button type="button">SOU MORADOR</button>
          <button type="button" className="secondary">GESTÃO DE ENTREGAS</button>
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
