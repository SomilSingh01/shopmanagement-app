import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

// Route-level code splitting
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Orders = lazy(() => import('@/pages/Orders'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const Settings = lazy(() => import('@/pages/Settings'));
const Manufacturing = lazy(() => import('@/pages/Manufacturing'));
const ShopInfo = lazy(() => import('@/pages/settings/ShopInfo'));
const Appearance = lazy(() => import('@/pages/settings/Appearance'));
const Invoices = lazy(() => import('@/pages/settings/Invoices'));

// Loading fallback while chunks are downloaded
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="manufacturing" element={<Manufacturing />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/shop-info" element={<ShopInfo />} />
          <Route path="settings/appearance" element={<Appearance />} />
          <Route path="settings/invoices" element={<Invoices />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
