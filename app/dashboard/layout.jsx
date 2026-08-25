import React from "react";
import Sidebar from "./_components/Sidebar";
import UsernameModal from "./_components/UsernameModal";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar />
      <UsernameModal />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-5 md:px-8 lg:px-12 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
