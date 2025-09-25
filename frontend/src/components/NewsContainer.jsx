// components/NewsContainer.jsx (Compact UI with bigger headlines)
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

  useEffect(() => {
    fetchNews(selectedLocation);
    setCurrentPage(1);
  }, [selectedLocation]);

  const filteredNews = selectedDate
    ? news.filter(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(selectedDate).toDateString()
      )
    : news;

  const itemsPerPage = 6;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  const cleanTitle = (title) => title.split(" - ")[0];

  const openModal = (item) => {
    setCurrentItem(item);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#551d54]"></div>
          <p className="ml-3 text-[#551d54] text-base">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#6B3F69] focus:outline-none transition-colors"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate && (
                <button
                  className="px-4 py-2 bg-gradient-to-r from-[#6B3F69] to-[#551d54] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                  onClick={() => setSelectedDate("")}
                >
                  Clear Date
                </button>
              )}
            </div>
            <LocationFilter
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
          </div>
        </div>

        {/* Results Counter */}
        <p className="text-gray-600 text-xs mb-4">
          Showing {currentNews.length} of {filteredNews.length} articles
          {selectedLocation && ` for ${selectedLocation}`}
        </p>

        {/* News Grid */}
        {currentNews.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-base font-medium text-gray-600 mb-1">
              No news found
            </h3>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentNews.map((item, index) => (
              <NewsCard
                key={`${item.id}_${selectedLocation}_${index}`}
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
        )}

        {/* Pagination */}
        {filteredNews.length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              totalPages={Math.ceil(filteredNews.length / itemsPerPage)}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Modal */}
        <PostCreatorModal
          show={showModal}
          onClose={() => setShowModal(false)}
          currentItem={currentItem}
          selectedLocation={selectedLocation}
          cleanTitle={cleanTitle}
        />
      </div>
    </div>
  );
};

// Compact NewsCard Component
const NewsCard = ({
  item,
  selectedLocation,
  visitInfo,
  onLinkClick,
  getLinkStyle,
  formatVisitTime,
  onCreatePost,
  cleanTitle,
}) => {
  const handleLinkClick = () => {
    onLinkClick(item);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-[#6B3F69]/10 text-[#6B3F69]">
            {selectedLocation}
          </span>
          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
        </div>

        <h3 className="text-xl font-extrabold text-[#551d54] mb-2 leading-snug group-hover:text-[#6B3F69] transition-colors">
          {cleanTitle(item.title)}
        </h3>

        {item.description && (
          <p className="text-gray-600 text-xs line-clamp-2 mb-3">
            {item.description}
          </p>
        )}
      </div>

      {/* Visit Info */}
      {visitInfo && (
        <div className="px-4 pb-2">
          <div className="flex items-center text-[11px] text-gray-500">
            <div
              className={`w-2 h-2 rounded-full mr-1 ${
                visitInfo.visited ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
            {visitInfo.visited ? (
              <span>Visited {formatVisitTime(visitInfo.lastVisited)}</span>
            ) : (
              <span>Not visited</span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex justify-between items-center">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          style={getLinkStyle(item)}
          className="text-xs font-medium text-[#6B3F69] hover:text-[#551d54]"
        >
          Read More
        </a>

        <button
          onClick={() => onCreatePost(item)}
          className="inline-flex cursor-pointer items-center px-3 py-1.5 border border-[#6B3F69] text-[#6B3F69] text-xs font-medium rounded-lg hover:bg-[#6B3F69] hover:text-white transition-all"
        >
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post
        </button>
      </div>
    </div>
  );
};

export default NewsContainer;
