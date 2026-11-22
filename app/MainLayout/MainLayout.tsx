/** @format */
"use client";

import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import SessionManager from "../Components/SessionManager";

interface MainLayoutProps {
  children: ReactNode;
  session?: Session | null;
}

function MainLayout({ children, session }: MainLayoutProps) {
  return (
    <SessionProvider session={session}>
      <div className="flex flex-col min-h-screen bg-[#F4F8FC] text-slate-900">
        <Header />
        <SessionManager />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}

export default MainLayout;
