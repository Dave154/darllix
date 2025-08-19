import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useStore } from '@/store'
import { Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation';
import ProductImageModal from './productImageModal'
const ProductCard = ({ productData }) => {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [favorites, setFavorites] = useState([])
  const heart = useRef(null)

  const addToCart = useStore((state) => state.addToCart)
  const increment = useStore((state) => state.incrementQuantity)
  const decrement = useStore((state) => state.decrementQuantity)
  const cart = useStore((state) => state.cart)

  const inCart = cart.find((item) => item.id === productData.id)

  const handleAdd = () => addToCart(productData)

  const addToFavorites = () => {
    setFavorited(true)
    setFavorites((prev) =>
      prev.find((item) => item.id === productData.id)
        ? prev.filter((item) => item.id !== productData.id)
        : [...prev, productData]
    )
  }

  useEffect(() => {
    if (favorited) {
      const timer = setTimeout(() => setFavorited(false), 700)
      return () => clearTimeout(timer)
    }
  }, [favorited])

  return (
    <div className="border rounded-md shadow transition-shadow duration-200 overflow-hidden">
      {/* Heart Icon */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute right-0 flex justify-end z-10 ">
          <i onClick={addToFavorites}>
            {favorites.find((item) => item.id === productData.id)
              ? <FaHeart className={`mt-2 mr-4 text-[20px] text-color2 ${favorited && 'animate-ping'}`} />
              : <FaRegHeart className="mt-2 mr-4 text-[20px]" />}
          </i>
        </div>
        {/* <Image
          src={productData?.image_url || '/placeholder.jpg'}
          alt={productData?.name || ''}
          width={1000}
          height={1000}
          className="w-full h-full object-cover rounded"
          unoptimized
        /> */}
         <ProductImageModal imageUrl={productData?.image_url} alt={productData?.name} />

      </div>

      {/* Product Info */}
      <div className="p-2">
        <div className="" onClick={()=> router.push( `/product/${productData.id}`) }>

        <div className='flex justify-between gap-4'>
        <h3 className="text-sm md:text-xl font-bold mb-2 line-clamp-1">{productData?.name || 'Product Title'}</h3>
         <span className="text-sm md:text-xl font-bold">₦ {productData?.price}</span>
        </div>
        <p className="text-gray-700 mb-4 text-xs line-clamp-3">{productData?.description || 'No description available'}</p>
        </div>

        {/* Cart Button or Quantity Controller */}
        {inCart ? (
          <div className="flex items-center justify-between border rounded px-2 py-1">
            <Button
              size="icon"
              variant="outline"
              onClick={() => decrement(productData.id)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{inCart.quantity}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => increment(productData.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            className="bg-color3 text-color4 w-full cursor-pointer"
            onClick={handleAdd}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  )
}

export default ProductCard
