import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function CartSidebar(){
  const { cart, setCart, address, setAddress } = useApp()
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState('')
  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0)
  const format = v => Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(v)

  const changeQty = (idx, delta) => {
    setCart(cart.map((i, k) => k===idx ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }
  const removeItem = (idx) => {
    setCart(cart.filter((_, k) => k!==idx))
  }

  if(cart.length === 0){
    return (
      <div>
        <div className="cart-title">🛒 Cart</div>
        <div id="cartItems"><div className="cart-empty">Giỏ hàng trống</div></div>
      </div>
    )
  }

  return (
    <div>
      <div className="cart-title">🛒 Cart</div>
      <div id="cartItems">
        {cart.map((item, index) => (
          <div className="cart-item" key={index}>
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">{format(item.price)}</div>
            </div>
            <div className="cart-item-actions">
              <button onClick={()=>changeQty(index,-1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={()=>changeQty(index,1)}>+</button>
              <button className="btn-remove" onClick={()=>removeItem(index)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary" id="cartSummary" style={{ display:'block' }}>
        <div className="summary-row"><span>Subtotal:</span><span id="subtotal">{format(total)}</span></div>
        <div className="summary-row total"><span>Total:</span><span id="totalPrice">{format(total)}</span></div>
        <button className="checkout-btn" disabled={placing || cart.length===0} onClick={async ()=>{
          setMsg('')
          setPlacing(true)
          try{
            const payload = {
              user_id: '1',
              items: cart.map(i=>({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, size: i.size || 'M', milks: i.milks||[], toppings: i.toppings||[], sugar: i.sugar||'100' })),
              customer_name: address.customer_name || 'Khách hàng',
              customer_phone: address.customer_phone || '0000000000',
              customer_email: address.customer_email || 'guest@example.com',
              payment_method: address.payment_method || 'cod',
              delivery_district: address.delivery_district || '',
              delivery_ward: address.delivery_ward || '',
              delivery_street: address.delivery_street || '',
              special_notes: address.special_notes || '',
              promo_code: address.promo_code || '',
              reuse_address: false
            }
            const res = await fetch('/api/checkout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
            const data = await res.json()
            if(res.ok){
              setMsg(`Tạo đơn hàng thành công: #${data.order_id}`)
              // Reset cart và địa chỉ để tránh lưu địa chỉ cũ
              setCart([])
              setAddress({ customer_name:'', customer_phone:'', customer_email:'', delivery_district:'', delivery_ward:'', delivery_street:'', payment_method: address.payment_method || 'cod', promo_code:'', special_notes:'' })
            }else{
              setMsg(data.detail || 'Tạo đơn hàng thất bại')
            }
          }catch(e){
            setMsg('Lỗi kết nối khi tạo đơn hàng')
          }finally{
            setPlacing(false)
          }
        }}>Checkout</button>
        {msg && <div className="checkout-msg">{msg}</div>}
      </div>
    </div>
  )
}
