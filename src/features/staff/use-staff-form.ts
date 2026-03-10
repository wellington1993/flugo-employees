import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { staffSchema, stepSchemas, type StaffSchema } from '@/features/staff/validation'
import { useCreateStaff, useStaffs } from '@/features/staff/hooks'

const STEPS = ['Infos Básicas', 'Infos Profissionais']

export function useStaffForm() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const submittedRef = useRef(false)

  const { data: staffs } = useStaffs()
  const { mutateAsync: createStaff, isPending } = useCreateStaff()

  const draftKey = 'staff_form_draft'

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

  const formValues = form.watch()
  useEffect(() => {
    if (!submittedRef.current) {
      localStorage.setItem(draftKey, JSON.stringify(formValues))
    }
  }, [formValues])

  const onSubmit = async (data: StaffSchema) => {
    try {
      await createStaff(data)
      
      submittedRef.current = true
      localStorage.removeItem(draftKey)
      
      setToast({ message: 'Colaborador cadastrado com sucesso!', severity: 'success' })
      setTimeout(() => navigate('/staffs'), 2000)
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Não foi possível salvar os dados.',
        severity: 'error',
      })
    }
  }

  const handleNext = async () => {
    const currentStepSchema = stepSchemas[activeStep]
    const currentStepValues = form.getValues()
    
    const stepValidation = await currentStepSchema.safeParseAsync(currentStepValues)
    
    if (!stepValidation.success) {
      stepValidation.error.issues.forEach((issue) => {
        form.setError(issue.path[0] as any, { 
          message: issue.message 
        })
      })
      setToast({ message: 'Verifique os campos marcados em vermelho.', severity: 'error' })
      return false
    }

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
    currentProgress: (activeStep / STEPS.length) * 100,
  }
}
