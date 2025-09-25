// hooks/usePagination.js
import { useState, useMemo } from 'react';

export const usePagination = (items, itemsPerPage = 5) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);

  // Reset to page 1 when items change
  useState(() => {
    setCurrentPage(1);
  }, [items]);

  return {
    ...paginatedData,
    setCurrentPage,
    paginate: setCurrentPage
  };
};
