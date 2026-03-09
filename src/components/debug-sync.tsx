import { useState } from 'react'
import { Box, Button, Typography, Paper, Divider, Alert } from '@mui/material'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { getPendingStaffs } from '@/services/local-storage'
import { pushStaffToFirebase } from '@/services/staffs'

export function DebugSync() {
  const [log, setLog] = useState<string[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const runDiagnostic = async () => {
    setIsSyncing(true)
    setLog([])
    addLog('--- INICIANDO DIAGNÓSTICO TÉCNICO ---')
    
    addLog(`Firebase Configurado: ${isFirebaseConfigured ? 'SIM' : 'NÃO'}`)
    addLog(`User Agent: ${navigator.userAgent}`)
    
    const pending = getPendingStaffs()
    addLog(`Itens Pendentes no LocalStorage: ${pending.length}`)

    if (!isFirebaseConfigured) {
      addLog('ERRO CRÍTICO: O build da Vercel não possui as chaves VITE_FIREBASE_*.')
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
          addLog(`❌ FALHA: ${staff.email} rejeitado pelo Firebase (ver console F12).`)
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
      <Typography variant="h4" gutterBottom>Painel de Diagnóstico Oculto</Typography>
      
      <Alert severity={isFirebaseConfigured ? "success" : "error"} sx={{ mb: 3 }}>
        {isFirebaseConfigured 
          ? "Configuração detectada. Pronto para testar conexão." 
          : "Variáveis de ambiente VITE_FIREBASE_* NÃO encontradas."}
      </Alert>

      <Button 
        variant="contained" 
        onClick={runDiagnostic} 
        disabled={isSyncing}
        sx={{ mb: 3 }}
      >
        {isSyncing ? 'Sincronizando...' : 'Forçar Sincronização e Gerar Relatório'}
      </Button>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', minHeight: '300px' }}>
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {log.length === 0 && <div>Clique no botão acima para iniciar...</div>}
      </Paper>
      
      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
        Copie o log acima e cole no chat para análise.
      </Typography>
    </Box>
  )
}

export default DebugSync
