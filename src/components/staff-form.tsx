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
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Controller } from 'react-hook-form'
import { departments, type StaffSchema } from '@/features/staff/validation'
import { useStaffForm } from '@/features/staff/use-staff-form'
import { FlugoTextField } from './form/flugo-text-field'
import { FlugoSelect } from './form/flugo-select'

type StaffFormProps = {
  staffId?: string
  initialValues?: Partial<StaffSchema>
  isEdit?: boolean
}

export function StaffForm({ staffId, initialValues, isEdit = false }: StaffFormProps) {
  const {
    form,
    activeStep,
    steps,
    isPending,
    toast,
    setToast,
    handleNext,
    handleBack,
    currentProgress,
    existingStaffs
  } = useStaffForm(staffId, initialValues, isEdit)

  const isLastStep = activeStep === steps.length - 1

  return (
    <Box minHeight="50vh" display="flex" flexDirection="column" gap={3}>
      <Box>
        <Stack direction="row" alignItems="center" gap={2} mb={0.5}>
          <LinearProgress
            variant="determinate"
            value={currentProgress}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2" color="text.secondary" minWidth={36}>
            {currentProgress}%
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="Título"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={form.control}
                rules={{
                  validate: (value) => {
                    if (isEdit) return true
                    const duplicate = existingStaffs?.some(s => s.email === value)
                    return duplicate ? 'E-mail já cadastrado' : true
                  },
                }}
                render={({ field, fieldState }) => (
                  <FlugoTextField
                    {...field}
                    label="E-mail"
                    type="email"
                    placeholder="ex: joao@empresa.com"
                    disabled={isEdit}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="status"
                control={form.control}
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <FlugoSelect
                    {...field}
                    label="Departamento"
                    options={departments}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Box>
          </form>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="space-between" mt="auto" pt={2}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          disabled={isPending}
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isPending}
        >
          {isLastStep ? (isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Concluir') : 'Próximo'}
        </Button>
      </Stack>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StaffForm
