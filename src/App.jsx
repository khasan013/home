import { useState } from "react";
import { Menu, X, Home, BarChart2, Users, Settings } from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ✅ Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ✅ Sidebar */}
      <div
        className={`
          fixed z-50 top-0 left-0 h-full w-64 bg-gradient-to-b from-purple-700 to-indigo-800 text-white
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:block
        `}
      >
        <div className="p-4 text-xl font-bold border-b border-white/20">
          🍽️ Meal Mate
        </div>

        <nav className="p-4 space-y-2">
          <SidebarItem icon={<Home size={18} />} label="Dashboard" />
          <SidebarItem icon={<BarChart2 size={18} />} label="Analytics" />
          <SidebarItem icon={<Users size={18} />} label="Members" />
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </nav>
      </div>

      {/* ✅ Main Content */}
      <div className="flex-1 flex flex-col w-full">

        {/* ✅ Topbar */}
        <div className="flex items-center justify-between bg-white px-4 py-3 shadow md:justify-end">

          {/* Hamburger (Mobile only) */}
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>

          <h1 className="font-semibold text-lg hidden md:block">
            Dashboard
          </h1>
        </div>

        {/* ✅ Page Content */}
        <div className="p-4 overflow-auto">
          <h2 className="text-2xl font-bold mb-4">
            Welcome to Meal Mate 🎉
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card title="Total Meals" value="120" />
            <Card title="Total Cost" value="$450" />
            <Card title="Per Head" value="$75" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ✅ Sidebar Item */
function SidebarItem({ icon, label }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 cursor-pointer">
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ✅ Card Component */
function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}