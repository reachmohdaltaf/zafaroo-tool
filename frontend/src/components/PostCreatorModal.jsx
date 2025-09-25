// components/PostCreatorModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Copy, Download, Wand2, RefreshCw, Type, Upload, ImageIcon,
  Hash, MessageSquare, Check
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
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget)) setIsDragOver(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
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
            temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 150, stopSequences: []
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
    setIsGeneratingDescription(true); setDescriptionError("");
    try {
      const prompt = `Create an engaging Facebook post description in hindi based on this news headline:

Title: "${editableTitle || cleanTitle(currentItem.title)}"
Location: ${currentItem.location || selectedLocation}
Date: ${new Date(currentItem.date).toLocaleDateString("en-IN")}

Instructions:
- Write in Hindi/English mix (Hinglish) as appropriate for Indian Facebook audience
- Create 2-3 engaging sentences that summarize the news
- Make it shareable and conversation-starting
- Include 5-8 relevant hashtags at the end
- Keep it under 200 words
- Make it suitable for Facebook sharing
- Focus on the human impact or significance of the news
- Use emojis strategically (2-3 maximum)

Format:
[Engaging description paragraph]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

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
            temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 300, stopSequences: []
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
      // Fallback for older browsers
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

  const resetImageTransform = () => setImagePosition({ x: 0, y: 0 }) & setImageScale(1.0);

  useEffect(() => {
    if (show) drawPreview();
  }, [
    bgColor, textColor, bgImage, shadow, show, imagePosition, imageScale,
    editableTitle, titleFontSize, metaFontSize, textAlignment, lineHeight
  ]);

  if (!show) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col lg:flex-row">
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 rounded-lg z-10 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <Upload size={48} className="mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-semibold text-blue-700">Drop your image here</p>
              <p className="text-sm text-gray-600 mt-2">Release to upload as background image</p>
            </div>
          </div>
        )}
        {/* Paste Notification */}
        {pasteNotification && (
          <div className="absolute top-4 right-4 bg-white border rounded-lg p-3 shadow-lg z-20 animate-bounce">
            <p className="text-sm font-medium">{pasteNotification}</p>
          </div>
        )}
        {/* Left Panel - Controls */}
        <div ref={dropZoneRef} className="w-full lg:w-1/2 p-6 overflow-y-auto lg:max-h-[95vh]">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#551d54]">Create Facebook Portrait Post</h2>
              <button className="lg:hidden px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm" onClick={onClose}>
                ✕ Close
              </button>
            </div>
            <p className="text-sm text-gray-600">Size: 1080x1350px (4:5 aspect ratio)</p>
            {/* Quick Upload Tips */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Quick Image Upload</span>
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <div>🖱️ <strong>Drag & Drop:</strong> Drag any image file here</div>
                <div>⌨️ <strong>Ctrl+V:</strong> Copy image anywhere and paste with Ctrl+V</div>
                <div>📁 <strong>File Upload:</strong> Use the file input below</div>
              </div>
            </div>
            {/* Editable Title Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">News Title:</span>
                <div className="flex gap-1">
                  <button
                    onClick={generateAIText}
                    disabled={isGeneratingAI}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-1 transition-all duration-200"
                    title="Generate AI enhanced title using Google Gemini 2.0 Flash"
                  >
                    {isGeneratingAI ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    {isGeneratingAI ? "Generating..." : "✨ AI Enhance"}
                  </button>
                  <button
                    onClick={() => { setEditableTitle(cleanTitle(currentItem.title)); setAiError(""); setTimeout(() => { if (textareaRef.current) autoResizeTextarea(textareaRef.current); }, 0); }}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
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
                className="w-full border rounded px-3 py-2 text-sm resize-none overflow-hidden min-h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Enter news title..."
                style={{ minHeight: '60px' }}
              />
              {aiError && (
                <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded border-l-4 border-orange-200">
                  <div className="flex items-center gap-1">
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
            {/* Facebook Description Generator Section */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Facebook Post Description</span>
                </div>
                <button
                  onClick={generateFacebookDescription}
                  disabled={isGeneratingDescription || !editableTitle.trim()}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded text-xs hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 flex items-center gap-1 transition-all duration-200"
                  title="Generate Facebook post description with hashtags"
                >
                  {isGeneratingDescription ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Hash size={12} />
                  )}
                  {isGeneratingDescription ? "Generating..." : "🚀 Generate Description"}
                </button>
              </div>
              {descriptionError && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded border-l-4 border-red-200">
                  <div className="flex items-center gap-1">
                    <span>❌</span>
                    <span>{descriptionError}</span>
                  </div>
                </div>
              )}
              {fbDescription && (
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border text-sm leading-relaxed max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{fbDescription}</pre>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Characters: {fbDescription.length} | Words: {fbDescription.split(' ').filter(w => w).length}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className={`px-3 py-1 rounded text-xs flex items-center gap-1 transition-all duration-200 ${
                        isCopied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy Description
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div className="text-xs text-blue-600">
                <p>💡 <strong>Tip:</strong> Generate description after finalizing your title for best results</p>
              </div>
            </div>
            {/* Text Styling Controls */}
            <div className="space-y-3 p-3 bg-blue-50 rounded border">
              <div className="flex items-center gap-2">
                <Type size={16} />
                <span className="text-sm font-medium text-blue-700">Text Styling Controls</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Title Font Size: {titleFontSize}px</span>
                  <input
                    type="range"
                    min="16"
                    max="40"
                    step="2"
                    value={titleFontSize}
                    onChange={(e) => setTitleFontSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Meta Font Size: {metaFontSize}px</span>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={metaFontSize}
                    onChange={(e) => setMetaFontSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Text Alignment:</span>
                  <select
                    value={textAlignment}
                    onChange={(e) => setTextAlignment(e.target.value)}
                    className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Line Height: {lineHeight}</span>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Background Color (Text Section):</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Text Color:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Background Image (Top Section):</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { if (e.target.files[0]) handleImageFile(e.target.files[0]); }}
                className="border rounded p-2 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {bgImage && (
                <div className="space-y-2 p-3 bg-green-50 rounded border">
                  <div className="text-xs text-green-700 space-y-1">
                    <div>✨ <strong>Drag image</strong> to move position</div>
                    <div>🔄 <strong>Drag corner handles</strong> to resize</div>
                    <div>📏 <strong>Use slider below</strong> for precise scaling</div>
                  </div>
                  <button
                    onClick={resetImageTransform}
                    className="text-xs bg-white px-3 py-1 rounded hover:bg-gray-50 border transition-colors"
                  >
                    🔄 Reset Position & Scale
                  </button>
                </div>
              )}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shadow}
                onChange={() => setShadow(!shadow)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm">Add Text Shadow</span>
            </label>
            {bgImage && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Image Scale: {Math.round(imageScale * 100)}%</span>
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.1"
                  value={imageScale}
                  onChange={(e) => setImageScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>30% (Min)</span>
                  <span>100% (Original)</span>
                  <span>300% (Max)</span>
                </div>
              </label>
            )}
          </div>
        </div>
        {/* Right Panel - Preview */}
        <div className="w-full lg:w-1/2 p-6 bg-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#551d54] flex items-center gap-2">
              <span>📱 Preview:</span>
              {bgImage && <span className="text-xs font-normal text-gray-600">(Interactive Editor - Drag & Resize)</span>}
            </p>
            <button className="hidden lg:block px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={onClose}>
              ✕ Close
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              className="border w-full max-w-sm h-auto rounded cursor-default shadow-lg bg-white"
              style={{ maxHeight: '60vh' }}
            />
            {bgImage && (
              <div className="text-xs text-gray-500 mt-3 grid grid-cols-2 gap-2 p-3 bg-white rounded shadow-sm w-full max-w-sm">
                <div>📍 Position: X: {Math.round(imagePosition.x)}, Y: {Math.round(imagePosition.y)}</div>
                <div>🔍 Scale: {Math.round(imageScale * 100)}%</div>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button
              className="px-4 py-2 bg-[#6B3F69] text-white rounded hover:bg-[#70446f] transition-colors font-medium flex items-center gap-2"
              onClick={createNewsPost}
            >
              <Download size={16} />
              Generate Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreatorModal;
