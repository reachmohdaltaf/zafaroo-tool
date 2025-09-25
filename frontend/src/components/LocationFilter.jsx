// components/LocationFilter.jsx
import React, { useState } from 'react';

const LocationFilter = ({ selectedLocation, onLocationChange }) => {
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState("");

  const locations = [
    "Paonta Sahib", "Himachal Pradesh", "Chandigarh", "Haryana",
    "Delhi", "Punjab", "Uttarakhand", "Rajasthan", "Uttar Pradesh",
    "Jammu & Kashmir", "Ladakh", "Himachal", "Bihar", "Jharkhand",
    "Madhya Pradesh", "Chhattisgarh", "Goa", "Maharashtra",
    "Karnataka", "Tamil Nadu", "Kerala", "West Bengal", "Odisha",
    "Assam", "Sikkim", "Arunachal Pradesh", "Nagaland", "Manipur",
    "Mizoram", "Tripura", "Meghalaya", "Andaman & Nicobar", "Lakshadweep",
    "custom"
  ];

  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomLocation(true);
      onLocationChange("");
    } else {
      setIsCustomLocation(false);
      onLocationChange(value);
      setCustomLocationInput("");
    }
  };

  const handleCustomLocationSubmit = () => {
    if (customLocationInput.trim()) {
      onLocationChange(customLocationInput.trim());
      setIsCustomLocation(false);
    }
  };

  const handleCustomLocationCancel = () => {
    setIsCustomLocation(false);
    setCustomLocationInput("");
    onLocationChange("Paonta Sahib");
  };

  return (
    <div className="flex gap-2 w-full sm:w-auto items-center">
      {isCustomLocation ? (
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Enter custom location..."
            className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
            value={customLocationInput}
            onChange={(e) => setCustomLocationInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomLocationSubmit();
              }
            }}
            autoFocus
          />
          <button
            className="px-2 py-1 bg-[#6B3F69] text-white rounded text-sm hover:bg-[#70446f] disabled:opacity-50"
            onClick={handleCustomLocationSubmit}
            disabled={!customLocationInput.trim()}
          >
            ✓
          </button>
          <button
            className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            onClick={handleCustomLocationCancel}
          >
            ✗
          </button>
        </div>
      ) : (
        <select
          className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
          value={selectedLocation === "Paonta Sahib" ? "Paonta Sahib" : 
                 locations.slice(0, -1).includes(selectedLocation) ? selectedLocation : "custom"}
          onChange={handleLocationChange}
        >
          {locations.map((loc, i) => (
            <option key={i} value={loc}>
              {loc === "custom" ? "🖋️ Enter Custom Location" : loc}
            </option>
          ))}
        </select>
      )}
      
      {selectedLocation && !locations.slice(0, -1).includes(selectedLocation) && !isCustomLocation && (
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded text-sm">
          <span className="text-blue-800">📍 {selectedLocation}</span>
          <button
            className="text-blue-600 hover:text-blue-800 font-bold"
            onClick={() => onLocationChange("Paonta Sahib")}
            title="Remove custom location"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;
