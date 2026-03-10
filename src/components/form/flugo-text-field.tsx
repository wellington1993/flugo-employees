import { forwardRef } from 'react'
import { TextField, type TextFieldProps } from '@mui/material'

export const FlugoTextField = forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => {
  return (
    <TextField
      {...props}
      ref={ref}
      variant="outlined"
      fullWidth
      slotProps={{
        inputLabel: { shrink: true },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#e0e0e0' },
          '&:hover fieldset': { borderColor: '#53bf53' },
        },
        ...props.sx,
      }}
    />
  )
})

FlugoTextField.displayName = 'FlugoTextField'
