import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import CustomizationModal from './CustomizationModal.jsx'

export default function ProductCard({ item }){
  const { cart, setCart } = useApp()
  const [showModal, setShowModal] = useState(false)
  const addToCartQuick = () => {
    setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }])
  }
  const handleConfirm = (configured) => {
    setCart([...cart, configured])
    setShowModal(false)
  }
  return (
    <div className="product-card" data-product-id={item.id}>
      <div className="product-icon">{item.icon || '🍵'}</div>
      <div className="product-name">{item.name}</div>
      <div className="product-price">{Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(item.price || 0)}</div>
      <div className="product-buttons">
        <button className="btn-small btn-add" onClick={() => setShowModal(true)}>Customize</button>
        <button className="btn-small" onClick={addToCartQuick} title="Quick add">Add</button>
        <button className="btn-small btn-favorite" title="Add to favorites">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      {showModal && (
        <CustomizationModal product={item} onClose={() => setShowModal(false)} onConfirm={handleConfirm} />
      )}
    </div>
  )
}
