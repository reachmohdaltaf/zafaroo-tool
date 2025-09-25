// components/NewsContainer.jsx (Main refactored component)
import React, { useState, useEffect } from 'react';
import LocationFilter from './LocationFilter';
import NewsItem from './NewsItem';
import PostCreatorModal from './PostCreatorModal';
import Pagination from './Pagination';
import { useNewsData } from '../../hooks/useNewsData';
import { usePagination } from '../../hooks/usePagination';
import { useVisitTracking } from '../../hooks/useVisitTracking';

const NewsContainer = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Paonta Sahib");
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { news, loading, fetchNews } = useNewsData();
  const visitTracking = useVisitTracking(selectedLocation);
  
  // Fetch news when location changes
  useEffect(() => {
    fetchNews(selectedLocation);
    setCurrentPage(1); // Reset to first page when location changes
  }, [selectedLocation]);

  const filteredNews = selectedDate
    ? news.filter(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(selectedDate).toDateString()
      )
    : news;

  const { currentItems, totalPages } = usePagination(filteredNews, 5);

  // Update pagination when filtered news changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredNews.length]);

  const cleanTitle = (title) => title.split(" - ")[0];

  const openModal = (item) => {
    setCurrentItem(item);
    setShowModal(true);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate current items based on pagination
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <p className="px-2 text-[#551d54]">Loading news...</p>;

  return (
    <div className="px-2">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#551d54] mb-2">News</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {selectedDate && (
          <button
            className="px-2 py-1 bg-[#6B3F69] text-white rounded text-sm w-full sm:w-auto"
            onClick={() => setSelectedDate("")}
          >
            Clear
          </button>
        )}
        
        <LocationFilter 
          selectedLocation={selectedLocation} 
          onLocationChange={setSelectedLocation} 
        />
      </div>

      {/* News list */}
      <div className="flex flex-col gap-2">
        {currentNews.map((item) => (
          <NewsItem
            key={`${item.id}_${selectedLocation}`}
            item={item}
            selectedLocation={selectedLocation}
            visitInfo={visitTracking.getVisitInfo(item)}
            onLinkClick={visitTracking.handleLinkClick}
            getLinkStyle={visitTracking.getLinkStyle}
            formatVisitTime={visitTracking.formatVisitTime}
            onCreatePost={openModal}
            cleanTitle={cleanTitle}
          />
        ))}
      </div>

      <Pagination 
        totalPages={Math.ceil(filteredNews.length / itemsPerPage)}
        currentPage={currentPage}
        onPageChange={paginate}
      />

      <PostCreatorModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        currentItem={currentItem}
        selectedLocation={selectedLocation}
        cleanTitle={cleanTitle}
      />
    </div>
  );
};

export default NewsContainer;
