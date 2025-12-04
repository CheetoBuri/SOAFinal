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
        <button className="btn-small btn-favorite" title="Add to favorites">🤍</button>
      </div>
      {showModal && (
        <CustomizationModal product={item} onClose={() => setShowModal(false)} onConfirm={handleConfirm} />
      )}
    </div>
  )
}
