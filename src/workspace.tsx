import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { seed, type State } from './model'

const storageKey = 'cargoos.workspace.v1'
function load(): State {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved) as State
  } catch {
    return seed()
  }
  return seed()
}

type Workspace = {
  state: State
  update: (fn: (state: State) => State) => void
  branch: string
  setBranch: (branch: string) => void
  notify: (message: string) => void
  notice: string
}
const Context = createContext<Workspace | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load)
  const [branch, setBranch] = useState(
    () => localStorage.getItem('cargoos.branch') ?? '',
  )
  const [notice, notify] = useState('')
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [state])
  useEffect(() => {
    localStorage.setItem('cargoos.branch', branch)
  }, [branch])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => notify(''), 3600)
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <Context.Provider
      value={{
        state,
        update: setState,
        branch,
        setBranch,
        notify,
        notice: storageError
          ? 'Changes could not be saved in this browser.'
          : notice,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(Context)
  if (!context) throw new Error('CargoOS workspace is unavailable.')
  return context
}
