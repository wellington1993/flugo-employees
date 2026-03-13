import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Grid,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Controller } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useStaffForm } from '@/features/staff/use-staff-form'
import { useConnectivity } from '@/hooks/use-connectivity'
import { FlugoTextField } from './form/flugo-text-field'
import { FlugoSelect } from './form/flugo-select'
import { useState, useEffect } from 'react'
import { FEEDBACK_SNACKBAR_ANCHOR, FEEDBACK_SNACKBAR_DURATION } from '@/components/feedback-config'

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
    duplicateNameWarning,
  } = useStaffForm(resolvedStaffId)

  const isOnline = useConnectivity()
  const isActionDisabled = isPending || !isOnline

  const isLastStep = activeStep === (steps?.length || 2) - 1
  const hierarchyOrder = {
    ENTRY: 0,
    MID: 1,
    SENIOR: 2,
    MANAGER: 3,
  } as const
  const selectedLevel = form.watch('hierarchicalLevel') || 'ENTRY'
  const departmentOptions = (departments || []).map(d => ({ label: d.name, value: d.id || '' }));
  const managerOptions = (managers || [])
    .filter((m) => m.hierarchicalLevel === 'MANAGER')
    .filter((m) => hierarchyOrder[m.hierarchicalLevel] >= hierarchyOrder[selectedLevel])
    .map(m => ({ label: m.name, value: m.id }));
  const hierarchicalLevelOptions = [
    { value: 'ENTRY', label: 'Júnior' },
    { value: 'MID', label: 'Pleno' },
    { value: 'SENIOR', label: 'Sênior' },
    { value: 'MANAGER', label: 'Gestor' },
  ]
  const safeDepartmentValue = (value?: string) =>
    departmentOptions.some((opt) => opt.value === value) ? value : ''
  const safeManagerValue = (value?: string | null) =>
    managerOptions.some((opt) => opt.value === value) ? value : ''
  const managerChainWarning = selectedLevel === 'MANAGER' && !!form.watch('managerId')

  const [localToast, setLocalToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [confirmManagerChainOpen, setConfirmManagerChainOpen] = useState(false)

  useEffect(() => {
    if (toast) setLocalToast(toast)
  }, [toast])

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isLastStep && managerChainWarning) {
      setConfirmManagerChainOpen(true)
      return
    }
    const ok = await handleNextHook()
    if (!ok) return
  }

  const handleConfirmManagerChain = async () => {
    setConfirmManagerChainOpen(false)
    const ok = await handleNextHook()
    if (!ok) return
  }
  const formatBRLCurrency = (value: number | string) => {
    const numericValue = typeof value === 'number'
      ? value
      : Number(String(value).replace(/\D/g, '')) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isNaN(numericValue) ? 0 : numericValue)
  }
  const parseBRLCurrency = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    if (!digitsOnly) return 0
    return Number(digitsOnly) / 100
  }

  useEffect(() => {
    const currentManagerId = form.getValues('managerId')
    if (currentManagerId && !managerOptions.some((opt) => opt.value === currentManagerId)) {
      form.setValue('managerId', '')
    }
  }, [form, managerOptions])

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 4, p: isMobile ? 1 : 2 }}>
      <Box>
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Conexão interrompida. As ações de salvamento estão temporariamente desativadas.
          </Alert>
        )}
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

        <Box flex={1} sx={{ maxWidth: 800 }}>
          <Typography variant="h6" fontWeight={700} mb={4}>{activeStep === 0 ? 'Informações Básicas' : 'Informações Profissionais'}</Typography>
          <form onSubmit={handleNext}>
            <Grid container spacing={3} sx={{ display: activeStep === 0 ? 'flex' : 'none' }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="name" control={form.control} render={({ field, fieldState }) => (
                  <FlugoTextField {...field} disabled={isActionDisabled} label="Nome Completo" autoFocus={activeStep === 0} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              {duplicateNameWarning && (
                <Grid size={12}>
                  <Alert severity="warning">
                    {duplicateNameWarning}
                  </Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="email" control={form.control} render={({ field, fieldState }) => (
                  <FlugoTextField {...field} disabled={isActionDisabled} label="E-mail Corporativo" type="email" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              <Grid size={12}>
                <Controller name="status" control={form.control} render={({ field }) => (
                  <FormControlLabel label="Ativar colaborador" control={<Switch {...field} disabled={isActionDisabled} checked={field.value === 'ACTIVE'} onChange={(e) => field.onChange(e.target.checked ? 'ACTIVE' : 'INACTIVE')} />} />
                )} />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ display: activeStep === 1 ? 'flex' : 'none' }}>
              {managerChainWarning && (
                <Grid size={12}>
                  <Alert severity="info">
                    Atenção: você está criando um vínculo Gestor → Gestor. Confirme a operação para salvar.
                  </Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="departmentId" control={form.control} render={({ field, fieldState }) => (
                  <FlugoSelect {...field} disabled={isActionDisabled} value={safeDepartmentValue(field.value)} label="Selecione o Departamento" options={departmentOptions} autoFocus={activeStep === 1} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="role" control={form.control} render={({ field, fieldState }) => (
                  <FlugoTextField {...field} disabled={isActionDisabled} label="Cargo" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="admissionDate" control={form.control} render={({ field, fieldState }) => (
                  <FlugoTextField {...field} disabled={isActionDisabled} label="Data de Admissão" type="date" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="hierarchicalLevel" control={form.control} render={({ field, fieldState }) => (
                  <FlugoSelect {...field} disabled={isActionDisabled} label="Nível Hierárquico" options={hierarchicalLevelOptions} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="managerId" control={form.control} render={({ field, fieldState }) => (
                  <FlugoSelect {...field} disabled={isActionDisabled} value={safeManagerValue(field.value)} label="Gestor Responsável" options={managerOptions} error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth>
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    {managerOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </FlugoSelect>
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="baseSalary" control={form.control} render={({ field, fieldState }) => (
                    <FlugoTextField
                      disabled={isActionDisabled}
                      label="Salário Base"
                    value={formatBRLCurrency(field.value ?? 0)}
                    onChange={(e) => field.onChange(parseBRLCurrency(e.target.value))}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    inputMode="numeric"
                  />
                )} />
              </Grid>
            </Grid>
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          </form>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="space-between" mt="auto" pt={4} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />} disabled={isActionDisabled}>
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        {isOnline && (
          <Button variant="contained" onClick={handleNext} disabled={isActionDisabled} sx={{ px: 4, fontWeight: 600 }}>
            {isLastStep ? (isPending ? 'Salvando...' : 'Finalizar Cadastro') : 'Próximo Passo'}
          </Button>
        )}
      </Stack>

      <Snackbar open={!!toast} autoHideDuration={FEEDBACK_SNACKBAR_DURATION} onClose={() => setToast(null)} anchorOrigin={FEEDBACK_SNACKBAR_ANCHOR}>
        <Alert severity={localToast?.severity} onClose={() => setToast(null)} variant="filled" sx={{ width: '100%' }}>
          {localToast?.message}
        </Alert>
      </Snackbar>
      <Dialog open={confirmManagerChainOpen} onClose={() => setConfirmManagerChainOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar vínculo Gestor → Gestor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este colaborador possui nível Gestor e também terá um gestor definido. Deseja continuar e salvar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmManagerChainOpen(false)} disabled={isActionDisabled}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmManagerChain} variant="contained" disabled={isActionDisabled}>
            Confirmar e salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StaffForm
