import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { departmentSchema } from '../validation'
import { container } from '@/infrastructure/container'
import type { Department as DepartmentEntity } from '@/domain/entities/department'
import type { Department } from '@/features/department/types'
import type { Staff } from '@/domain/entities/staff'
import { isFailure } from '@/core/functional/result'
import { FlugoSelect } from '@/components/form/flugo-select'
import { FlugoTextField } from '@/components/form/flugo-text-field'
import { FEEDBACK_SNACKBAR_ANCHOR, FEEDBACK_SNACKBAR_DURATION } from '@/components/feedback-config'
import { useConnectivity } from '@/hooks/use-connectivity'

interface DepartmentFormProps {
  onCancel: () => void
  onSaved: () => void
  department?: Department | null
}

type DepartmentFormData = z.input<typeof departmentSchema>
const STEPS = ['Informações do Departamento', 'Colaboradores']

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ onCancel, onSaved, department }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isOnline = useConnectivity()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [allDepartments, setAllDepartments] = useState<DepartmentEntity[]>([])
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [localToast, setLocalToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [removedTransferDepartmentId, setRemovedTransferDepartmentId] = useState('')

  const managerOptions = useMemo(
    () => [{ label: 'Nenhum', value: '' }, ...allStaff.filter((s) => s.hierarchicalLevel === 'MANAGER').map((s) => ({ label: s.name, value: s.id }))],
    [allStaff]
  )

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '', managerId: '', staffIds: [] },
  })

  const selectedManagerId = watch('managerId')
  const selectedStaffIds = (watch('staffIds') ?? []) as string[]
  const selectedStaffSet = useMemo(() => new Set(selectedStaffIds), [selectedStaffIds])
  const currentDepartmentId = department?.id ?? null

  const filteredStaff = useMemo(() => {
    return allStaff.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allStaff, searchTerm])

  const selectedStaff = useMemo(
    () => allStaff.filter((staff) => selectedStaffSet.has(staff.id)),
    [allStaff, selectedStaffSet]
  )
  const selectedStaffCount = selectedStaff.length
  const selectedPreview = selectedStaff.slice(0, 5)

  const transferInCount = useMemo(() => {
    return allStaff
      .filter(s => selectedStaffSet.has(s.id))
      .filter(s => s.departmentId && s.departmentId !== currentDepartmentId).length
  }, [allStaff, selectedStaffSet, currentDepartmentId])

  const removedCount = useMemo(() => {
    if (!currentDepartmentId) return 0
    const original = new Set(department?.staffIds ?? [])
    return [...original].filter((id) => !selectedStaffSet.has(id)).length
  }, [currentDepartmentId, department?.staffIds, selectedStaffSet])

  const transferByDepartment = useMemo(() => {
    const transferMap = new Map<string, number>()
    selectedStaff
      .filter((staff) => staff.departmentId && staff.departmentId !== currentDepartmentId)
      .forEach((staff) => {
        const sourceName = allDepartments.find((dept) => dept.id === staff.departmentId)?.name ?? 'Sem departamento'
        transferMap.set(sourceName, (transferMap.get(sourceName) ?? 0) + 1)
      })
    return Array.from(transferMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [allDepartments, currentDepartmentId, selectedStaff])

  useEffect(() => {
    if (toast) setLocalToast(toast)
  }, [toast])

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [staffsResult, deptsResult] = await Promise.all([
          container.staffRepository.getAll(),
          container.departmentRepository.getAll(),
        ])
        if (isFailure(staffsResult)) throw staffsResult.error
        if (isFailure(deptsResult)) throw deptsResult.error
        setAllStaff(staffsResult.value || [])
        setAllDepartments(deptsResult.value || [])
      } catch {
        setAllStaff([])
        setAllDepartments([])
      }
    }
    loadDependencies()
  }, [])

  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        description: department.description || '',
        managerId: department.managerId || '',
        staffIds: (department.staffIds ?? []) as string[],
      })
      return
    }
    reset({ name: '', description: '', managerId: '', staffIds: [] })
  }, [department, reset])

  useEffect(() => {
    if (selectedManagerId && !managerOptions.some((opt) => opt.value === selectedManagerId)) {
      setValue('managerId', '')
    }
  }, [managerOptions, selectedManagerId, setValue])

  useEffect(() => {
    if (removedCount === 0) {
      setRemovedTransferDepartmentId('')
    }
  }, [removedCount])

  useEffect(() => {
    if (!selectedStaffIds.length || !allStaff.length) return
    const validStaffIds = new Set(allStaff.map((staff) => staff.id))
    const sanitized = selectedStaffIds.filter((id) => validStaffIds.has(id))
    if (sanitized.length !== selectedStaffIds.length) {
      setValue('staffIds', sanitized)
    }
  }, [allStaff, selectedStaffIds, setValue])

  const toggleStaff = (staffId: string) => {
    const next = new Set(selectedStaffSet)
    if (next.has(staffId)) next.delete(staffId)
    else next.add(staffId)
    setValue('staffIds', Array.from(next))
  }

  const submitDepartment = async (data: DepartmentFormData) => {
    setLoading(true)
    try {
      const payload: Omit<DepartmentEntity, 'id' | 'createdAt'> = {
        name: data.name,
        description: data.description,
        managerId: data.managerId,
        staffIds: (data.staffIds ?? []) as string[],
      }
      const result = department?.id
        ? await container.departmentRepository.update(department.id, payload, {
            transferRemovedToDepartmentId: removedCount > 0 ? removedTransferDepartmentId : undefined,
          })
        : await container.departmentRepository.create(payload)
      if (!result.success) throw result.error

      setToast({ message: 'Departamento salvo com sucesso.', severity: 'success' })
      onSaved()
    } catch (error) {
      setToast({
        message: error instanceof Error && error.message === 'DUPLICATE_DEPARTMENT_NAME'
          ? 'Já existe um departamento com esse nome.'
          : error instanceof Error && error.message === 'DEPARTMENT_STAFF_REMOVAL_REQUIRES_TRANSFER'
            ? 'Não foi possível concluir: transfira os colaboradores removidos para outro departamento antes de salvar.'
            : error instanceof Error && error.message === 'DEPARTMENT_TRANSFER_TARGET_INVALID'
              ? 'Selecione um departamento de destino válido para os colaboradores removidos.'
            : 'Não foi possível salvar o departamento.',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (activeStep === 0) {
      const base = await departmentSchema.pick({ name: true, description: true, managerId: true }).safeParseAsync({
        name: watch('name'),
        description: watch('description'),
        managerId: watch('managerId'),
      })
      if (!base.success) {
        setToast({ message: 'Preencha os campos obrigatórios da etapa.', severity: 'error' })
        return
      }
      setActiveStep(1)
      return
    }
    setConfirmOpen(true)
  }

  const handleBack = () => {
    if (activeStep === 0) {
      onCancel()
      return
    }
    setActiveStep((prev) => prev - 1)
  }

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Conexão interrompida. As ações de salvamento estão temporariamente desativadas.
        </Alert>
      )}
      <Box mb={3}>
        <Stack direction="row" alignItems="center" gap={2} mb={1}>
          <LinearProgress variant="determinate" value={((activeStep + 1) / STEPS.length) * 100} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'grey.100' }} />
          <Typography variant="caption" fontWeight={700} color="primary">{Math.round(((activeStep + 1) / STEPS.length) * 100)}%</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">Passo {activeStep + 1} de {STEPS.length}: {STEPS[activeStep]}</Typography>
      </Box>

      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 3 : 5}>
        <Stepper activeStep={activeStep} orientation={isMobile ? 'horizontal' : 'vertical'} sx={{ minWidth: isMobile ? '100%' : 220 }}>
          {STEPS.map((step, index) => (
            <Step key={step} completed={activeStep > index}>
              <StepLabel StepIconComponent={activeStep > index ? () => <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon sx={{ fontSize: 14, color: '#fff' }} /></Box> : undefined}>
                {(!isMobile || activeStep === index) && step}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box flex={1}>
          <form onSubmit={handleNext}>
            <Grid container spacing={3} sx={{ display: activeStep === 0 ? 'flex' : 'none' }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="name" control={control} render={({ field }) => (
                  <FlugoTextField {...field} label="Nome do Departamento" fullWidth error={!!errors.name} helperText={errors.name?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="managerId" control={control} render={({ field }) => (
                  <FlugoSelect {...field} value={managerOptions.some((opt) => opt.value === (field.value ?? '')) ? (field.value ?? '') : ''} label="Gestor Responsável" options={managerOptions} fullWidth>
                    {managerOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FlugoSelect>
                )} />
              </Grid>
              <Grid size={12}>
                <Controller name="description" control={control} render={({ field }) => (
                  <FlugoTextField {...field} label="Descrição" multiline rows={3} fullWidth error={!!errors.description} helperText={errors.description?.message} />
                )} />
              </Grid>
            </Grid>

            <Stack spacing={2} sx={{ display: activeStep === 1 ? 'flex' : 'none' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Passo 2/2 · Colaboradores
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revise o impacto e abra o painel lateral para ajustar a seleção.
                  </Typography>
                </Box>
                <Button variant="contained" onClick={() => setStaffDrawerOpen(true)} disabled={!isOnline}>
                  Gerenciar colaboradores
                </Button>
              </Stack>

              <Grid container spacing={1.5}>
                {[
                  { label: 'Selecionados', value: selectedStaffCount },
                  { label: 'Serão transferidos', value: transferInCount },
                  { label: 'Removidos', value: removedCount },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Seleção atual
                  </Typography>
                  {selectedPreview.length > 0 ? (
                    <>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {selectedPreview.map((staff) => (
                          <Chip key={staff.id} size="small" label={staff.name} />
                        ))}
                      </Stack>
                      {selectedStaffCount > selectedPreview.length && (
                        <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => setStaffDrawerOpen(true)}>
                          Ver todos no painel
                        </Button>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum colaborador selecionado.
                    </Typography>
                  )}
                </Stack>
              </Paper>

              <Alert severity="info">
                Ao salvar, colaboradores de outros departamentos serão transferidos automaticamente para este.
              </Alert>

              {removedCount > 0 && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.light', borderColor: 'warning.main', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="warning.dark" gutterBottom>
                    Transferência Obrigatória
                  </Typography>
                  <Typography variant="body2" color="warning.dark" mb={2}>
                    Você removeu {removedCount} colaborador(es) deste departamento. Escolha para onde eles devem ser transferidos:
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    label="Departamento de destino"
                    size="small"
                    value={removedTransferDepartmentId}
                    onChange={(event) => setRemovedTransferDepartmentId(event.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                    required
                  >
                    {allDepartments
                      .filter((deptItem) => deptItem.id !== currentDepartmentId)
                      .map((deptItem) => (
                        <MenuItem key={deptItem.id} value={deptItem.id}>
                          {deptItem.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Paper>
              )}
            </Stack>

            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          </form>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="space-between" mt={4} pt={3} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />} disabled={loading || !isOnline}>
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={loading || !isOnline}>
          {activeStep === STEPS.length - 1 ? (loading ? 'Salvando...' : 'Salvar Departamento') : 'Próximo Passo'}
        </Button>
      </Stack>

      <Drawer
        anchor="right"
        open={staffDrawerOpen}
        onClose={() => setStaffDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460, md: 520 },
            p: 2,
          },
        }}
      >
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={700}>Gerenciar colaboradores</Typography>
              <Typography variant="body2" color="text.secondary">
                Selecione quem deve ficar vinculado ao departamento.
              </Typography>
            </Box>
            <IconButton onClick={() => setStaffDrawerOpen(false)} aria-label="Fechar painel">
              <CloseIcon />
            </IconButton>
          </Stack>

          <TextField
            placeholder="Buscar por nome ou e-mail"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: 2 }}>
            <List sx={{ p: 0 }}>
              {filteredStaff.map((staff, index) => {
                const sourceDept = allDepartments.find((deptItem) => deptItem.id === staff.departmentId)?.name ?? 'Sem departamento'
                const isSelected = selectedStaffSet.has(staff.id)
                const initials = staff.name.split(' ').map((namePart) => namePart[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <React.Fragment key={staff.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => toggleStaff(staff.id)} selected={isSelected} disabled={!isOnline}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
                            {initials}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{staff.name}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {staff.email} • {sourceDept}
                            </Typography>
                          }
                        />
                        {isSelected && <Chip size="small" color="primary" label="Selecionado" />}
                      </ListItemButton>
                    </ListItem>
                    {index < filteredStaff.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                )
              })}
              {filteredStaff.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Nenhum colaborador encontrado.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Stack>
      </Drawer>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
         <DialogTitle>Confirmar alterações no departamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {transferInCount > 0 ? `${transferInCount} colaborador(es) serão transferidos para este departamento. ` : ''}
             {removedCount > 0 ? `${removedCount} colaborador(es) foram removidos da seleção e podem exigir transferência explícita antes da confirmação.` : ''}
            {transferInCount === 0 && removedCount === 0 ? 'Revise os dados e confirme para salvar este departamento.' : ''}
          </DialogContentText>
          {transferByDepartment.length > 0 && (
            <Stack mt={2} spacing={0.5}>
              {transferByDepartment.map((item) => (
                <Typography key={item.name} variant="body2" color="text.secondary">
                  • {item.count} de "{item.name}"
                </Typography>
              ))}
            </Stack>
          )}
          {removedCount > 0 && !removedTransferDepartmentId && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Selecione o departamento de destino dos colaboradores removidos para concluir o salvamento.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setConfirmOpen(false)
              await handleSubmit(submitDepartment)()
            }}
            disabled={loading || !isOnline || (removedCount > 0 && !removedTransferDepartmentId)}
          >
            Confirmar e Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!localToast} autoHideDuration={FEEDBACK_SNACKBAR_DURATION} onClose={() => { setToast(null); setLocalToast(null) }} anchorOrigin={FEEDBACK_SNACKBAR_ANCHOR}>
        <Alert severity={localToast?.severity} onClose={() => { setToast(null); setLocalToast(null) }} variant="filled" sx={{ width: '100%' }}>
          {localToast?.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

export default DepartmentForm
