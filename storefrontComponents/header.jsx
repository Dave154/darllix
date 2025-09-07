import React, { useState } from 'react'
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { CartDrawer } from './cartModal';
import { useStore } from '@/store';
import { Input } from "@/components/ui/input";

const Header = ({store, query, setQuery}) => {
      const count = useStore((state) => state.cartCount())
      const [q,setQ]= useState('')
    
  return (
    <>
    <div className="p-2 bg-color2">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-color3 text-center py-1">
            Welcome to {store?.name || 'Our Store'}! Enjoy your shopping experience.
          </p>
        </div>
      </div>
      <header className="border-b border-gray-400">
       <nav className="py-4 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8  flex justify-between gap-4 items-center">
          <div className="">
              <a href="" className="font-extrabold sm:text-xl md:text-2xl text-color3 capitalize">{store.name}</a>
          </div>

          <form onSubmit={(e)=>{
            e.preventDefault()
            setQuery(q)

          }} className="border border-gray-300 rounded-full px-4 py-2 flex items-center w-full max-w-md">
            <input value={q}  onChange={(e) => setQ(e.target.value)} placeholder="Search products ..." className="bg-transparent w-full text-xs border-none h-full outline-none" />
          </form>

          <div className="hidden sm:flex gap-3 items-center">
             {/* <div className="flex items-end space-x-1">
            <i className="">
              <ShoppingBag className='h-4 w-4 md:h-6 md:w-6' />
            </i>
             <div className="rounded-full w-5 h-5 bg-black text-white grid place-items-center text-xs font-semibold">
            0
             </div>
          </div> */}
          <CartDrawer>
           <div className="flex items-end space-x-1 cursor-pointer hover:animate-bounce ">
            
            <i className="text-xl">
              <ShoppingCart className='h-4 w-4 md:h-6 md:w-6'/>
            </i>
            {
              count > 0 &&
              <div className="rounded-full w-3 h-3 md:h-5 md:w-5 bg-black text-white grid place-items-center text-[8px] md:text-xs font-bold">
              {count}
             </div>
            }
             
          </div>
          </CartDrawer>
          </div>
         
          
       </nav>
      
      </header>
      </>
  )
}

export default Header