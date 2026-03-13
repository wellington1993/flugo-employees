import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { staffSchema, stepSchemas, type StaffSchema } from '@/features/staff/validation'
import { staffService } from '@/services/staffs'
import { departmentService } from '@/services/departments'
import { type Department } from '../department/types'
import { type Staff } from './types'

const STEPS = ['Informações Básicas', 'Informações Profissionais']

export function useStaffForm(staffId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeStep, setActiveStep] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers] = useState<Staff[]>([])
  const submittedRef = useRef(false)

  const draftKey = 'staff_form_draft'

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [depts, allStaff] = await Promise.all([
          departmentService.getAll(),
          staffService.getAll()
        ])
        setDepartments(depts || [])
        setManagers((allStaff || []).filter(s => s.id !== staffId))
      } catch (e) {
        console.error('Failed to load dependencies', e)
        setDepartments([])
        setManagers([])
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
        status: draftData.status ?? 'ACTIVE',
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
        const data = await staffService.getById(staffId)
        if (data) {
          form.reset({
            name: data.name,
            email: data.email,
            status: data.status,
            departmentId: data.departmentId,
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
  useEffect(() => {
    if (!submittedRef.current && !staffId) {
      localStorage.setItem(draftKey, JSON.stringify(formValues))
    }
  }, [formValues, staffId])

  const onSubmit = async (data: StaffSchema) => {
    setIsPending(true)
    try {
      if (staffId) {
        await staffService.update(staffId, data)
      } else {
        await staffService.create(data)
      }

      await queryClient.invalidateQueries({ queryKey: ['staffs'] })
      await queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' })

      submittedRef.current = true
      localStorage.removeItem(draftKey)

      setToast({ message: 'Colaborador salvo com sucesso!', severity: 'success' })
      setTimeout(() => navigate('/staffs'), 1500)
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Não foi possível salvar os dados.',
        severity: 'error',
      })
    } finally {
      setIsPending(false)
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
      return false
    }

    if (activeStep === 0) {
      const email = form.getValues('email').trim().toLowerCase()
      const allStaff = await staffService.getAll()
      const isDuplicate = allStaff.some(s => s.email.trim().toLowerCase() === email && s.id !== staffId)

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
    currentProgress: ((activeStep + 1) / STEPS.length) * 100,
    departments,
    managers,
  }
}
