import ProductCard from './productCard'
import { motion } from 'framer-motion'

const Products = () => {
  const demoProducts = [
    {
      id: 1,
      name: "Product 1",
      image_url: "/placeholder.jpg",
      price: 2000,
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 2,
      name: "Product 2",
      image_url: "/placeholder.jpg",
      price: 2500,
      description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
  ];

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

  if (false) {
    return (
      <div className="h-48 flex justify-center items-center">
        No Product Found
      </div>
    );
  } else {
    return (
      <div>
        <motion.h2
          className="text-2xl font-extrabold"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          Products
        </motion.h2>

        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-3 mt-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {demoProducts.map((product, i) => (
            <motion.div key={product.id + i} variants={itemVariants}>
              <ProductCard productData={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }
};

export default Products;
