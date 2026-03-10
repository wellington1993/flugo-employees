import { forwardRef } from 'react'
import { TextField, MenuItem, type TextFieldProps } from '@mui/material'

type FlugoSelectProps = TextFieldProps & {
  options: readonly string[] | { label: string; value: string }[]
}

export const FlugoSelect = forwardRef<HTMLDivElement, FlugoSelectProps>(({ options, ...props }, ref) => {
  return (
    <TextField
      {...props}
      ref={ref}
      select
      fullWidth
      variant="outlined"
      slotProps={{
        inputLabel: { shrink: true },
      }}
    >
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value
        const label = typeof option === 'string' ? option : option.label
        return (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        )
      })}
    </TextField>
  )
})

FlugoSelect.displayName = 'FlugoSelect'
