import { useState } from "react";
import { RefreshCw } from "lucide-react";

const Navbar = () => {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, 500); // spin for 0.5s before reload
  };

  return (
    <nav className="bg-gradient-to-r from-black via-[#1a1a1a] to-red-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo / Title */}
        <h1 className="font-extrabold text-2xl tracking-wide text-red-500">
          Zafaroo Tool
        </h1>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="bg-transparent border-none cursor-pointer hover:text-red-400 transition-colors"
          title="Refresh Page"
        >
          <RefreshCw
            size={26}
            className={spinning ? "animate-spin" : ""}
          />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
