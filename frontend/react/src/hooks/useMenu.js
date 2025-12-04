import { useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function useMenu(){
  const { setMenuItems } = useApp()

  useEffect(() => {
    let cancelled = false

    async function loadMenu(){
      try {
        // Primary: GET /api/menu (returns { items: [...] })
        const res = await fetch('/api/menu')
        if(!res.ok) throw new Error('Failed to fetch /api/menu')
        const data = await res.json()
        if(!cancelled) setMenuItems(Array.isArray(data?.items) ? data.items : [])
      } catch (err) {
        // Optional enhancement: try by-category to ensure data loads
        try {
          const cats = ['coffee','tea','juice','food']
          const all = []
          for(const c of cats){
            const res = await fetch(`/api/menu/${c}`)
            if(res.ok){
              const d = await res.json()
              if(Array.isArray(d?.items)) all.push(...d.items)
            }
          }
          if(!cancelled) setMenuItems(all)
        } catch {
          if(!cancelled) setMenuItems([])
        }
      }
    }

    loadMenu()
    return () => { cancelled = true }
  }, [setMenuItems])
}
