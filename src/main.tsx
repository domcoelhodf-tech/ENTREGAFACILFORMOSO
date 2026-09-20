import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type Screen = 'home' | 'resident-login' | 'management-login'

function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen !== 'home') {
    const isResident = screen === 'resident-login'

    return (
      <main className="landing">
        <section className="card login-card" aria-labelledby="login-title">
          <button className="back-button" type="button" onClick={() => setScreen('home')}>
            ← Voltar
          </button>
          <p className="eyebrow">Condomínio Residencial Formoso</p>
          <h1 id="login-title">{isResident ? 'Acesso do morador' : 'Acesso à gestão'}</h1>
          <p>
            {isResident
              ? 'Informe seus dados para consultar suas encomendas.'
              : 'Entre com suas credenciais para acessar a gestão de entregas.'}
          </p>

          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            {isResident ? (
              <>
                <label htmlFor="cpf">CPF</label>
                <input id="cpf" name="cpf" placeholder="000.000.000-00" inputMode="numeric" />
                <label htmlFor="block">Bloco</label>
                <input id="block" name="block" placeholder="Ex.: Bloco A" />
                <label htmlFor="unit">Unidade</label>
                <input id="unit" name="unit" placeholder="Ex.: 101" />
              </>
            ) : (
              <>
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" placeholder="seu@email.com" />
                <label htmlFor="password">Senha</label>
                <input id="password" name="password" type="password" placeholder="Digite sua senha" />
              </>
            )}
            <button type="submit">ENTRAR</button>
            <p className="form-note">A autenticação será conectada ao Supabase na próxima etapa.</p>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="landing">
      <section className="card" aria-labelledby="app-title">
        <p className="eyebrow">Condomínio Residencial Formoso</p>
        <h1 id="app-title">ENTREGA FÁCIL - RES. FORMOSO</h1>
        <p>Gestão simples e segura de encomendas para condomínios.</p>
        <div className="actions">
          <button type="button" onClick={() => setScreen('resident-login')}>SOU MORADOR</button>
          <button type="button" className="secondary" onClick={() => setScreen('management-login')}>
            GESTÃO DE ENTREGAS
          </button>
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
