import { createContext, useContext, useMemo, useState } from 'react'
import { initialTemplates } from '../data/templateData'

const TemplateContext = createContext(null)
const STORAGE_KEY = 'Heights_demo_templates'

function loadTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialTemplates
  } catch {
    return initialTemplates
  }
}

export function TemplateProvider({ children }) {
  const [templates, setTemplates] = useState(loadTemplates)

  const save = (next) => {
    setTemplates(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* demo only */ }
  }

  const addTemplate = (template) => {
    const next = [{ ...template, id: Date.now(), status: 'Approved' }, ...templates]
    save(next)
  }

  const deleteTemplate = (id) => save(templates.filter(t => t.id !== id))
  const resetTemplates = () => save(initialTemplates)

  const value = useMemo(() => ({ templates, addTemplate, deleteTemplate, resetTemplates }), [templates])
  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>
}

export const useTemplates = () => useContext(TemplateContext)
