import React from "react";
import Header from "./_components/Header";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-5 md:mx-20 lg:mx-36 py-10">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
