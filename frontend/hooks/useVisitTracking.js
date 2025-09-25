// hooks/useVisitTracking.js
import { useState, useEffect, useRef } from 'react';

export const useVisitTracking = (selectedLocation) => {
  const storageKey = `visitedNewsLinks_${window.location.pathname}_${selectedLocation}`;
  const [visitedLinks, setVisitedLinks] = useState({});
  const saveTimeoutRef = useRef(null);

  // Load visited links from localStorage
  useEffect(() => {
    const savedVisitedLinks = localStorage.getItem(storageKey);
    if (savedVisitedLinks) {
      try {
        setVisitedLinks(JSON.parse(savedVisitedLinks));
      } catch (error) {
        console.error('Error parsing visited links from localStorage:', error);
        setVisitedLinks({});
      }
    } else {
      setVisitedLinks({});
    }
  }, [selectedLocation, storageKey]);

  // Save visited links to localStorage with debouncing
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(visitedLinks));
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [visitedLinks, storageKey]);

  const createUniqueKey = (item) => {
    return `${item.id}_${item.link}_${selectedLocation}`;
  };

  const handleLinkClick = (item, link) => {
    const currentTime = new Date().toISOString();
    const uniqueKey = createUniqueKey(item);
    
    setVisitedLinks(prev => ({
      ...prev,
      [uniqueKey]: {
        visited: true,
        firstVisit: prev[uniqueKey] ? prev[uniqueKey].firstVisit : currentTime,
        lastVisit: currentTime,
        visitCount: prev[uniqueKey] ? prev[uniqueKey].visitCount + 1 : 1,
        title: item.title,
        location: selectedLocation
      }
    }));

    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const formatVisitTime = (timestamp) => {
    if (!timestamp) return '';
    
    const visitDate = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - visitDate) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return visitDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getLinkStyle = (item) => {
    const uniqueKey = createUniqueKey(item);
    const isVisited = visitedLinks[uniqueKey]?.visited;
    return {
      color: isVisited ? '#8B5CF6' : '#551d54',
      opacity: isVisited ? 0.8 : 1,
    };
  };

  const getVisitInfo = (item) => {
    const uniqueKey = createUniqueKey(item);
    return visitedLinks[uniqueKey];
  };

  return {
    visitedLinks,
    handleLinkClick,
    formatVisitTime,
    getLinkStyle,
    getVisitInfo
  };
};
