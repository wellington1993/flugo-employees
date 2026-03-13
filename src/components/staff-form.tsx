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
import { useStaffForm } from '@/features/staff/use-staff-form'
import { FlugoTextField } from './form/flugo-text-field'
import { FlugoSelect } from './form/flugo-select'

interface StaffFormProps {
  staffId?: string;
}

export function StaffForm({ staffId }: StaffFormProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
  } = useStaffForm(staffId)

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

  return (
    <Box 
      sx={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? 3 : 4,
        p: isMobile ? 1 : 2 
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" gap={2} mb={1}>
          <LinearProgress
            variant="determinate"
            value={currentProgress}
            sx={{ 
              flex: 1, 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': { borderRadius: 4 }
            }}
          />
          <Typography variant="caption" fontWeight={700} color="primary" sx={{ minWidth: 40 }}>
            {Math.round(currentProgress || 0)}%
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Passo {activeStep + 1} de {steps?.length || 2}: {steps?.[activeStep] || ''}
        </Typography>
      </Box>

      <Box 
        display="flex" 
        flexDirection={isMobile ? 'column' : 'row'} 
        gap={isMobile ? 4 : 6}
        sx={{ flex: 1 }}
      >
        <Stepper 
          activeStep={activeStep} 
          orientation={isMobile ? 'horizontal' : 'vertical'} 
          sx={{ 
            minWidth: isMobile ? '100%' : 200,
            '& .MuiStepLabel-label': { fontSize: 13, fontWeight: 500 }
          }}
        >
          {(steps || []).map((label, index) => (
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
                            bgcolor: 'success.main',
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
                {(!isMobile || activeStep === index) && label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box flex={1} sx={{ maxWidth: 600 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" mb={4}>
            {activeStep === 0 ? 'Informações Básicas' : 'Informações Profissionais'}
          </Typography>

          <form onSubmit={handleNext}>
            <Stack 
              spacing={3} 
              sx={{ display: activeStep === 0 ? 'flex' : 'none' }}
            >
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="Nome Completo"
                    placeholder="ex: João da Silva"
                    autoFocus={activeStep === 0}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="E-mail Corporativo"
                    type="email"
                    placeholder="ex: joao@empresa.com"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Ativar colaborador imediatamente"
                    sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: 14, color: 'text.secondary' } }}
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
            </Stack>

            <Stack 
              spacing={3} 
              sx={{ display: activeStep === 1 ? 'flex' : 'none' }}
            >
              <Controller
                name="departmentId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoSelect
                    {...field}
                    label="Selecione o Departamento"
                    options={departmentOptions}
                    autoFocus={activeStep === 1}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="Cargo"
                    placeholder="ex: Desenvolvedor Senior"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                <Controller
                  name="admissionDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FlugoTextField
                      {...field}
                      label="Data de Admissão"
                      type="date"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="hierarchicalLevel"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FlugoSelect
                      {...field}
                      label="Nível Hierárquico"
                      options={hierarchicalLevelOptions}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>
              <Controller
                name="managerId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoSelect
                    {...field}
                    label="Gestor Responsável"
                    options={managerOptions}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  >
                     <MenuItem value=""><em>Nenhum</em></MenuItem>
                     {managerOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </FlugoSelect>
                )}
              />
              <Controller
                name="baseSalary"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="Salário Base"
                    type="number"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
            
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          </form>
        </Box>
      </Box>

      <Stack 
        direction="row" 
        justifyContent="space-between" 
        mt="auto" 
        pt={4}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          disabled={isPending}
          sx={{ 
            borderColor: 'grey.300', 
            color: 'text.secondary',
            px: 3,
            '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' }
          }}
        >
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isPending}
          sx={{ px: 4, fontWeight: 600, boxShadow: 0 }}
        >
          {isLastStep ? (isPending ? 'Salvando...' : 'Finalizar Cadastro') : 'Próximo Passo'}
        </Button>
      </Stack>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={toast?.severity} 
          onClose={() => setToast(null)} 
          variant="filled"
          sx={{ width: '100%', boxShadow: theme.shadows[3] }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StaffForm
