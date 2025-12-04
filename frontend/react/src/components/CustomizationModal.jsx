import React, { useEffect, useMemo, useState } from 'react'

export default function CustomizationModal({ product, onClose, onConfirm }){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({ sizes: [], milks: [], sugars: [], toppings: [], upsells: [] })
  const [selection, setSelection] = useState({ size: null, sugar: null, milks: [], toppings: [], upsells: [], quantity: 1 })

  useEffect(() => {
    let cancelled = false
    async function load(){
      try{
        setLoading(true)
        setError(null)
        const [detailRes, globalRes] = await Promise.all([
          fetch(`/api/menu/product/${product.id}`),
          fetch(`/api/menu/options/all`)
        ])
        const detail = await detailRes.json()
        const global = await globalRes.json()
        if(cancelled) return
        // Merge available options from detail/global
        setOptions({
          sizes: detail.sizes || global.sizes || [],
          milks: detail.milks || global.milks || [],
          sugars: detail.sugars || global.sugars || ['0','25','50','75','100'],
          toppings: detail.toppings || global.toppings || [],
          upsells: detail.upsells || global.upsells || [],
        })
        // Initialize defaults
        setSelection(s => ({
          ...s,
          size: (detail.default_size || 'M'),
          sugar: (detail.default_sugar || '50'),
        }))
      }catch(err){
        if(cancelled) return
        setError('Failed to load options')
      }finally{
        if(!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [product.id])

  const basePrice = product.price || 0
  const computedPrice = useMemo(() => {
    let price = basePrice
    // Simple price rules: size ups, toppings, upsells
    if(selection.size === 'L') price += Math.round(basePrice * 0.2)
    if(selection.size === 'XL') price += Math.round(basePrice * 0.35)
    price += (selection.toppings?.length || 0) * 5000
    price += (selection.upsells?.length || 0) * 7000
    return price * (selection.quantity || 1)
  }, [basePrice, selection])

  const toggleArray = (key, value) => {
    setSelection(s => {
      const set = new Set(s[key])
      if(set.has(value)) set.delete(value); else set.add(value)
      return { ...s, [key]: Array.from(set) }
    })
  }

  const confirm = () => {
    onConfirm({
      id: product.id,
      name: product.name,
      base_price: basePrice,
      price: computedPrice,
      size: selection.size,
      sugar: selection.sugar,
      milks: selection.milks,
      toppings: selection.toppings,
      upsells: selection.upsells,
      quantity: selection.quantity,
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Customize: {product.name}</div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div className="modal-body">Loading options…</div>
        ) : error ? (
          <div className="modal-body error">{error}</div>
        ) : (
          <div className="modal-body">
            <div className="option-group">
              <div className="option-title">Size</div>
              <div className="option-list">
                {options.sizes.map(sz => (
                  <button key={sz} className={"chip" + (selection.size===sz?" chip-selected":"")} onClick={() => setSelection(s => ({...s, size: sz}))}>{sz}</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-title">Sugar</div>
              <div className="option-list">
                {options.sugars.map(sg => (
                  <button key={sg} className={"chip" + (selection.sugar===sg?" chip-selected":"")} onClick={() => setSelection(s => ({...s, sugar: sg}))}>{sg}%</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-title">Milks</div>
              <div className="option-list">
                {options.milks.map(mk => (
                  <button key={mk} className={"chip" + (selection.milks.includes(mk)?" chip-selected":"")} onClick={() => toggleArray('milks', mk)}>{mk}</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-title">Toppings</div>
              <div className="option-list">
                {options.toppings.map(tp => (
                  <button key={tp} className={"chip" + (selection.toppings.includes(tp)?" chip-selected":"")} onClick={() => toggleArray('toppings', tp)}>{tp}</button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-title">Upsells</div>
              <div className="option-list">
                {options.upsells.map(us => (
                  <button key={us} className={"chip" + (selection.upsells.includes(us)?" chip-selected":"")} onClick={() => toggleArray('upsells', us)}>{us}</button>
                ))}
              </div>
            </div>

            <div className="option-group quantity">
              <div className="option-title">Quantity</div>
              <div className="option-list">
                <button className="btn-small" onClick={() => setSelection(s => ({...s, quantity: Math.max(1, (s.quantity||1)-1)}))}>−</button>
                <span className="qty-value">{selection.quantity}</span>
                <button className="btn-small" onClick={() => setSelection(s => ({...s, quantity: (s.quantity||1)+1}))}>+</button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <div className="price-display">{Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(computedPrice)}</div>
          <button className="btn-primary" onClick={confirm} disabled={loading || !!error}>Add to cart</button>
        </div>
      </div>
    </div>
  )
}
