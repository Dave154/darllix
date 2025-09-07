// pages/product/[id].jsx
import { useRouter } from "next/router";
import Image from "next/image";
import { useStore } from "@/store";
import { ArrowLeft, Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Header from "./header";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


export default function ProductPage({ store,productId}) {
  const router = useRouter(); 

  const addToCart = useStore((state) => state.addToCart);
  const increment = useStore((state) => state.incrementQuantity);
  const decrement = useStore((state) => state.decrementQuantity);
  const cart = useStore((state) => state.cart);

const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // include storeId optionally to be safe
        const params = new URLSearchParams();
        if (productId) params.set("id", productId);
        if (store?.id) params.set("storeId", store.id);

        const res = await fetch(`/api/products?${params.toString()}`, { credentials: "same-origin" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Fetch failed: ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        setProduct(json.product || null);
      } catch (err) {
        if (cancelled) return;
        console.error("load product", err);
        setError(err.message || "Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (productId) load();
    return () => { cancelled = true; };
  }, [productId, store?.id]);

  

  // Find current cart quantity for this product
  const currentQty = useMemo(() => {
    const found = cart.find((item) => item.id === product?.id);
    return found ? found.quantity : 0;
  }, [cart, product?.id]);

  // Track which image is shown
  const [mainImage, setMainImage] = useState();

  return (
    <>
    <Header />
    <div className="max-w-7xl mx-auto px-6 py-10">
       <Link href="/" className="text-color3 hover:underline mb-4 flex items-center text-xs gap-2">
           <ArrowLeft className="w-4" /> 
           <span className="">Back to store</span>
       </Link> 
       {
        loading ?

        <div className="grid gap-6">
          <Skeleton className='w-full h-96' />
          <Skeleton  className='w-48 h-8' />
          <Skeleton  className='w-48 h-8' />
          <Skeleton  className='w-full h-4' /> 


        </div>

        :
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left - Image Gallery */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={product?.images[0].url}
              alt={product?.name}
              width={800}
              height={800}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
          <div className="flex gap-4 mt-4">
            {product?.images.map((img, i) => (
              <div
                key={i}
                className={`w-20 h-20 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                  img.url === mainImage
                    ? "border-color2 scale-105"
                    : "border-gray-200 hover:border-black"
                }`}
                onClick={() => setMainImage(img.url)}
              >
                <Image src={img.url || 'placeholder.jpg'} alt="" className="h-full  object-cover" width={80} height={80} unoptimized/>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Product Info */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold">{product?.name}</h1>

          

          <p className="text-3xl font-semibold">₦{product?.price}</p>
          <p className="text-gray-600 leading-relaxed line-clamp-5">
            {product?.description}
          </p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              onClick={() => decrement(product?.id)}
              disabled={currentQty === 0}
            >
              -
            </button>
            <span>{currentQty}</span>
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              onClick={() =>
                currentQty > 0
                  ? increment(product?.id)
                  : addToCart(product)
              }
              // disabled={currentQty >= (product.maxQuantity ?? 3)}
            >
              +
            </button>
          </div>
           <span className="">Quantity Left</span>
        <p className="text-gray-700 leading-relaxed">{product.available}</p>

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
         {product?.description}
        </p>
        <span className="mt-2">Quantity Left</span>
        <p className="text-gray-700 leading-relaxed">{product.available}</p>
      </div>
          </>
       }
    </div>
    </>
  );
}
