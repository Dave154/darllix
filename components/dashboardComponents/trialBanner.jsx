import React from 'react'
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
const TrialBanner = () => {
  const router = useRouter()
  return (
    <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black text-white p-4 rounded-md flex justify-between items-center"
            >
              <span className='text-xs md:text-sm'>
                Extend your trial for ₦3000/month for 3 months on select plans.
              </span>
              <Button className="bg-white text-black hover:bg-gray-200" onClick={()=>
                router.push('/dashboard/pricing')
              } >
                Select a plan
              </Button>
            </motion.div>
  )
}

export default TrialBanner