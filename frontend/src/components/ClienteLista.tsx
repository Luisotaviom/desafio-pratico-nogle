import { maskCpf, maskTelefone, enderecoCompleto } from '../lib/format'
import type { Cliente } from '../types'

interface Props {
  clientes: Cliente[]
  onEdit: (c: Cliente) => void
  onInativar: (c: Cliente) => void
  onReativar: (c: Cliente) => void
  reativando: number | null
  destaqueId: number | null
}

function Iniciais({ nome }: { nome: string }) {
  const p = nome.trim().split(/\s+/)
  const txt = (p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')
  let h = 0
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % 360
  const style = { '--h': h } as React.CSSProperties
  return <span className="mono" style={style} aria-hidden="true">{txt.toUpperCase()}</span>
}

function Acoes({ c, onEdit, onInativar }: { c: Cliente } & Pick<Props, 'onEdit' | 'onInativar'>) {
  return (
    <div className="acoes">
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => onEdit(c)} aria-label={`Editar ${c.nome}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
        Editar
      </button>
      <button type="button" className="btn btn-sm btn-ghost btn-warn" onClick={() => onInativar(c)} aria-label={`Inativar ${c.nome}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.5" /><path d="M3 20c.6-3.4 3-5.5 7-5.5M16 15l5 5M21 15l-5 5" /></svg>
        Inativar
      </button>
    </div>
  )
}

/** Tabela em telas largas; no CSS ela vira cards em telas estreitas. */
export function ClienteLista({ clientes, onEdit, onInativar, onReativar, reativando, destaqueId }: Props) {
  return (
    <table className="tabela">
      <caption className="sr-only">Clientes cadastrados</caption>
      <thead>
        <tr>
          <th scope="col">Nome</th>
          <th scope="col">CPF</th>
          <th scope="col">Telefone</th>
          <th scope="col">Endereço completo</th>
          <th scope="col"><span className="sr-only">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((c) => (
          <tr key={c.id} className={[c.ativo ? '' : 'inativo', c.id === destaqueId ? 'destaque' : ''].filter(Boolean).join(' ') || undefined}>
            <td data-label="Nome">
              <span className="nome-cell"><Iniciais nome={c.nome} /><span>{c.nome}</span>{!c.ativo && <span className="selo">Inativo</span>}</span>
            </td>
            <td data-label="CPF" className="num">{maskCpf(c.cpf)}</td>
            <td data-label="Telefone" className="num">{maskTelefone(c.telefone)}</td>
            <td data-label="Endereço">{enderecoCompleto(c)}</td>
            <td className="acoes-cell">
              {c.ativo ? (
                <Acoes c={c} onEdit={onEdit} onInativar={onInativar} />
              ) : (
                <div className="acoes">
                  <button type="button" className="btn btn-sm btn-ghost btn-reativar" onClick={() => onReativar(c)} disabled={reativando === c.id} aria-label={`Reativar ${c.nome}`}>
                    {reativando === c.id ? <span className="spinner" aria-hidden="true" /> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5" /></svg>
                    )}
                    {reativando === c.id ? 'Reativando…' : 'Reativar'}
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
