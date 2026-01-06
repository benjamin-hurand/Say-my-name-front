// src/components/layout/AuthedBaseLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthedBaseLayout() {
  return <Outlet />;
}
