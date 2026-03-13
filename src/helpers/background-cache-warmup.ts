type WarmupTask = {
  label: string
  run: () => Promise<void>
}

type IdleDeadlineLike = {
  didTimeout: boolean
  timeRemaining: () => number
}

type IdleRequestCallbackLike = (deadline: IdleDeadlineLike) => void

const TARGET_ROUTES = ['/staffs', '/departments', '/departments/new'] as const

const TARGET_CHUNKS: Array<WarmupTask> = [
  {
    label: 'chunk:staff-list',
    run: async () => { await import('@/components/staff-list') },
  },
  {
    label: 'chunk:departments-page',
    run: async () => { await import('@/pages/departments') },
  },
  {
    label: 'chunk:department-form-page',
    run: async () => { await import('@/pages/department-form-page') },
  },
]

const NAVIGATION_EVENT = 'app:navigation'
const HISTORY_PATCH_FLAG = '__flugoWarmupHistoryPatched__'

let hasStartedWarmup = false

function getIdleScheduler() {
  const requestIdle = (window as Window & { requestIdleCallback?: (cb: IdleRequestCallbackLike, options?: { timeout: number }) => number }).requestIdleCallback
  if (requestIdle) {
    return (callback: IdleRequestCallbackLike) => requestIdle(callback, { timeout: 800 })
  }

  return (callback: IdleRequestCallbackLike) => window.setTimeout(() => callback({
    didTimeout: false,
    timeRemaining: () => 0,
  }), 120)
}

function warmupLog(message: string, payload?: unknown) {
  if (!import.meta.env.DEV) return
  if (payload === undefined) {
    console.log(`[warmup] ${message}`)
    return
  }
  console.log(`[warmup] ${message}`, payload)
}

function withBasePath(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`
  return `${sanitizedBase}${sanitizedPath}` || sanitizedPath
}

function normalizeCurrentPathname() {
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/' || !location.pathname.startsWith(base)) return location.pathname
  const normalized = location.pathname.slice(base.length - 1)
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function isPostLoginArea() {
  return normalizeCurrentPathname() !== '/login'
}

function patchHistoryNavigationEvents() {
  if ((window as any)[HISTORY_PATCH_FLAG]) return

  const wrapHistoryMethod = (method: 'pushState' | 'replaceState') => {
    const original = history[method]
    history[method] = function (...args) {
      const result = original.apply(this, args as any)
      window.dispatchEvent(new Event(NAVIGATION_EVENT))
      return result
    }
  }

  wrapHistoryMethod('pushState')
  wrapHistoryMethod('replaceState')
  ;(window as any)[HISTORY_PATCH_FLAG] = true
}

function createRouteWarmupTasks(): WarmupTask[] {
  return TARGET_ROUTES.map((route) => ({
    label: `route:${route}`,
    run: async () => {
      const response = await fetch(withBasePath(route), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'default',
      })
      if (!response.ok) {
        throw new Error(`Falha ao aquecer rota ${route}: ${response.status}`)
      }
    },
  }))
}

function runWarmupQueue(tasks: WarmupTask[], maxConcurrency = 2) {
  const scheduleIdle = getIdleScheduler()
  let nextTaskIndex = 0
  let activeCount = 0

  const trySchedule = () => {
    if (nextTaskIndex >= tasks.length && activeCount === 0) {
      warmupLog('warmup concluído')
      return
    }

    scheduleIdle((deadline) => {
      while ((deadline.timeRemaining() > 8 || deadline.didTimeout) && activeCount < maxConcurrency && nextTaskIndex < tasks.length) {
        const task = tasks[nextTaskIndex++]
        if (!task) break
        activeCount++
        warmupLog('iniciando tarefa', task.label)

        task.run()
          .then(() => warmupLog('tarefa concluída', task.label))
          .catch((err) => warmupLog('tarefa falhou', { task: task.label, err }))
          .finally(() => {
            activeCount--
            trySchedule()
          })
      }

      if (nextTaskIndex < tasks.length) {
        trySchedule()
      }
    })
  }

  trySchedule()
}

function startWarmupIfReady() {
  if (hasStartedWarmup || !isPostLoginArea() || document.visibilityState !== 'visible') return

  hasStartedWarmup = true
  warmupLog('iniciando warmup em segundo plano')

  const tasks: WarmupTask[] = [
    ...createRouteWarmupTasks(),
    ...TARGET_CHUNKS,
  ]

  runWarmupQueue(tasks, 2)
}

export function setupBackgroundCacheWarmup() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  patchHistoryNavigationEvents()
  window.addEventListener('load', startWarmupIfReady, { once: true })
  window.addEventListener(NAVIGATION_EVENT, startWarmupIfReady)
  window.addEventListener('popstate', startWarmupIfReady)
  document.addEventListener('visibilitychange', startWarmupIfReady)

  startWarmupIfReady()
}
