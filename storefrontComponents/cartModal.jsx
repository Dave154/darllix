"use client"

import * as React from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useStore } from "@/store"
import Image from "next/image"
import { FaTrash } from "react-icons/fa6"
import { useRouter } from "next/navigation"



export function CartDrawer({children}) {
    const router = useRouter()
    const cartTotal = useStore((state) => state.cartTotal());
    const increment = useStore((state) => state.incrementQuantity)
  const decrement = useStore((state) => state.decrementQuantity)
  const removeFromCart = useStore((state) => state.removeFromCart)
    const [goal, setGoal] = React.useState(350)

    const cart = useStore((state) => state.cart)
    console.log(cart)

    function onClick(adjustment) {
        setGoal(Math.max(200, Math.min(400, goal + adjustment)))
    }

    return (
        <Drawer>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent className="bg-color4 ">
                <div className="mx-auto h-1.5 w-[100px] rounded-full -mt-1.5 bg-color3" />
                <div className="mx-auto w-full max-w-sm overflow-auto max-h-[calc(70vh)] scrollbar-thin">
                    <DrawerHeader>
                        <span className="justify-self-end font-extrabold">₦{cartTotal}</span>
                        <DrawerTitle className="font-bold text-2xl text-color3" >
                          <span className="justify-self-center">My Cart</span>  
                            
                        
                        </DrawerTitle>
                        <DrawerDescription>Something goes here</DrawerDescription>
                    </DrawerHeader>

                    {
                        cart.length === 0 &&
                         <div className="flex flex-col items-center justify-center  text-center">
                            <Image 
                             src={"/emptycart.png"}
                             alt="empty cart"
                             width={1000}
                             height={1000}
                             unoptimized
                             className="w-64 h-full object-cover  "
                            />
                            <span className="">
                            <span className="text-lg font-bold text-color3"> You haven't shopped yet</span>
                            <br />
                            <span className="text-sm text-color3">Add items to your cart to see them here.</span>
                            </span>
                           
                            
                         </div>
                        
                    }
                        <div className="space-y-3">
                            {
                            cart.map((product,index)=>{
                                return (
                                     <div className="pb-4  rounded-md" key ={product.id + index} > 
                                <div className="mb-3 h-[120px] bg-color2 rounded-md relative">
                           <div className="absolute inset-0 bg-black/30 rounded-md p-2 flex justify-between items-start">
                                {/* Price Tag */}
                                <div className="text-color4 text-sm font-bold uppercase bg-black/50 px-2 py-1 rounded-md">
                                    ₦{product.price.toLocaleString()}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="p-1 rounded-md bg-color4 hover:bg-red-500 transition-all duration-300 hover:scale-105"
                                >
                                    <Trash2 size={18} className="text-red-400 hover:text-white transition-colors" />
                                </button>
                                </div>
                            <Image 
                                src={product?.images[0]?.url}
                                alt="product image"
                                width={1000}
                                height={1000}
                                className="object-cover w-full h-full rounded-md"
                                unoptimized
                            />
                           
                        </div>

                        <div className="flex items-center justify-center space-x-2">

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                 onClick={() => decrement(product.id)}
                                disabled={goal <= 200}
                            >
                                <Minus />
                                <span className="sr-only">Decrease</span>
                            </Button>
                            <div className="flex-1 text-center">
                                <div className="text-xl font-bold tracking-tighter">
                                    {product.quantity}
                                </div>
                                <div className="text-muted-foreground text-[0.70rem] uppercase">
                                   ₦{product.price * product.quantity}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={() => increment(product.id)}
                                
                            >
                                <Plus />
                                <span className="sr-only">Increase</span>
                            </Button>
                        </div>
                       
                    </div>    
                                )
                            })
                        }
                        </div>
                        
                    {/* <div className="p-4 pb-0">
                        <div className="flex items-center justify-center space-x-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={() => onClick(-10)}
                                disabled={goal <= 200}
                            >
                                <Minus />
                                <span className="sr-only">Decrease</span>
                            </Button>
                            <div className="flex-1 text-center">
                                <div className="text-7xl font-bold tracking-tighter">
                                    {goal}
                                </div>
                                <div className="text-muted-foreground text-[0.70rem] uppercase">
                                    Calories/day
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={() => onClick(10)}
                                disabled={goal >= 400}
                            >
                                <Plus />
                                <span className="sr-only">Increase</span>
                            </Button>
                        </div>
                        <div className="mt-3 h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <Bar
                                        dataKey="goal"
                                        style={{
                                            fill: "hsl(var(--foreground))",
                                            opacity: 0.9,
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div> */}
                    <DrawerFooter>
                        { cart.length > 0 && (
                        <Button className="bg-color3"
                         onClick={() => cart.length === 0 ? null : router.push("/checkout")}
                        >
                            Proceed to Checkout
                        </Button>
                    )}
                       
                       {
                        cart.length === 0 &&
                       
                        <DrawerClose asChild>
                            <Button className="bg-color3"> Start Shopping</Button>
                        </DrawerClose>
    }
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
