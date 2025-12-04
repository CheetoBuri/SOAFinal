import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Shop from './pages/Shop.jsx'

export default function App(){
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shop />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
