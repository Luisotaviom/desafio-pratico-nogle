import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, atualizarCliente, criarCliente } from '../api/clientes'
import { useCepLookup } from '../hooks/useCepLookup'
import { maskCep, maskCpf, maskTelefone, onlyDigits } from '../lib/format'
import { validateAll, validateField } from '../lib/validation'
import type { Cliente, ClienteInput, FieldErrors } from '../types'
import { Dialog } from './Dialog'
import { Field } from './Field'

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSaved: (c: Cliente, criado: boolean) => void
}

const vazio: ClienteInput = {
  nome: '', cpf: '', telefone: '', cep: '', cidade: '', estado: '',
  endereco: '', bairro: '', numero: '', complemento: '',
}

function inicial(c: Cliente | null): ClienteInput {
  if (!c) return vazio
  return {
    nome: c.nome, cpf: maskCpf(c.cpf), telefone: maskTelefone(c.telefone), cep: maskCep(c.cep),
    cidade: c.cidade, estado: c.estado, endereco: c.endereco, bairro: c.bairro,
    numero: c.numero, complemento: c.complemento ?? '',
  }
}

export function ClienteModal({ cliente, onClose, onSaved }: Props) {
  const [values, setValues] = useState<ClienteInput>(() => inicial(cliente))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Ponto de extensão: quando a consulta de CEP devolver dados, preenche (continuam editáveis).
  const cepData = useCepLookup(onlyDigits(values.cep))
  useEffect(() => {
    if (!cepData) return
    setValues((v) => ({
      ...v,
      endereco: cepData.endereco || v.endereco,
      bairro: cepData.bairro || v.bairro,
      cidade: cepData.cidade || v.cidade,
      estado: cepData.estado || v.estado,
    }))
    setErrors((e) => ({ ...e, endereco: undefined, bairro: undefined, cidade: undefined, estado: undefined }))
  }, [cepData])

  const set = (name: keyof ClienteInput, mask?: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = mask ? mask(e.target.value) : e.target.value
      setValues((prev) => ({ ...prev, [name]: v }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

  const blur = (name: keyof ClienteInput) => () => {
    const msg = validateField(name, values)
    setErrors((prev) => ({ ...prev, [name]: msg }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found = validateAll(values)
    if (Object.keys(found).length) {
      setErrors(found)
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      // aria-invalid só chega ao DOM após render; foca no primeiro campo com erro depois dele.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    const payload: ClienteInput = {
      nome: values.nome.trim(),
      cpf: onlyDigits(values.cpf),
      telefone: onlyDigits(values.telefone),
      cep: onlyDigits(values.cep),
      cidade: values.cidade.trim(),
      estado: values.estado.trim().toUpperCase(),
      endereco: values.endereco.trim(),
      bairro: values.bairro.trim(),
      numero: values.numero.trim(),
      complemento: values.complemento?.trim() || null,
    }
    setSaving(true)
    setFormError(null)
    try {
      const saved = cliente ? await atualizarCliente(cliente.id, payload) : await criarCliente(payload)
      onSaved(saved, !cliente)
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields as FieldErrors)
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Erro inesperado ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  const f = (name: keyof ClienteInput) => ({
    id: `f-${name}`,
    name,
    value: values[name] ?? '',
    error: errors[name],
    onBlur: blur(name),
  })

  return (
    <Dialog titleId="modal-titulo" onClose={onClose} busy={saving} className="dialog-form">
      <form ref={formRef} onSubmit={submit} noValidate>
        <header className="dialog-head">
          <h2 id="modal-titulo">{cliente ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose} disabled={saving}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="dialog-body">
          <div className="grid">
            <Field {...f('nome')} label="Nome" span={6} autoFocus autoComplete="off" onChange={set('nome')} />
            <Field {...f('cpf')} label="CPF" span={3} inputMode="numeric" placeholder="000.000.000-00" onChange={set('cpf', maskCpf)} />
            <Field {...f('telefone')} label="Telefone" span={3} inputMode="tel" placeholder="(00) 00000-0000" onChange={set('telefone', maskTelefone)} />
            <Field {...f('cep')} label="CEP" span={2} inputMode="numeric" placeholder="00000-000" onChange={set('cep', maskCep)} />
            <Field {...f('cidade')} label="Cidade" span={3} onChange={set('cidade')} />
            <Field {...f('estado')} label="Estado" span={1} maxLength={2} placeholder="UF" autoCapitalize="characters" onChange={(e) => set('estado', (v) => v.toUpperCase().replace(/[^A-Z]/g, ''))(e)} />
            <Field {...f('endereco')} label="Endereço" span={4} onChange={set('endereco')} />
            <Field {...f('numero')} label="Número" span={2} onChange={set('numero')} />
            <Field {...f('bairro')} label="Bairro" span={3} onChange={set('bairro')} />
            <Field {...f('complemento')} label="Complemento" span={3} optional onChange={set('complemento')} />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
        </div>

        <footer className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner" aria-hidden="true" />}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </form>
    </Dialog>
  )
}
