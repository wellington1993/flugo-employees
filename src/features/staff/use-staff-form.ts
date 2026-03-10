import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { staffSchema, type StaffSchema } from '@/features/staff/validation'
import { useCreateStaff, useStaffs } from '@/features/staff/hooks'

const STEPS = ['Infos Básicas', 'Infos Profissionais']
const STEP_FIELDS: Array<Array<keyof StaffSchema>> = [
  ['name', 'email', 'status'],
  ['department'],
]

/**
 * Hook customizado para gerenciar o formulário de cadastro de funcionários.
 * Segue boas práticas de persistência de rascunho e validação multi-etapas.
 */
export function useStaffForm() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const submittedRef = useRef(false)

  const { data: staffs } = useStaffs()
  const { mutateAsync: createStaff, isPending } = useCreateStaff()

  const draftKey = 'staff_form_draft'

  // Inicialização de valores padrão com suporte a rascunho (LocalStorage)
  const defaultValues = useMemo(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey)
      const draftData = savedDraft ? JSON.parse(savedDraft) : {}
      
      return {
        name: draftData.name ?? '',
        email: draftData.email ?? '',
        status: draftData.status ?? 'ACTIVE',
        department: draftData.department ?? 'TI',
      } as StaffSchema
    } catch {
      return { name: '', email: '', status: 'ACTIVE', department: 'TI' } as StaffSchema
    }
  }, [])

  const form = useForm<StaffSchema>({
    mode: 'onChange',
    resolver: zodResolver(staffSchema),
    defaultValues,
  })

  // Sincronização automática do rascunho enquanto o usuário digita
  const formValues = form.watch()
  useEffect(() => {
    if (!submittedRef.current) {
      localStorage.setItem(draftKey, JSON.stringify(formValues))
    }
  }, [formValues])

  const onSubmit = async (data: StaffSchema) => {
    try {
      const result = await createStaff(data)
      
      // Limpeza imediata do rascunho após sucesso ou salvamento local (offline)
      submittedRef.current = true
      localStorage.removeItem(draftKey)
      
      if (result.synced) {
        setToast({ message: 'Colaborador cadastrado com sucesso!', severity: 'success' })
      } else {
        // Feedback visual amigável para o modo offline
        setToast({ 
          message: `Salvo no dispositivo. Será enviado quando houver internet.`, 
          severity: 'success' 
        })
      }
      
      // Pequeno atraso para o usuário ver o feedback de sucesso antes de mudar de página
      setTimeout(() => navigate('/staffs'), 1500)
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Não foi possível salvar os dados.',
        severity: 'error',
      })
    }
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep]
    
    // Validação de e-mail duplicado (UX Preventiva)
    if (activeStep === 0) {
      const email = form.getValues('email').trim().toLowerCase()
      const isDuplicate = staffs?.some(s => s.email.trim().toLowerCase() === email)
      
      if (isDuplicate) {
        form.setError('email', { 
          type: 'manual', 
          message: 'Este e-mail já está em uso por outro colaborador.' 
        })
        return false
      }
    }

    const isValid = await form.trigger(fields)
    if (!isValid) return false

    // Se for o último passo, submete. Senão, avança.
    if (activeStep === STEPS.length - 1) {
      await form.handleSubmit(onSubmit)()
    } else {
      setActiveStep(prev => prev + 1)
    }
    return true
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/staffs')
    } else {
      setActiveStep(prev => prev - 1)
    }
  }

  return {
    form,
    activeStep,
    steps: STEPS,
    isPending,
    toast,
    setToast,
    handleNext,
    handleBack,
    // Cálculo do progresso visual
    currentProgress: (activeStep / STEPS.length) * 100,
  }
}
