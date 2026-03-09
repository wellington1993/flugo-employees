import { useState } from 'react'
import { Box, Button, Typography, Paper, Alert, Stack } from '@mui/material'
import { isFirebaseConfigured } from '@/libs/firebase'
import { getPendingStaffs } from '@/services/local-storage'
import { pushStaffToFirebase } from '@/services/staffs'

export function DebugSync() {
  const [log, setLog] = useState<string[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const clearLocal = () => {
    localStorage.removeItem('flugo_pending_staffs')
    localStorage.removeItem('staff_form_draft')
    addLog('🗑️ Cache local limpo com sucesso.')
  }

  const runDiagnostic = async () => {
    setIsSyncing(true)
    setLog([])
    addLog('--- INICIANDO DIAGNÓSTICO TÉCNICO ---')
    
    addLog(`Firebase Configurado: ${isFirebaseConfigured ? 'SIM' : 'NÃO'}`)
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || ''
    addLog(`Project ID: ${projectId} (Length: ${projectId.length})`)
    addLog(`User Agent: ${navigator.userAgent}`)
    
    const pending = getPendingStaffs()
    addLog(`Itens Pendentes no LocalStorage: ${pending.length}`)

    if (!isFirebaseConfigured) {
      addLog('ERRO CRÍTICO: Configuração ausente ou incompleta.')
      setIsSyncing(false)
      return
    }

    for (const staff of pending) {
      addLog(`Tentando sincronizar: ${staff.email}...`)
      try {
        const ok = await pushStaffToFirebase(staff)
        if (ok) {
          addLog(`✅ SUCESSO: ${staff.email} sincronizado.`)
        } else {
          addLog(`❌ FALHA: Rejeitado pelo Firebase.`)
        }
      } catch (err: any) {
        addLog(`❌ ERRO TÉCNICO: ${err.code || err.message}`)
      }
    }

    addLog('--- DIAGNÓSTICO FINALIZADO ---')
    setIsSyncing(false)
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Painel de Diagnóstico</Typography>
      
      <Alert severity={isFirebaseConfigured ? "success" : "error"} sx={{ mb: 3 }}>
        {isFirebaseConfigured 
          ? "Configuração detectada." 
          : "Variáveis VITE_FIREBASE_* NÃO encontradas."}
      </Alert>

      <Stack direction="row" gap={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={runDiagnostic} 
          disabled={isSyncing}
        >
          {isSyncing ? 'Sincronizando...' : 'Rodar Diagnóstico'}
        </Button>
        
        <Button 
          variant="outlined" 
          color="warning"
          onClick={clearLocal}
          disabled={isSyncing}
        >
          Limpar Registros Locais
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', minHeight: '300px' }}>
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {log.length === 0 && <div>Aguardando comando...</div>}
      </Paper>
    </Box>
  )
}

export default DebugSync
