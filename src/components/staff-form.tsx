import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Controller } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useStaffForm } from '@/features/staff/use-staff-form'
import { FlugoTextField } from './form/flugo-text-field'
import { FlugoSelect } from './form/flugo-select'
import { useState, useEffect } from 'react'

interface StaffFormProps {
  staffId?: string;
}

export function StaffForm({ staffId }: StaffFormProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const params = useParams<{ staffId: string }>()
  const resolvedStaffId = staffId ?? params.staffId

  const {
    form,
    activeStep,
    steps,
    isPending,
    toast,
    setToast,
    handleNext: handleNextHook,
    handleBack,
    currentProgress,
    departments = [],
    managers = [],
  } = useStaffForm(resolvedStaffId)

  // Estado local para evitar o erro "node is null" do MUI Grow quando o toast limpa antes da animação terminar
  const [localToast, setLocalToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) setLocalToast(toast)
  }, [toast])

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const ok = await handleNextHook()
    if (!ok) {
      setToast({ message: 'Verifique os campos marcados em vermelho.', severity: 'error' })
    }
  }

  const isLastStep = activeStep === (steps?.length || 2) - 1
  const departmentOptions = (departments || []).map(d => ({ label: d.name, value: d.id || '' }));
  const managerOptions = (managers || []).map(m => ({ label: m.name, value: m.id }));
  const hierarchicalLevelOptions = [
    { value: 'ENTRY', label: 'Júnior' },
    { value: 'MID', label: 'Pleno' },
    { value: 'SENIOR', label: 'Sênior' },
    { value: 'LEAD', label: 'Líder' },
    { value: 'MANAGER', label: 'Gerente' },
    { value: 'DIRECTOR', label: 'Diretor' },
  ]
  const safeDepartmentValue = (value?: string) =>
    departmentOptions.some((opt) => opt.value === value) ? value : ''
  const safeManagerValue = (value?: string | null) =>
    managerOptions.some((opt) => opt.value === value) ? value : ''

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 4, p: isMobile ? 1 : 2 }}>
      <Box>
        <Stack direction="row" alignItems="center" gap={2} mb={1}>
          <LinearProgress
            variant="determinate"
            value={currentProgress}
            sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'grey.100' }}
          />
          <Typography variant="caption" fontWeight={700} color="primary" sx={{ minWidth: 40 }}>
            {Math.round(currentProgress || 0)}%
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Passo {activeStep + 1} de {steps?.length || 2}: {steps?.[activeStep] || ''}
        </Typography>
      </Box>

      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 4 : 6} sx={{ flex: 1 }}>
        <Stepper activeStep={activeStep} orientation={isMobile ? 'horizontal' : 'vertical'} sx={{ minWidth: isMobile ? '100%' : 200 }}>
          {(steps || []).map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel
                StepIconComponent={activeStep > index ? () => (
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                  </Box>
                ) : undefined}
              >
                {(!isMobile || activeStep === index) && label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box flex={1} sx={{ maxWidth: 600 }}>
          <Typography variant="h6" fontWeight={700} mb={4}>{activeStep === 0 ? 'Informações Básicas' : 'Informações Profissionais'}</Typography>
          <form onSubmit={handleNext}>
            <Stack spacing={3} sx={{ display: activeStep === 0 ? 'flex' : 'none' }}>
              <Controller name="name" control={form.control} render={({ field, fieldState }) => (
                <FlugoTextField {...field} label="Nome Completo" autoFocus={activeStep === 0} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />
              <Controller name="email" control={form.control} render={({ field, fieldState }) => (
                <FlugoTextField {...field} label="E-mail Corporativo" type="email" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />
              <Controller name="status" control={form.control} render={({ field }) => (
                <FormControlLabel label="Ativar colaborador" control={<Switch {...field} checked={field.value === 'ACTIVE'} onChange={(e) => field.onChange(e.target.checked ? 'ACTIVE' : 'INACTIVE')} />} />
              )} />
            </Stack>

            <Stack spacing={3} sx={{ display: activeStep === 1 ? 'flex' : 'none' }}>
              <Controller name="departmentId" control={form.control} render={({ field, fieldState }) => (
                <FlugoSelect {...field} value={safeDepartmentValue(field.value)} label="Selecione o Departamento" options={departmentOptions} autoFocus={activeStep === 1} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />
              <Controller name="role" control={form.control} render={({ field, fieldState }) => (
                <FlugoTextField {...field} label="Cargo" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                <Controller name="admissionDate" control={form.control} render={({ field, fieldState }) => (
                  <FlugoTextField {...field} label="Data de Admissão" type="date" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
                <Controller name="hierarchicalLevel" control={form.control} render={({ field, fieldState }) => (
                  <FlugoSelect {...field} label="Nível Hierárquico" options={hierarchicalLevelOptions} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Stack>
              <Controller name="managerId" control={form.control} render={({ field, fieldState }) => (
                <FlugoSelect {...field} value={safeManagerValue(field.value)} label="Gestor Responsável" options={managerOptions} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth>
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {managerOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </FlugoSelect>
              )} />
              <Controller name="baseSalary" control={form.control} render={({ field, fieldState }) => (
                <FlugoTextField {...field} label="Salário Base" type="number" onChange={(e) => field.onChange(Number(e.target.value))} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />
            </Stack>
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          </form>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="space-between" mt="auto" pt={4} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />} disabled={isPending}>
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={isPending} sx={{ px: 4, fontWeight: 600 }}>
          {isLastStep ? (isPending ? 'Salvando...' : 'Finalizar Cadastro') : 'Próximo Passo'}
        </Button>
      </Stack>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={localToast?.severity} onClose={() => setToast(null)} variant="filled" sx={{ width: '100%' }}>
          {localToast?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StaffForm
