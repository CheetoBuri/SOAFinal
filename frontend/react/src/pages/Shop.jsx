import React, { useMemo } from 'react'
import useMenu from '../hooks/useMenu.js'
import { useApp } from '../context/AppContext.jsx'
import CategorySection from '../components/CategorySection.jsx'
import CartSidebar from '../components/CartSidebar.jsx'

export default function Shop(){
  useMenu()
  const { menuItems } = useApp()

  const categories = useMemo(() => ({
    coffee: { title: <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginRight: '6px'}}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>Coffee</>, items: [] },
    tea: { title: '🍵 Tea', items: [] },
    juice: { title: '🧃 Juice & Smoothies', items: [] },
    food: { title: <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginRight: '6px'}}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>Food & Desserts</>, items: [] },
  }), [])

  const grouped = useMemo(() => {
    const g = JSON.parse(JSON.stringify(categories))
    for(const item of menuItems){
      if(g[item.category]) g[item.category].items.push(item)
    }
    return g
  }, [menuItems, categories])

  return (
    <div className="container">
      <div className="main-content">
        <div id="shopView" className="view active">
          <div id="productsGrid">
            {Object.entries(grouped).map(([key, data]) => (
              data.items.length ? (
                <CategorySection key={key} title={data.title} items={data.items} />
              ) : null
            ))}
          </div>
        </div>
      </div>
      <aside className="sidebar">
        <div className="cart-sidebar">
          <CartSidebar />
        </div>
      </aside>
    </div>
  )
}
