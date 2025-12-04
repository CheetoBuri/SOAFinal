import React, { useMemo } from 'react'
import useMenu from '../hooks/useMenu.js'
import { useApp } from '../context/AppContext.jsx'
import CategorySection from '../components/CategorySection.jsx'
import CartSidebar from '../components/CartSidebar.jsx'

export default function Shop(){
  useMenu()
  const { menuItems } = useApp()

  const categories = useMemo(() => ({
    coffee: { title: '☕ Coffee', items: [] },
    tea: { title: '🍵 Tea', items: [] },
    juice: { title: '🧃 Juice & Smoothies', items: [] },
    food: { title: '🥐 Food & Desserts', items: [] },
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
