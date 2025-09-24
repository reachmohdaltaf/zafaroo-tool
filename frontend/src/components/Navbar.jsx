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
    <div className="bg-[#A376A2] px-2 flex justify-between items-center">
      <h1 className="font-extrabold text-xl">Zafaroo Tool</h1>
      <button
        onClick={handleRefresh}
        className="bg-transparent border-none cursor-pointer"
        title="Refresh Page"
      >
        <RefreshCw
          size={24}
          className={spinning ? "animate-spin" : ""}
        />
      </button>
    </div>
  );
};

export default Navbar;
