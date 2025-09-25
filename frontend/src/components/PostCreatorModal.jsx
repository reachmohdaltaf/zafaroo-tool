// components/PostCreatorModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Copy, Download, Wand2, RefreshCw, Type, Upload, ImageIcon,
  Hash, MessageSquare, Check, X, Move, RotateCcw, ZoomIn, ZoomOut,
  Palette, Settings, Smartphone, Monitor, Tablet
} from "lucide-react";
import {
  drawImageWithTransform,
  drawTextSection,
  getResizeCorner,
  calculateImageDimensions
} from '../../utils/canvasUtils';

const PostCreatorModal = ({
  show,
  onClose,
  currentItem,
  selectedLocation,
  cleanTitle
}) => {
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#FFFF00");
  const [bgImage, setBgImage] = useState(null);
  const [shadow, setShadow] = useState(true);
  const [editableTitle, setEditableTitle] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });

  // Text styling states
  const [titleFontSize, setTitleFontSize] = useState(24);
  const [metaFontSize, setMetaFontSize] = useState(14);
  const [textAlignment, setTextAlignment] = useState('left');
  const [lineHeight, setLineHeight] = useState(1.2);

  // Facebook description/hashtag states
  const [fbDescription, setFbDescription] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Drag & drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteNotification, setPasteNotification] = useState("");

  // UI states
  const [activeTab, setActiveTab] = useState('design');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState('mobile');

  const previewCanvasRef = useRef(null);
  const imageDataRef = useRef(null);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalRef = useRef(null);

  // Reset all states when opened
  useEffect(() => {
    if (show && currentItem) {
      setEditableTitle(cleanTitle(currentItem.title));
      setBgColor("#000000");
      setTextColor("#FFFF00");
      setBgImage(null);
      setShadow(true);
      setImagePosition({ x: 0, y: 0 });
      setImageScale(1.0);
      setAiError("");
      setFbDescription("");
      setDescriptionError("");
      setIsCopied(false);
      setIsDragOver(false);
      setPasteNotification("");
      setActiveTab('design');
      setTimeout(() => {
        if (textareaRef.current) {
          autoResizeTextarea(textareaRef.current);
        }
      }, 100);
    }
  }, [show, currentItem]);

  // Clipboard paste event for images
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!show) return;
      e.preventDefault();
      const items = e.clipboardData?.items;
      if (items) {
        for (let item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              handleImageFile(file);
              setPasteNotification("✅ Image pasted successfully!");
              setTimeout(() => setPasteNotification(""), 3000);
              break;
            }
          }
        }
      }
    };
    if (show) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [show]);

  // Handle image file upload
  const handleImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setBgImage(file);
      setImagePosition({ x: 0, y: 0 });
      setImageScale(1.0);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget)) setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
        setPasteNotification("✅ Image dropped successfully!");
        setTimeout(() => setPasteNotification(""), 3000);
      } else {
        setPasteNotification("❌ Please drop an image file only");
        setTimeout(() => setPasteNotification(""), 3000);
      }
    }
  };

  // Textarea auto-resize
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleTextareaChange = (e) => {
    setEditableTitle(e.target.value);
    autoResizeTextarea(e.target);
  };

  // AI-enhanced Title
  const generateAIText = async () => {
    setIsGeneratingAI(true);
    setAiError("");
    try {
      const prompt = `Rewrite this in hindi news headline in a more engaging and compelling way while keeping the same meaning and key information. Make it suitable for social media sharing:
"${cleanTitle(currentItem.title)}"
Location: ${currentItem.location || selectedLocation}
Date: ${new Date(currentItem.date).toLocaleDateString("en-IN")}
Instructions:
- Keep it concise and in hindi but impactful
- Maintain factual accuracy  
- Make it more engaging for social media
- Keep it under 150 characters if possible
- Do not add emojis or hashtags
- Make it sound more dramatic and attention-grabbing
- Focus on the most important aspect of the news
Provide only the rewritten headline, nothing else.`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyABbhtCpI3qj1m6jMvSAPtynWbuhxs4hFM'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
            stopSequences: []
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        const cleanText = generatedText.replace(/^[\"']|[\"']$/g, '').trim();
        if (cleanText) {
          setEditableTitle(cleanText);
          setTimeout(() => {
            if (textareaRef.current) autoResizeTextarea(textareaRef.current);
          }, 0);
        } else {
          throw new Error('Empty response from Gemini API');
        }
      } else throw new Error('No candidates in Gemini API response');
    } catch (error) {
      setAiError(`Gemini AI unavailable: ${error.message}. Applied manual enhancement.`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Facebook Description Generation
  const generateFacebookDescription = async () => {
    setIsGeneratingDescription(true);
    setDescriptionError("");
    try {
      const prompt = `Create an engaging Facebook post description in hindi based on this news headline:

Title: "${editableTitle || cleanTitle(currentItem.title)}"
Location: ${currentItem.location || selectedLocation}
Date: ${new Date(currentItem.date).toLocaleDateString("en-IN")}

Instructions:
- Write in Hindi/English mix (Hinglish) as appropriate for Indian Facebook audience
- Create 2-3 engaging sentences that summarize the news research from internet if there is similiar news also if there is
- Make it shareable and conversation-starting
- Include 5-8 relevant hashtags at the end
- Keep it under 300 words
- Make it suitable for Facebook sharing
- Focus on the human impact or significance of the news
- Use emojis strategically (2-3 maximum)

Format:
[Engaging description paragraph]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8 #hashtag9 #hashtag10

Provide only the Facebook post content, nothing else.`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyABbhtCpI3qj1m6jMvSAPtynWbuhxs4hFM'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
            stopSequences: []
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        const generatedDescription = data.candidates[0].content.parts[0].text.trim();
        if (generatedDescription) {
          setFbDescription(generatedDescription);
        } else throw new Error('Empty response from Gemini API');
      } else throw new Error('No candidates in Gemini API response');
    } catch (error) {
      setDescriptionError(`Description generation failed: ${error.message}`);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Copy to Clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fbDescription);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = fbDescription;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Mouse/canvas handlers
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
      const resizeCorner = getResizeCorner(mouseX, mouseY, imageDataRef);
      if (resizeCorner) {
        setIsResizing(true);
        setResizeStart({ x: mouseX, y: mouseY, scale: imageScale, corner: resizeCorner });
      } else {
        setIsDragging(true);
        setDragStart({ x: mouseX - imagePosition.x, y: mouseY - imagePosition.y });
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
      const resizeCorner = getResizeCorner(mouseX, mouseY, imageDataRef);
      if (resizeCorner) {
        if (resizeCorner === 'tl' || resizeCorner === 'br') canvas.style.cursor = 'nw-resize';
        else canvas.style.cursor = 'ne-resize';
      } else if (imageDataRef.current) canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    
    if (isDragging) {
      canvas.style.cursor = 'grabbing';
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      setImagePosition({
        x: Math.max(-200, Math.min(200, newX)),
        y: Math.max(-100, Math.min(100, newY))
      });
    } else if (isResizing) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;
      let scaleChange = 0;
      
      if (resizeStart.corner === 'br') scaleChange = (deltaX + deltaY) / 200;
      else if (resizeStart.corner === 'tl') scaleChange = -(deltaX + deltaY) / 200;
      else if (resizeStart.corner === 'tr') scaleChange = (deltaX - deltaY) / 200;
      else if (resizeStart.corner === 'bl') scaleChange = (-deltaX + deltaY) / 200;
      
      const newScale = Math.max(0.3, Math.min(3.0, resizeStart.scale + scaleChange));
      setImageScale(newScale);
    }
  };

  const handleMouseUp = () => {
    const canvas = previewCanvasRef.current;
    if (canvas) canvas.style.cursor = 'default';
    setIsDragging(false);
    setIsResizing(false);
  };

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
        drawImageWithTransform(ctx, img, 0, 0, canvas.width, imageHeight,
          imagePosition.x, imagePosition.y, imageScale, imageDataRef);
        drawTextSection(ctx, canvas.width, imageHeight, textHeight,
          currentItem, editableTitle, cleanTitle, selectedLocation,
          bgColor, textColor, shadow, true, titleFontSize, metaFontSize, textAlignment, lineHeight);
      };
      img.src = URL.createObjectURL(bgImage);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, imageHeight);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, imageHeight);
      drawTextSection(ctx, canvas.width, imageHeight, textHeight,
        currentItem, editableTitle, cleanTitle, selectedLocation,
        bgColor, textColor, shadow, true, titleFontSize, metaFontSize, textAlignment, lineHeight);
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
        
        drawTextSection(ctx, canvas.width, imageHeight, textSectionHeight,
          currentItem, editableTitle, cleanTitle, selectedLocation,
          bgColor, textColor, shadow, false, titleFontSize, metaFontSize, textAlignment, lineHeight);
        
        const link = document.createElement("a");
        link.download = "facebook_news_post.png";
        link.href = canvas.toDataURL();
        link.click();
        onClose();
      };
      img.src = URL.createObjectURL(bgImage);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, imageHeight);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, imageHeight);
      
      drawTextSection(ctx, canvas.width, imageHeight, textSectionHeight,
        currentItem, editableTitle, cleanTitle, selectedLocation,
        bgColor, textColor, shadow, false, titleFontSize, metaFontSize, textAlignment, lineHeight);
      
      const link = document.createElement("a");
      link.download = "facebook_news_post.png";
      link.href = canvas.toDataURL();
      link.click();
      onClose();
    }
  };

  const resetImageTransform = () => {
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1.0);
  };

  useEffect(() => {
    if (show) drawPreview();
  }, [
    bgColor, textColor, bgImage, shadow, show, imagePosition, imageScale,
    editableTitle, titleFontSize, metaFontSize, textAlignment, lineHeight
  ]);

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'mobile': return { width: 'max-w-sm', height: 'max-h-[70vh]' };
      case 'tablet': return { width: 'max-w-md', height: 'max-h-[75vh]' };
      case 'desktop': return { width: 'max-w-lg', height: 'max-h-[80vh]' };
      default: return { width: 'max-w-sm', height: 'max-h-[70vh]' };
    }
  };

  if (!show) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 flex items-center  justify-center bg-black/60 backdrop-blur-sm z-50 p-2 sm:p-4"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full max-w-none max-h-none' 
          : 'w-full max-w-7xl max-h-[95vh]'
      } flex flex-col lg:flex-row`}>
        
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-4 border-dashed border-blue-500 rounded-2xl z-10 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center backdrop-blur-sm border border-gray-200">
              <Upload size={48} className="mx-auto mb-4 text-blue-500 animate-bounce" />
              <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Drop your image here
              </p>
              <p className="text-sm text-gray-600 mt-2">Release to upload as background image</p>
            </div>
          </div>
        )}

        {/* Paste Notification */}
        {pasteNotification && (
          <div className="absolute top-4 right-4 bg-white border rounded-xl p-3 shadow-lg z-20 animate-bounce backdrop-blur-sm">
            <p className="text-sm font-medium">{pasteNotification}</p>
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white p-4 z-10 lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">📱 Post Creator</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Left Panel - Controls */}
        <div ref={dropZoneRef} className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
          <div className="p-4 sm:p-6 pt-20 lg:pt-6 space-y-6">
            
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-rose-500 bg-clip-text text-transparent">
                  Facebook Post Creator
                </h2>
                <p className="text-sm text-gray-600">Size: 1080x1350px (4:5 aspect ratio)</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
              {[
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'content', label: 'Content', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Design Tab */}
              {activeTab === 'design' && (
                <div className="space-y-6">
                  {/* Quick Upload Tips */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon size={18} className="text-blue-600" />
                      <span className="font-semibold text-blue-700">Quick Image Upload</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">🖱️</div>
                        <span><strong>Drag & Drop:</strong> Drag image here</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">⌨️</div>
                        <span><strong>Ctrl+V:</strong> Paste copied image</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">📁</div>
                        <span><strong>File Upload:</strong> Use input below</span>
                      </div>
                    </div>
                  </div>

                  {/* Background Image Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <ImageIcon size={16} />
                      Background Image (Top Section)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => { if (e.target.files[0]) handleImageFile(e.target.files[0]); }}
                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gradient-to-r file:from-red-500 file:to-rose-500 file:text-white hover:file:from-red-600 hover:file:to-rose-600"
                      />
                    </div>
                    
                    {bgImage && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-green-700 mb-3">
                          <div className="flex items-center gap-2">
                            <Move size={14} />
                            <span><strong>Drag image</strong> to move position</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ZoomIn size={14} />
                            <span><strong>Drag corners</strong> to resize</span>
                          </div>
                        </div>
                        <button
                          onClick={resetImageTransform}
                          className="w-full sm:w-auto px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={14} />
                          Reset Position & Scale
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Color Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Background Color</label>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer hover:border-red-300 focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Text Color</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer hover:border-red-300 focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Image Scale Control */}
                  {bgImage && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ZoomIn size={16} />
                        Image Scale: {Math.round(imageScale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="3.0"
                        step="0.1"
                        value={imageScale}
                        onChange={(e) => setImageScale(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gradient-to-r from-red-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>30% (Min)</span>
                        <span>100% (Original)</span>
                        <span>300% (Max)</span>
                      </div>
                    </div>
                  )}

                  {/* Shadow Toggle */}
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-red-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={shadow}
                      onChange={() => setShadow(!shadow)}
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Add Text Shadow</span>
                  </label>
                </div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="space-y-6">
                  {/* Editable Title */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-gray-700">News Title:</label>
                      <div className="flex gap-2">
                        <button
                          onClick={generateAIText}
                          disabled={isGeneratingAI}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white rounded-lg text-sm hover:from-purple-600 hover:via-purple-700 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {isGeneratingAI ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Wand2 size={14} />
                          )}
                          {isGeneratingAI ? "Generating..." : "✨ AI Enhance"}
                        </button>
                        <button
                          onClick={() => {
                            setEditableTitle(cleanTitle(currentItem.title));
                            setAiError("");
                            setTimeout(() => {
                              if (textareaRef.current) autoResizeTextarea(textareaRef.current);
                            }, 0);
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      value={editableTitle}
                      onChange={handleTextareaChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none overflow-hidden min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-colors"
                      placeholder="Enter news title..."
                    />
                    
                    {aiError && (
                      <div className="text-xs text-orange-700 bg-gradient-to-r from-orange-50 to-yellow-50 px-4 py-3 rounded-xl border-l-4 border-orange-300">
                        <div className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span>{aiError}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Characters: {editableTitle.length}</span>
                      <span>Words: {editableTitle.split(' ').filter(w => w).length}</span>
                    </div>
                  </div>

                  {/* Text Styling Controls */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Type size={18} className="text-blue-600" />
                      <span className="font-semibold text-blue-700">Text Styling Controls</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-blue-700">
                          Title Font Size: {titleFontSize}px
                        </label>
                        <input
                          type="range"
                          min="16"
                          max="40"
                          step="2"
                          value={titleFontSize}
                          onChange={(e) => setTitleFontSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-blue-700">
                          Meta Font Size: {metaFontSize}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="20"
                          step="1"
                          value={metaFontSize}
                          onChange={(e) => setMetaFontSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-blue-700">Text Alignment:</label>
                        <select
                          value={textAlignment}
                          onChange={(e) => setTextAlignment(e.target.value)}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-blue-700">
                          Line Height: {lineHeight}
                        </label>
                        <input
                          type="range"
                          min="1.0"
                          max="2.0"
                          step="0.1"
                          value={lineHeight}
                          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Facebook Description Generator */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-600" />
                        <span className="font-semibold text-blue-700">Facebook Post Description</span>
                      </div>
                      <button
                        onClick={generateFacebookDescription}
                        disabled={isGeneratingDescription || !editableTitle.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 text-white rounded-lg text-sm hover:from-blue-600 hover:via-blue-700 hover:to-indigo-600 disabled:opacity-50 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {isGeneratingDescription ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Hash size={14} />
                        )}
                        {isGeneratingDescription ? "Generating..." : "🚀 Generate Description"}
                      </button>
                    </div>
                    
                    {descriptionError && (
                      <div className="text-xs text-red-700 bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 rounded-xl border-l-4 border-red-300 mb-4">
                        <div className="flex items-center gap-2">
                          <span>❌</span>
                          <span>{descriptionError}</span>
                        </div>
                      </div>
                    )}
                    
                    {fbDescription && (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm leading-relaxed max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">{fbDescription}</pre>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs text-gray-600">
                            Characters: {fbDescription.length} | Words: {fbDescription.split(' ').filter(w => w).length}
                          </span>
                          <button
                            onClick={copyToClipboard}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                              isCopied 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check size={14} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                Copy Description
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-700 mt-4 p-3 bg-blue-100/50 rounded-lg">
                      <p>💡 <strong>Tip:</strong> Generate description after finalizing your title for best results</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br overflow-auto from-gray-100 to-gray-200 flex flex-col">
          <div className="p-4 sm:p-6 flex-1 flex flex-col">
            {/* Preview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <p className="font-bold text-gray-800 flex items-center gap-2">
                  <span>📱 Preview</span>
                  {bgImage && (
                    <span className="text-xs font-normal text-gray-600 bg-white px-2 py-1 rounded-lg">
                      Interactive Editor
                    </span>
                  )}
                </p>
              </div>
              
              {/* Preview Mode Selector */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                {[
                  { id: 'mobile', icon: Smartphone },
                  { id: 'tablet', icon: Tablet },
                  { id: 'desktop', icon: Monitor }
                ].map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPreviewMode(mode.id)}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        previewMode === mode.id
                          ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={`${getPreviewSize().width} ${getPreviewSize().height} w-full`}>
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto rounded-xl cursor-default shadow-2xl bg-white border-4 border-white"
                />
              </div>
              
              {bgImage && (
                <div className="mt-4 grid grid-cols-2 gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-full max-w-sm">
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <Move size={12} />
                    Position: X: {Math.round(imagePosition.x)}, Y: {Math.round(imagePosition.y)}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <ZoomIn size={12} />
                    Scale: {Math.round(imageScale * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-52 pt-6 border-t border-gray-300">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden lg:flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <Settings size={16} />
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              
              <button
                onClick={createNewsPost}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white rounded-xl hover:from-red-600 hover:via-red-700 hover:to-rose-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <Download size={18} />
                Generate Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ef4444, #f43f5e);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ef4444, #f43f5e);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }
        @media (max-width: 640px) {
          .slider::-webkit-slider-thumb {
            height: 24px;
            width: 24px;
          }
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default PostCreatorModal;
