import { Box, type BoxProps } from '@mui/material';

export function Logo(props: BoxProps) {
  return (
    <Box
      component="img"
      src="https://flugo.com.br/images/flugo_hor.png"
      alt="Flugo Logo"
      sx={{
        maxWidth: '100%',
        height: 'auto',
        ...props.sx,
      }}
      {...props}
    />
  );
}
