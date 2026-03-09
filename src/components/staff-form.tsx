import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { staffSchema, departments, type StaffSchema } from '@/features/staff/validation'
import { useCreateStaff, useUpdateStaff, useStaffs } from '@/features/staff/hooks'

const steps = ['Infos Básicas', 'Infos Profissionais']

const stepFields: Array<Array<keyof StaffSchema>> = [
  ['name', 'email', 'status'],
  ['department'],
]

type StaffFormProps = {
  staffId?: string
  initialValues?: Partial<StaffSchema>
  isEdit?: boolean
}

export function StaffForm({ staffId, initialValues, isEdit = false }: StaffFormProps) {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const draftKey = isEdit ? null : 'staff_form_draft'
  const submittedRef = useRef(false)

  const { control, handleSubmit, trigger, watch } = useForm<StaffSchema>({
    mode: 'onChange',
    resolver: zodResolver(staffSchema),
    defaultValues: initialValues ?? (draftKey ? JSON.parse(localStorage.getItem(draftKey) || '{}') : undefined) ?? {
      name: '',
      email: '',
      status: 'ACTIVE',
      department: 'TI',
    },
  })

  const formValues = watch()
  useEffect(() => {
    if (draftKey && !submittedRef.current) localStorage.setItem(draftKey, JSON.stringify(formValues))
  }, [formValues, draftKey])

  const { mutateAsync: createStaff, isPending: isCreating } = useCreateStaff()
  const { mutateAsync: updateStaff, isPending: isUpdating } = useUpdateStaff()
  const { data: existingStaffs } = useStaffs()
  const isPending = isCreating || isUpdating

  const onSubmit = async (data: StaffSchema) => {
    try {
      setSubmitError(null)
      if (isEdit && staffId) {
        await updateStaff({ id: staffId, data })
        setSubmitSuccess('Colaborador atualizado com sucesso! Redirecionando...')
      } else {
        await createStaff(data)
        submittedRef.current = true
        if (draftKey) localStorage.removeItem(draftKey)
        setSubmitSuccess('Colaborador cadastrado com sucesso! Redirecionando...')
      }
      setTimeout(() => navigate('/staffs'), 2000)
    } catch (err) {
      setProgress(50)
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    }
  }

  const isLastStep = activeStep === steps.length - 1

  const handleNext = async () => {
    const valid = await trigger(stepFields[activeStep])
    if (!valid) return

    if (isLastStep) {
      setProgress(100)
      await handleSubmit(onSubmit)()
      return
    }

    setProgress((prev) => prev + 100 / steps.length)
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/staffs')
      return
    }
    setProgress((prev) => prev - 100 / steps.length)
    setActiveStep((prev) => prev - 1)
  }

  return (
    <Box minHeight="50vh" display="flex" flexDirection="column" gap={3}>
      <Box>
        <Stack direction="row" alignItems="center" gap={2} mb={0.5}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2" color="text.secondary" minWidth={36}>
            {Math.round(progress)}%
          </Typography>
        </Stack>
      </Box>

      <Box display="flex" gap={5}>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ minWidth: 180 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel
                StepIconComponent={
                  activeStep > index
                    ? () => (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                        </Box>
                      )
                    : undefined
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box flex={1}>
          <Typography variant="h6" fontWeight={600} color="text.secondary" mb={3}>
            {activeStep === 0 ? 'Informações Básicas' : 'Informações Profissionais'}
          </Typography>

          <form>
            <Box sx={{ display: activeStep === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nome"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                rules={{
                  validate: (value) => {
                    if (isEdit) return true
                    const duplicate = existingStaffs?.some(s => s.email === value)
                    return duplicate ? 'E-mail já cadastrado' : true
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="E-mail"
                    type="email"
                    fullWidth
                    placeholder="ex: joao@empresa.com"
                    disabled={isEdit}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={isEdit ? 'Ativo' : 'Ativar ao criar'}
                    control={
                      <Switch
                        {...field}
                        checked={field.value === 'ACTIVE'}
                        onChange={(e) => field.onChange(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                      />
                    }
                  />
                )}
              />
            </Box>

            <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
              <Controller
                name="department"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    label="Departamento"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {departments.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </form>
        </Box>
      </Box>

      {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" mt="auto" pt={2}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          disabled={isPending || !!submitSuccess}
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isPending || !!submitSuccess}
        >
          {isLastStep ? (isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Concluir') : 'Próximo'}
        </Button>
      </Stack>
    </Box>
  )
}

export default StaffForm
