import { Copy, Download, Clock, Wand2, RefreshCw } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

const NewsContainer = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Paonta Sahib");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#FFFF00");
  const [bgImage, setBgImage] = useState(null);
  const [shadow, setShadow] = useState(true);

  // Custom location states
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState("");

  // Title editing and AI generation states
  const [editableTitle, setEditableTitle] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // Create a unique storage key that includes the current URL and location
  const storageKey = `visitedNewsLinks_${window.location.pathname}_${selectedLocation}`;
  
  // Link visit tracking state
  const [visitedLinks, setVisitedLinks] = useState({});

  // Image positioning and scaling states
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });

  const previewCanvasRef = useRef(null);
  const imageDataRef = useRef(null);
  const textareaRef = useRef(null);

  const locations = [
    "Paonta Sahib", "Himachal Pradesh", "Chandigarh", "Haryana",
    "Delhi", "Punjab", "Uttarakhand", "Rajasthan", "Uttar Pradesh",
    "Jammu & Kashmir", "Ladakh", "Himachal", "Bihar", "Jharkhand",
    "Madhya Pradesh", "Chhattisgarh", "Goa", "Maharashtra",
    "Karnataka", "Tamil Nadu", "Kerala", "West Bengal", "Odisha",
    "Assam", "Sikkim", "Arunachal Pradesh", "Nagaland", "Manipur",
    "Mizoram", "Tripura", "Meghalaya", "Andaman & Nicobar", "Lakshadweep",
    "custom" // Custom option
  ];

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // Handle textarea input and auto-resize
  const handleTextareaChange = (e) => {
    setEditableTitle(e.target.value);
    autoResizeTextarea(e.target);
  };

  // Generate AI text function
  const generateAIText = async () => {
    setIsGeneratingAI(true);
    setAiError("");
    
    try {
      // You can replace this with your preferred AI service
      // Options: OpenAI, Google Gemini, Anthropic Claude, or local models
      
      const prompt = `Rewrite this news headline in a more engaging and compelling way while keeping the same meaning and key information. Make it suitable for social media sharing:

"${cleanTitle(currentItem.title)}"

Location: ${currentItem.location || selectedLocation}
Date: ${new Date(currentItem.date).toLocaleDateString("en-IN")}

Instructions:
- Keep it concise but impactful
- Maintain factual accuracy
- Make it more engaging for social media
- Keep it under 150 characters if possible
- Do not add emojis or hashtags`;

      // Example API call - replace with your AI service
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      const generatedText = data.text || data.choices?.[0]?.message?.content || data.response;
      
      if (generatedText) {
        setEditableTitle(generatedText.trim());
        setTimeout(() => {
          if (textareaRef.current) {
            autoResizeTextarea(textareaRef.current);
          }
        }, 0);
      }
      
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback: Create an improved version manually
      const originalTitle = cleanTitle(currentItem.title);
      const improvedTitle = originalTitle
        .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1))
        .replace(/(\d+)/g, '$1')
        .trim();
      
      setEditableTitle(`🔥 BREAKING: ${improvedTitle}`);
      setAiError("AI service unavailable. Applied manual enhancement.");
      
      setTimeout(() => {
        if (textareaRef.current) {
          autoResizeTextarea(textareaRef.current);
        }
      }, 0);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Reset title to original
  const resetTitle = () => {
    setEditableTitle(cleanTitle(currentItem.title));
    setTimeout(() => {
      if (textareaRef.current) {
        autoResizeTextarea(textareaRef.current);
      }
    }, 0);
  };

  // Load visited links from localStorage on component mount and when location changes
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
  const saveTimeoutRef = useRef(null);
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

  // Function to create a unique key for each news item
  const createUniqueKey = (item) => {
    return `${item.id}_${item.link}_${selectedLocation}`;
  };

  // Function to handle link click and track visit
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

  // Function to format visit time
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

  // Function to get link style based on visit status
  const getLinkStyle = (item) => {
    const uniqueKey = createUniqueKey(item);
    const isVisited = visitedLinks[uniqueKey]?.visited;
    return {
      color: isVisited ? '#8B5CF6' : '#551d54',
      opacity: isVisited ? 0.8 : 1,
    };
  };

  // Function to get visit info for an item
  const getVisitInfo = (item) => {
    const uniqueKey = createUniqueKey(item);
    return visitedLinks[uniqueKey];
  };

  // Handle location change including custom option
  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomLocation(true);
      setSelectedLocation("");
    } else {
      setIsCustomLocation(false);
      setSelectedLocation(value);
      setCustomLocationInput("");
    }
  };

  // Handle custom location submission
  const handleCustomLocationSubmit = () => {
    if (customLocationInput.trim()) {
      setSelectedLocation(customLocationInput.trim());
      setIsCustomLocation(false);
    }
  };

  // Handle custom location cancel
  const handleCustomLocationCancel = () => {
    setIsCustomLocation(false);
    setCustomLocationInput("");
    setSelectedLocation("Paonta Sahib");
  };

  const fetchNews = async (location) => {
    setLoading(true);
    try {
      const query = location ? `?location=${encodeURIComponent(location)}` : "";
      
      const baseURL = window.location.hostname === "localhost"
        ? "http://localhost:5000/api/news"
        : "/api/news";

      const response = await fetch(`${baseURL}${query}`);
      const data = await response.json();
      setNews(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedLocation);
  }, [selectedLocation]);

  const filteredNews = selectedDate
    ? news.filter(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(selectedDate).toDateString()
      )
    : news;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const cleanTitle = (title) => title.split(" - ")[0];

  const openModal = (item) => {
    setCurrentItem(item);
    setEditableTitle(cleanTitle(item.title)); // Set editable title
    setBgColor("#000000");
    setTextColor("#FFFF00");
    setBgImage(null);
    setShadow(true);
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1.0);
    setAiError("");
    setShowModal(true);
    
    // Auto-resize textarea after modal opens
    setTimeout(() => {
      if (textareaRef.current) {
        autoResizeTextarea(textareaRef.current);
      }
    }, 100);
  };

  // Calculate image dimensions with scaling
  const calculateImageDimensions = (img, containerWidth, containerHeight, scale = 1) => {
    const imgAspectRatio = img.width / img.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight;

    if (imgAspectRatio > containerAspectRatio) {
      drawHeight = containerHeight * scale;
      drawWidth = drawHeight * imgAspectRatio;
    } else {
      drawWidth = containerWidth * scale;
      drawHeight = drawWidth / imgAspectRatio;
    }

    return { drawWidth, drawHeight };
  };

  // Draw image with position and scale
  const drawImageWithTransform = (ctx, img, x, y, width, height, offsetX = 0, offsetY = 0, scale = 1) => {
    const { drawWidth, drawHeight } = calculateImageDimensions(img, width, height, scale);
    
    const baseX = (width - drawWidth) / 2;
    const baseY = (height - drawHeight) / 2;
    
    const finalX = x + baseX + offsetX;
    const finalY = y + baseY + offsetY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    
    ctx.drawImage(img, finalX, finalY, drawWidth, drawHeight);
    ctx.restore();

    imageDataRef.current = {
      x: finalX,
      y: finalY,
      width: drawWidth,
      height: drawHeight,
      containerX: x,
      containerY: y,
      containerWidth: width,
      containerHeight: height,
      scale: scale
    };

    drawResizeHandles(ctx, finalX, finalY, drawWidth, drawHeight);
  };

  // Draw resize handles (corners)
  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handleSize = 12;
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 },
      { x: x + width - handleSize/2, y: y - handleSize/2 },
      { x: x - handleSize/2, y: y + height - handleSize/2 },
      { x: x + width - handleSize/2, y: y + height - handleSize/2 },
    ];

    handles.forEach(handle => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
      
      ctx.fillStyle = '#333';
      ctx.fillRect(handle.x + 3, handle.y + 3, handleSize - 6, handleSize - 6);
    });
  };

  // Check if point is in any resize corner
  const getResizeCorner = (mouseX, mouseY) => {
    if (!imageDataRef.current) return null;
    
    const { x, y, width, height } = imageDataRef.current;
    const handleSize = 12;
    
    const corners = [
      { name: 'tl', x: x - handleSize/2, y: y - handleSize/2 },
      { name: 'tr', x: x + width - handleSize/2, y: y - handleSize/2 },
      { name: 'bl', x: x - handleSize/2, y: y + height - handleSize/2 },
      { name: 'br', x: x + width - handleSize/2, y: y + height - handleSize/2 },
    ];

    for (let corner of corners) {
      if (mouseX >= corner.x && mouseX <= corner.x + handleSize &&
          mouseY >= corner.y && mouseY <= corner.y + handleSize) {
        return corner.name;
      }
    }
    return null;
  };

  // Handle mouse events
  const handleMouseDown = (e) => {
    if (!bgImage || !imageDataRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    const imageAreaHeight = canvas.height * 0.6;
    if (mouseY <= imageAreaHeight) {
      const resizeCorner = getResizeCorner(mouseX, mouseY);
      
      if (resizeCorner) {
        setIsResizing(true);
        setResizeStart({
          x: mouseX,
          y: mouseY,
          scale: imageScale,
          corner: resizeCorner
        });
      } else {
        setIsDragging(true);
        setDragStart({ 
          x: mouseX - imagePosition.x, 
          y: mouseY - imagePosition.y 
        });
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !bgImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const imageAreaHeight = canvas.height * 0.6;
    if (mouseY <= imageAreaHeight) {
      const resizeCorner = getResizeCorner(mouseX, mouseY);
      
      if (resizeCorner) {
        if (resizeCorner === 'tl' || resizeCorner === 'br') {
          canvas.style.cursor = 'nw-resize';
        } else {
          canvas.style.cursor = 'ne-resize';
        }
      } else if (imageDataRef.current) {
        canvas.style.cursor = 'grab';
      }
    } else {
      canvas.style.cursor = 'default';
    }

    if (isDragging) {
      canvas.style.cursor = 'grabbing';
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      
      const maxOffsetX = 200;
      const maxOffsetY = 100;
      
      setImagePosition({
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))
      });
    } else if (isResizing) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;
      
      let scaleChange = 0;
      
      if (resizeStart.corner === 'br') {
        scaleChange = (deltaX + deltaY) / 200;
      } else if (resizeStart.corner === 'tl') {
        scaleChange = -(deltaX + deltaY) / 200;
      } else if (resizeStart.corner === 'tr') {
        scaleChange = (deltaX - deltaY) / 200;
      } else if (resizeStart.corner === 'bl') {
        scaleChange = (-deltaX + deltaY) / 200;
      }
      
      const newScale = Math.max(0.3, Math.min(3.0, resizeStart.scale + scaleChange));
      setImageScale(newScale);
    }
  };

  const handleMouseUp = () => {
    const canvas = previewCanvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add event listeners
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, imagePosition, imageScale, bgImage]);

  // Common text drawing function for both preview and final
  const drawTextSection = (ctx, canvasWidth, imageHeight, textHeight, isPreview = false) => {
    const scale = isPreview ? 1 : (canvasWidth / 320);
    const padding = isPreview ? 10 : 40;
    const brandFontSize = isPreview ? 12 : 48;
    const titleFontSize = isPreview ? 14 : 56;
    const footerFontSize = isPreview ? 10 : 36;
    const lineHeight = isPreview ? 18 : 70;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, imageHeight, canvasWidth, textHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${brandFontSize}px 'Arial', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    if (shadow) {
      ctx.shadowColor = "#333";
      ctx.shadowOffsetX = scale * 1;
      ctx.shadowOffsetY = scale * 1;
      ctx.shadowBlur = scale * 2;
    } else {
      ctx.shadowColor = "transparent";
    }

    ctx.fillText("Zafaroo News", padding, imageHeight + (isPreview ? 10 : 30));

    ctx.fillStyle = textColor;
    ctx.font = `bold ${titleFontSize}px 'Arial', sans-serif`;
    const newsText = editableTitle || cleanTitle(currentItem.title); // Use editable title
    const words = newsText.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      const maxWidth = canvasWidth - (padding * 2);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    const startY = imageHeight + (isPreview ? 40 : 120);
    lines.slice(0, 4).forEach((line, i) => {
      ctx.fillText(line.trim(), padding, startY + i * lineHeight);
    });

    ctx.font = `${footerFontSize}px 'Arial', sans-serif`;
    ctx.fillStyle = "#CCCCCC";
    ctx.shadowColor = "transparent";
    const footerText = `${currentItem.location || ""} | ${new Date(currentItem.date).toLocaleDateString("hi-IN")}`;
    const footerY = imageHeight + textHeight - (isPreview ? 15 : 60);
    ctx.fillText(footerText, padding, footerY);
  };

  const drawPreview = () => {
    if (!currentItem) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 320;
    canvas.height = 400;

    const imageHeight = canvas.height * 0.6;
    const textHeight = canvas.height * 0.4;

    if (bgImage) {
      const img = new Image();
      img.onload = () => {
        drawImageWithTransform(ctx, img, 0, 0, canvas.width, imageHeight, imagePosition.x, imagePosition.y, imageScale);
        drawTextSection(ctx, canvas.width, imageHeight, textHeight, true);
      };
      img.src = URL.createObjectURL(bgImage);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, imageHeight);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, imageHeight);
      drawTextSection(ctx, canvas.width, imageHeight, textHeight, true);
    }
  };

  const createNewsPost = () => {
    if (!currentItem) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");

    const imageHeight = canvas.height * 0.6;
    const textSectionHeight = canvas.height * 0.4;

    if (bgImage) {
      const img = new Image();
      img.onload = () => {
        const scaleX = canvas.width / 320;
        const scaleY = imageHeight / (400 * 0.6);
        const scaledPosition = {
          x: imagePosition.x * scaleX,
          y: imagePosition.y * scaleY
        };
        
        const { drawWidth, drawHeight } = calculateImageDimensions(img, canvas.width, imageHeight, imageScale);
        const baseX = (canvas.width - drawWidth) / 2;
        const baseY = (imageHeight - drawHeight) / 2;
        const finalX = baseX + scaledPosition.x;
        const finalY = baseY + scaledPosition.y;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, imageHeight);
        ctx.clip();
        ctx.drawImage(img, finalX, finalY, drawWidth, drawHeight);
        ctx.restore();
        
        drawTextSection(ctx, canvas.width, imageHeight, textSectionHeight, false);
        
        const link = document.createElement("a");
        link.download = "facebook_news_post.png";
        link.href = canvas.toDataURL();
        link.click();
        setShowModal(false);
      };
      img.src = URL.createObjectURL(bgImage);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, imageHeight);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, imageHeight);
      
      drawTextSection(ctx, canvas.width, imageHeight, textSectionHeight, false);
      
      const link = document.createElement("a");
      link.download = "facebook_news_post.png";
      link.href = canvas.toDataURL();
      link.click();
      setShowModal(false);
    }
  };

  const resetImageTransform = () => {
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1.0);
  };

  useEffect(() => {
    if (showModal) drawPreview();
  }, [bgColor, textColor, bgImage, shadow, showModal, imagePosition, imageScale, editableTitle]);

  if (loading) return <p className="px-2 text-[#551d54]">Loading news...</p>;

  return (
    <div className="px-2 ">
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
        
        {/* Location Select or Custom Input */}
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
        
        {/* Show current custom location if set */}
        {selectedLocation && !locations.slice(0, -1).includes(selectedLocation) && !isCustomLocation && (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded text-sm">
            <span className="text-blue-800">📍 {selectedLocation}</span>
            <button
              className="text-blue-600 hover:text-blue-800 font-bold"
              onClick={() => {
                setSelectedLocation("Paonta Sahib");
              }}
              title="Remove custom location"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* News list */}
      <div className="flex flex-col gap-2">
        {currentNews.map((item) => {
          const visitInfo = getVisitInfo(item);
          return (
            <div
              key={`${item.id}_${selectedLocation}`}
              className="container flex flex-col md:flex-row justify-between items-start md:items-center rounded-lg p-2 border border-gray-200"
            >
              <div className="flex-1 mb-2 md:mb-0">
                <button
                  onClick={() => handleLinkClick(item, item.link)}
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
                  onClick={() => openModal(item)}
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
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-[#6B3F69] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#551d54]">Create Facebook Portrait Post</h2>
            <p className="text-sm text-gray-600">Size: 1080x1350px (4:5 aspect ratio)</p>
            
            {/* Editable Title Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">News Title:</span>
                <div className="flex gap-1">
                  <button
                    onClick={generateAIText}
                    disabled={isGeneratingAI}
                    className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-1"
                    title="Generate AI enhanced title"
                  >
                    {isGeneratingAI ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    {isGeneratingAI ? "AI..." : "AI"}
                  </button>
                  <button
                    onClick={resetTitle}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    title="Reset to original title"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              <textarea
                ref={textareaRef}
                value={editableTitle}
                onChange={handleTextareaChange}
                className="w-full border rounded px-3 py-2 text-sm resize-none overflow-hidden min-h-[60px]"
                placeholder="Enter news title..."
                style={{ minHeight: '60px' }}
              />
              
              {aiError && (
                <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  {aiError}
                </p>
              )}
              
              <div className="text-xs text-gray-500">
                Characters: {editableTitle.length} | Words: {editableTitle.split(' ').filter(w => w).length}
              </div>
            </div>
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Background Color (Text Section):</span>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
                className="w-full h-10 border rounded"
              />
            </label>
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Text Color:</span>
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
                className="w-full h-10 border rounded"
              />
            </label>
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Background Image (Top Section):</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  setBgImage(e.target.files[0]);
                  setImagePosition({ x: 0, y: 0 });
                  setImageScale(1.0);
                }} 
                className="border rounded p-2"
              />
              {bgImage && (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 space-y-1">
                    <div>✨ Drag image to move position</div>
                    <div>🔄 Drag corner handles to resize</div>
                    <div>📏 Use slider for precise scaling</div>
                  </div>
                  <button 
                    onClick={resetImageTransform}
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </label>
            
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={shadow} 
                onChange={() => setShadow(!shadow)} 
              />
              <span className="text-sm">Text Shadow</span>
            </label>

            {/* Scale slider */}
            {bgImage && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Image Scale: {Math.round(imageScale * 100)}%</span>
                <input 
                  type="range" 
                  min="0.3" 
                  max="3.0" 
                  step="0.1"
                  value={imageScale}
                  onChange={(e) => setImageScale(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>30%</span>
                  <span>300%</span>
                </div>
              </label>
            )}
            
            <div>
              <p className="text-sm font-bold text-[#551d54] mb-2">
                Preview: {bgImage ? "(Interactive Editor)" : ""}
              </p>
              <canvas 
                ref={previewCanvasRef} 
                className="border w-full max-w-full h-auto rounded cursor-default"
                style={{ maxHeight: '300px' }}
              />
              {bgImage && (
                <div className="text-xs text-gray-500 mt-1 grid grid-cols-2 gap-2">
                  <div>Position: X: {Math.round(imagePosition.x)}, Y: {Math.round(imagePosition.y)}</div>
                  <div>Scale: {Math.round(imageScale * 100)}%</div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#6B3F69] text-white rounded hover:bg-[#70446f] transition-colors" 
                onClick={createNewsPost}
              >
                Generate Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsContainer;
