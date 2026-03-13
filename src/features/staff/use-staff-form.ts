import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { normalizeStaffEmail, normalizeStaffStatus, staffSchema, stepSchemas, type StaffSchema } from '@/features/staff/validation'
import { container } from '@/infrastructure/container'
import { type Department } from '@/domain/entities/department'
import { type Staff } from '@/domain/entities/staff'
import { isFailure } from '@/core/functional/result'

const STEPS = ['Informações Básicas', 'Informações Profissionais']

export function getDuplicateNameWarning(name: string, staffs: Staff[]): string | null {
  const normalizedName = name.trim().toLowerCase()
  if (!normalizedName) return null
  const hasDuplicateName = staffs.some(
    (staff) => staff.name.trim().toLowerCase() === normalizedName
  )
  return hasDuplicateName
    ? 'Aviso: já existe colaborador com este nome. Você pode continuar e salvar normalmente.'
    : null
}

export function useStaffForm(staffId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeStep, setActiveStep] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers] = useState<Staff[]>([])
  const [allOtherStaffs, setAllOtherStaffs] = useState<Staff[]>([])
  const submittedRef = useRef(false)

  const draftKey = 'staff_form_draft'

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [deptsResult, allStaffResult] = await Promise.all([
          container.departmentRepository.getAll(),
          container.staffRepository.getAll()
        ])
        
        if (isFailure(deptsResult)) throw deptsResult.error
        if (isFailure(allStaffResult)) throw allStaffResult.error

        setDepartments(deptsResult.value || [])
        const filteredStaffs = (allStaffResult.value || []).filter(s => s.id !== staffId)
        setManagers(filteredStaffs)
        setAllOtherStaffs(filteredStaffs)
      } catch (e) {
        console.error('Failed to load dependencies', e)
        setDepartments([])
        setManagers([])
        setAllOtherStaffs([])
      }
    }
    loadDependencies()
  }, [staffId])

  const defaultValues = useMemo(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey)
      const draftData = savedDraft ? JSON.parse(savedDraft) : {}

      return {
        name: draftData.name ?? '',
        email: draftData.email ?? '',
        status: normalizeStaffStatus(draftData.status ?? 'ACTIVE'),
        departmentId: draftData.departmentId ?? '',
        role: draftData.role ?? '',
        admissionDate: draftData.admissionDate ?? new Date().toISOString().split('T')[0],
        hierarchicalLevel: draftData.hierarchicalLevel ?? 'ENTRY',
        managerId: draftData.managerId ?? '',
        baseSalary: draftData.baseSalary ?? 0,
      } as StaffSchema
    } catch {
      return { 
        name: '', 
        email: '', 
        status: 'ACTIVE', 
        departmentId: '',
        role: '',
        admissionDate: new Date().toISOString().split('T')[0],
        hierarchicalLevel: 'ENTRY',
        managerId: '',
        baseSalary: 0
      } as StaffSchema
    }
  }, [])

  const form = useForm<StaffSchema>({
    mode: 'onChange',
    resolver: zodResolver(staffSchema),
    defaultValues,
  })

  useEffect(() => {
    if (staffId) {
      const loadStaff = async () => {
        const result = await container.staffRepository.getById(staffId)
        if (!isFailure(result) && result.value) {
          const data = result.value
          form.reset({
            name: data.name,
            email: data.email,
            status: normalizeStaffStatus(data.status),
            departmentId: data.departmentId ?? '',
            role: data.role,
            admissionDate: data.admissionDate,
            hierarchicalLevel: data.hierarchicalLevel,
            managerId: data.managerId || '',
            baseSalary: data.baseSalary,
          })
        }
      }
      loadStaff()
    }
  }, [staffId, form])

  const formValues = form.watch()
  const watchedName = form.watch('name')
  const duplicateNameWarning = useMemo(() => {
    return getDuplicateNameWarning(watchedName, allOtherStaffs)
  }, [watchedName, allOtherStaffs])

  useEffect(() => {
    if (!submittedRef.current && !staffId) {
      localStorage.setItem(draftKey, JSON.stringify(formValues))
    }
  }, [formValues, staffId])

  const onSubmit = async (data: StaffSchema) => {
    setIsPending(true)
    try {
      let result;
      if (staffId) {
        result = await container.updateStaffUseCase.execute(staffId, data as any)
      } else {
        result = await container.createStaffUseCase.execute(data as any)
      }

      if (!result.success) throw result.error

      await queryClient.invalidateQueries({ queryKey: ['staffs'] })
      await queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' })

      submittedRef.current = true
      localStorage.removeItem(draftKey)

      setToast({ message: 'Colaborador salvo com sucesso!', severity: 'success' })
      setTimeout(() => navigate('/staffs'), 1500)
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message === 'MANAGER_LEVEL_INVALID'
          ? 'O gestor precisa ter nível hierárquico igual ou maior que o colaborador.'
          : err instanceof Error && err.message === 'MANAGER_ROLE_INVALID'
            ? 'Somente colaboradores com cargo de gestão podem ser gestores.'
          : err instanceof Error && err.message === 'MANAGER_SELF_REFERENCE'
            ? 'O colaborador não pode ser o próprio gestor.'
            : err instanceof Error && err.message === 'MANAGER_NOT_FOUND'
              ? 'O gestor selecionado não foi encontrado.'
              : err instanceof Error
                ? err.message
                : 'Não foi possível salvar os dados.'
      setToast({
        message,
        severity: 'error',
      })
    } finally {
      setIsPending(false)
    }
  }

  const handleNext = async () => {
    const currentStepSchema = stepSchemas[activeStep]
    if (!currentStepSchema) return false
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
      const email = normalizeStaffEmail(form.getValues('email'))
      const allStaffResult = await container.staffRepository.getAll()
      if (!isFailure(allStaffResult)) {
        const allStaff = allStaffResult.value
        const isDuplicate = allStaff.some(s => normalizeStaffEmail(s.email) === email && s.id !== staffId)

        if (isDuplicate) {
          form.setError('email', {
            type: 'manual',
            message: 'Este e-mail já está em uso por outro colaborador.'
          })
          return false
        }
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
    currentProgress: ((activeStep + 1) / STEPS.length) * 100,
    departments,
    managers,
    duplicateNameWarning,
  }
}
