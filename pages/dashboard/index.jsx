import React from 'react'
import  DashboardLayout  from '../../components/dashboardComponents/dashboardLayout'

const Index = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard Home</h1>
        <p>Welcome to your dashboard! Here you can manage your store, products, and customers.</p>
      </div>
    </DashboardLayout>
  )
}

export default Index