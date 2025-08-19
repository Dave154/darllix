// pages/product/[id].jsx
import { useRouter } from "next/router";
import Image from "next/image";
import { useStore } from "@/store";
import { ArrowLeft, Star } from "lucide-react";
import { useState, useMemo } from "react";
import Header from "./header";
import Link from "next/link";

export default function ProductPage({ store,productId}) {
  const router = useRouter();
  const id = productId
 

  const addToCart = useStore((state) => state.addToCart);
  const increment = useStore((state) => state.incrementQuantity);
  const decrement = useStore((state) => state.decrementQuantity);
  const cart = useStore((state) => state.cart);

  // Example product (replace with fetch from API/DB)
  const product = {
    id,
    name: "Premium Leather Sneakers",
    price: 249.99,
    description:
      "Experience the luxury of handcrafted Italian leather with unmatched comfort and style.",
    rating: 4.8,
    maxQuantity: 3,
    images: [
      "/darllix_logo.png",
      "/placeholder.jpg",
      "/placeholder.jpg",
    ],
  };

  // Find current cart quantity for this product
  const currentQty = useMemo(() => {
    const found = cart.find((item) => item.id === product.id);
    return found ? found.quantity : 0;
  }, [cart, product.id]);

  // Track which image is shown
  const [mainImage, setMainImage] = useState(product.images[0]);

  return (
    <>
    <Header />
    <div className="max-w-7xl mx-auto px-6 py-10">
       <Link href="/" className="text-color3 hover:underline mb-4 flex items-center text-xs gap-2">
           <ArrowLeft className="w-4" /> 
           <span className="">Back to store</span>
       </Link> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left - Image Gallery */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={mainImage || '/placeholder.jpg'}
              alt={product.name}
              width={800}
              height={800}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
          <div className="flex gap-4 mt-4">
            {product.images.map((img, i) => (
              <div
                key={i}
                className={`w-20 h-20 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                  img === mainImage
                    ? "border-color2 scale-105"
                    : "border-gray-200 hover:border-black"
                }`}
                onClick={() => setMainImage(img)}
              >
                <Image src={img || 'placeholder.jpg'} alt="" className="h-full  object-cover" width={80} height={80} unoptimized/>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Product Info */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                fill={i < Math.floor(product.rating) ? "#FACC15" : "none"}
                stroke="#FACC15"
              />
            ))}
            <span className="text-sm text-gray-500">
              {product.rating} / 5.0
            </span>
          </div>

          <p className="text-3xl font-semibold">${product.price}</p>
          <p className="text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              onClick={() => decrement(product.id)}
              disabled={currentQty === 0}
            >
              -
            </button>
            <span>{currentQty}</span>
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              onClick={() =>
                currentQty > 0
                  ? increment(product.id)
                  : addToCart(product)
              }
              disabled={currentQty >= (product.maxQuantity ?? 3)}
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          {currentQty === 0 && (
            <button
              onClick={() => addToCart(product)}
              className="px-6 py-3 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-14 border-t pt-10">
        <h2 className="text-2xl font-semibold mb-4">Product Details</h2>
        <p className="text-gray-700 leading-relaxed">
          These sneakers are made from 100% genuine Italian leather, with a
          cushioned insole and a lightweight sole for all-day comfort. Perfect
          for both casual and formal wear.
        </p>
      </div>
    </div>
    </>
  );
}
