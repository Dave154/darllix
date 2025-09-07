import { useCallback, useEffect, useState } from 'react';
import ProductCard from './productCard'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton';

const Products = ({store, products,loading}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  if(loading){
    return(
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 mt-4">
{ 
    Array(5).fill('').map((_,i)=>{
        return <div className="">
        <Skeleton  className='w-full h-72'  />
      </div>
      })
}
      </div>
    )
  }
  if (!loading && products.length=== 0) {
    return (
      <div className="h-4</motion.div>8 flex justify-center items-center">
        No Product Found
      </div>
    );
  } else {
    return (
      <div>
        <motion.h2
          className="text-2xl font-semibold"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Products */}
        </motion.h2>

        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-3 mt-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {products.map((product, i) => (
            <motion.div key={product.id + i} variants={itemVariants} >
              <ProductCard productData={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }
};

export default Products;
