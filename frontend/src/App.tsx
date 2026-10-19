import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, listarClientes } from './api/clientes'
import { ClienteLista } from './components/ClienteLista'
import { ClienteModal } from './components/ClienteModal'
import { ConfirmInativar } from './components/ConfirmInativar'
import { useDebounce } from './hooks/useDebounce'
import { maskCpf, onlyDigits } from './lib/format'
import type { Cliente } from './types'

type Modal = { tipo: 'form'; cliente: Cliente | null } | { tipo: 'inativar'; cliente: Cliente } | null

export default function App() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const dNome = useDebounce(nome)
  const dCpf = useDebounce(cpf)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const reqId = useRef(0)
  const origem = useRef<HTMLElement | null>(null)

  const carregar = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true)
    setErro(null)
    try {
      const data = await listarClientes({ nome: dNome, cpf: onlyDigits(dCpf), ativo: 'all' })
      if (id === reqId.current) setClientes(data)
    } catch (e) {
      if (id === reqId.current) setErro(e instanceof ApiError ? e.message : 'Erro inesperado ao carregar')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [dNome, dCpf])

  useEffect(() => { void carregar() }, [carregar])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const abrir = (m: Modal) => { origem.current = document.activeElement as HTMLElement; setModal(m) }
  const fechar = () => { setModal(null); origem.current?.focus() }

  const filtrando = Boolean(dNome.trim() || dCpf)
  const ativos = clientes.filter((c) => c.ativo).length
  const inativos = clientes.length - ativos
  const resumo =
    `${ativos} ${ativos === 1 ? 'cliente ativo' : 'clientes ativos'}` +
    (inativos ? ` · ${inativos} ${inativos === 1 ? 'inativo' : 'inativos'}` : '') +
    (filtrando ? ' na busca' : '')

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div>
            <h1>Clientes</h1>
            <p className="sub">
              {loading && clientes.length === 0
                ? 'Carregando cadastro…'
                : resumo}
            </p>
          </div>
          <button type="button" className="btn btn-light" onClick={() => abrir({ tipo: 'form', cliente: null })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Novo cliente
          </button>
        </div>
      </header>

      <div className="folha">
        <form className="filtros" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="filtro-nome">Nome</label>
            <div className="busca">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input id="filtro-nome" type="search" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" placeholder="Buscar por nome" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="filtro-cpf">CPF</label>
            <div className="busca">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input id="filtro-cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} autoComplete="off" placeholder="000.000.000-00" />
            </div>
          </div>
          {filtrando && (
            <button type="button" className="btn btn-ghost" onClick={() => { setNome(''); setCpf('') }}>Limpar filtros</button>
          )}
        </form>

        <main className="painel" aria-busy={loading}>
          {erro ? (
            <div className="estado" role="alert">
              <h2>Não foi possível carregar os clientes</h2>
              <p>{erro}. Verifique se a API está no ar e tente novamente.</p>
              <button type="button" className="btn btn-primary" onClick={() => void carregar()}>Tentar de novo</button>
            </div>
          ) : loading && clientes.length === 0 ? (
            <div className="skeletons" role="status" aria-label="Carregando clientes">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
            </div>
          ) : clientes.length === 0 ? (
            <div className="estado">
              <svg className="estado-ico" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M17 8h5M19.5 5.5v5" /></svg>
              <h2>{filtrando ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h2>
              <p>{filtrando ? 'Ajuste o nome ou o CPF buscado.' : 'Cadastre o primeiro cliente para vê-lo aqui.'}</p>
              {!filtrando && (
                <button type="button" className="btn btn-primary" onClick={() => abrir({ tipo: 'form', cliente: null })}>Novo cliente</button>
              )}
            </div>
          ) : (
            <div className={loading ? 'recarregando' : undefined}>
              <ClienteLista
                clientes={clientes}
                onEdit={(c) => abrir({ tipo: 'form', cliente: c })}
                onInativar={(c) => abrir({ tipo: 'inativar', cliente: c })}
              />
            </div>
          )}
        </main>
      </div>

      <div className="toast-area" role="status" aria-live="polite">
        {aviso && <div className="toast">{aviso}</div>}
      </div>

      {modal?.tipo === 'form' && (
        <ClienteModal
          cliente={modal.cliente}
          onClose={fechar}
          onSaved={(_c, criado) => { fechar(); setAviso(criado ? 'Cliente cadastrado' : 'Alterações salvas'); void carregar() }}
        />
      )}
      {modal?.tipo === 'inativar' && (
        <ConfirmInativar
          cliente={modal.cliente}
          onClose={fechar}
          onDone={() => { setModal(null); setAviso('Cliente inativado'); void carregar() }}
        />
      )}
    </div>
  )
}
