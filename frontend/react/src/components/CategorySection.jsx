import React from 'react'
import ProductCard from './ProductCard.jsx'

export default function CategorySection({ title, items }){
  return (
    <div className="category-section">
      <h3 className="category-title">{title}</h3>
      <div className="category-products-grid">
        {items.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
