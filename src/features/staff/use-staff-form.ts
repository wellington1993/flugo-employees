import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { staffSchema, type StaffSchema } from '@/features/staff/validation'
import { useCreateStaff, useUpdateStaff, useStaffs } from '@/features/staff/hooks'

const STEPS = ['Infos Básicas', 'Infos Profissionais']
const STEP_FIELDS: Array<Array<keyof StaffSchema>> = [
  ['name', 'email', 'status'],
  ['department'],
]

export function useStaffForm(staffId?: string, initialValues?: Partial<StaffSchema>, isEdit = false) {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const submittedRef = useRef(false)

  // Hooks do TanStack Query chamados no topo (Sempre na mesma ordem)
  const { data: staffs } = useStaffs()
  const { mutateAsync: createStaff, isPending: isCreating } = useCreateStaff()
  const { mutateAsync: updateStaff, isPending: isUpdating } = useUpdateStaff()

  const draftKey = isEdit ? null : 'staff_form_draft'

  // Memoize default values to prevent unnecessary re-renders of the form
  const defaultValues = useMemo(() => {
    const savedDraft = draftKey ? localStorage.getItem(draftKey) : null
    const draftData = savedDraft ? JSON.parse(savedDraft) : {}
    
    return {
      name: initialValues?.name ?? draftData.name ?? '',
      email: initialValues?.email ?? draftData.email ?? '',
      status: initialValues?.status ?? draftData.status ?? 'ACTIVE',
      department: initialValues?.department ?? draftData.department ?? 'TI',
    } as StaffSchema
  }, [initialValues, draftKey])

  const form = useForm<StaffSchema>({
    mode: 'onChange',
    resolver: zodResolver(staffSchema),
    defaultValues,
  })

  // Sincronização de rascunho
  const formValues = form.watch()
  useEffect(() => {
    if (draftKey && !submittedRef.current) {
      localStorage.setItem(draftKey, JSON.stringify(formValues))
    }
  }, [formValues, draftKey])

  const onSubmit = async (data: StaffSchema) => {
    try {
      if (isEdit && staffId) {
        await updateStaff({ id: staffId, data })
        setToast({ message: 'Colaborador atualizado com sucesso!', severity: 'success' })
      } else {
        const result = await createStaff(data)
        submittedRef.current = true
        if (draftKey) localStorage.removeItem(draftKey)
        
        if (result.synced) {
          setToast({ message: 'Colaborador cadastrado com sucesso!', severity: 'success' })
        } else {
          setToast({ 
            message: `Salvo localmente. Sincronização pendente (${result.error || 'offline'})`, 
            severity: 'success' 
          })
        }
      }
      setTimeout(() => navigate('/staffs'), 1500)
    } catch (err: any) {
      setToast({
        message: err.message || 'Erro inesperado ao salvar.',
        severity: 'error',
      })
    }
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep]
    
    // Validação manual de e-mail duplicado apenas se for novo registro
    if (activeStep === 0 && !isEdit) {
      const email = form.getValues('email')
      const isDuplicate = staffs?.some(s => s.email === email && !s._pendingSync)
      if (isDuplicate) {
        form.setError('email', { message: 'Este e-mail já está em uso no servidor.' })
        return false
      }
    }

    const isValid = await form.trigger(fields)
    if (!isValid) return false

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
    isPending: isCreating || isUpdating,
    toast,
    setToast,
    handleNext,
    handleBack,
    currentProgress: activeStep === 0 ? 0 : activeStep === 1 ? 50 : 100,
  }
}
