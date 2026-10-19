import { maskCpf, maskTelefone, enderecoCompleto } from '../lib/format'
import type { Cliente } from '../types'

interface Props {
  clientes: Cliente[]
  onEdit: (c: Cliente) => void
  onInativar: (c: Cliente) => void
}

function Iniciais({ nome }: { nome: string }) {
  const p = nome.trim().split(/\s+/)
  const txt = (p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')
  return <span className="mono" aria-hidden="true">{txt.toUpperCase()}</span>
}

function Acoes({ c, onEdit, onInativar }: { c: Cliente } & Pick<Props, 'onEdit' | 'onInativar'>) {
  return (
    <div className="acoes">
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => onEdit(c)} aria-label={`Editar ${c.nome}`}>Editar</button>
      <button type="button" className="btn btn-sm btn-ghost btn-warn" onClick={() => onInativar(c)} aria-label={`Inativar ${c.nome}`}>Inativar</button>
    </div>
  )
}

/** Tabela em telas largas; no CSS ela vira cards em telas estreitas. */
export function ClienteLista({ clientes, onEdit, onInativar }: Props) {
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
          <tr key={c.id}>
            <td data-label="Nome">
              <span className="nome-cell"><Iniciais nome={c.nome} /><span>{c.nome}</span></span>
            </td>
            <td data-label="CPF" className="num">{maskCpf(c.cpf)}</td>
            <td data-label="Telefone" className="num">{maskTelefone(c.telefone)}</td>
            <td data-label="Endereço">{enderecoCompleto(c)}</td>
            <td className="acoes-cell"><Acoes c={c} onEdit={onEdit} onInativar={onInativar} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
