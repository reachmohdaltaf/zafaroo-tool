// components/NewsItem.jsx
import React from 'react';
import { Copy, Download, Clock } from "lucide-react";

const NewsItem = ({ 
  item, 
  selectedLocation, 
  visitInfo, 
  onLinkClick, 
  getLinkStyle, 
  formatVisitTime,
  onCreatePost,
  cleanTitle 
}) => {
  return (
    <div
      key={`${item.id}_${selectedLocation}`}
      className="container flex flex-col md:flex-row justify-between items-start md:items-center rounded-lg p-2 border border-gray-200"
    >
      <div className="flex-1 mb-2 md:mb-0">
        <button
          onClick={() => onLinkClick(item, item.link)}
          className="text-left text-sm sm:text-base md:text-lg font-medium line-clamp-3 hover:underline cursor-pointer border-none bg-transparent p-0 m-0"
          style={getLinkStyle(item)}
        >
          {cleanTitle(item.title)}
        </button>
        
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs md:text-sm font-bold">
            {(() => {
              const d = new Date(item.date);
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
            })()}
          </p>
          
          {visitInfo?.visited && (
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <Clock size={12} />
              <span>
                Visited {formatVisitTime(visitInfo.lastVisit)}
                {visitInfo.visitCount > 1 && 
                  ` (${visitInfo.visitCount}x)`
                }
              </span>
            </div>
          )}
        </div>
        
        {item.location && (
          <p className="text-xs md:text-sm mt-1 text-gray-500">{item.location}</p>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-1 md:ml-2">
        <button
          className="bg-[#6B3F69] cursor-pointer text-white px-3 py-1 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-1 hover:bg-[#70446f] transition-colors duration-300"
          onClick={() => onCreatePost(item)}
        >
          Make a Post <Download size={16} />
        </button>

        <button
          className="bg-[#6B3F69] cursor-pointer text-white px-3 py-1 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-1 hover:bg-[#70446f] transition-colors duration-300"
          onClick={() => {
            navigator.clipboard.writeText(item.title);
            alert("Title copied!");
          }}
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

export default NewsItem;
