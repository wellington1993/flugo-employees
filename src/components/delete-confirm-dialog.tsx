import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

type DeleteConfirmDialogProps = {
  open: boolean
  staffName?: string
  title?: string
  description?: string
  onConfirm: () => void
  onCancel?: () => void
  onClose?: () => void
  isLoading?: boolean
  loading?: boolean
}

export function DeleteConfirmDialog({
  open,
  staffName,
  title,
  description,
  onConfirm,
  onCancel,
  onClose,
  isLoading,
  loading,
}: DeleteConfirmDialogProps) {
  const handleClose = onClose ?? onCancel ?? (() => {})
  const busy = loading ?? isLoading ?? false
  const resolvedTitle = title ?? 'Excluir colaborador'
  const resolvedDescription =
    description ??
    `Tem certeza que deseja excluir ${staffName ? `"${staffName}"` : 'este registro'}? Essa ação não pode ser desfeita.`

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{resolvedTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{resolvedDescription}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={busy}>
          {busy ? 'Excluindo...' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
