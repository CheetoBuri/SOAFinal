import React, { createContext, useContext, useMemo, useState } from 'react'

const AppCtx = createContext(null)
export function AppProvider({ children }){
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [address, setAddress] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_district: '',
    delivery_ward: '',
    delivery_street: '',
    payment_method: 'cod',
    promo_code: '',
    special_notes: ''
  })

  const value = useMemo(() => ({
    menuItems, setMenuItems,
    cart, setCart,
    favorites, setFavorites,
    address, setAddress,
  }), [menuItems, cart, favorites, address])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
export function useApp(){
  const ctx = useContext(AppCtx)
  if(!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
