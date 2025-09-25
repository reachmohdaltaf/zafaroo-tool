// utils/canvasUtils.js

export const calculateImageDimensions = (img, containerWidth, containerHeight, scale = 1) => {
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

export const drawImageWithTransform = (ctx, img, x, y, width, height, offsetX = 0, offsetY = 0, scale = 1, imageDataRef) => {
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

export const drawResizeHandles = (ctx, x, y, width, height) => {
  const handleSize = 12;
  
  const handles = [
    { x: x - handleSize/2, y: y - handleSize/2 }, // top-left
    { x: x + width - handleSize/2, y: y - handleSize/2 }, // top-right
    { x: x - handleSize/2, y: y + height - handleSize/2 }, // bottom-left
    { x: x + width - handleSize/2, y: y + height - handleSize/2 } // bottom-right
  ];
  
  handles.forEach(handle => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    ctx.fillStyle = "#333";
    ctx.fillRect(handle.x + 3, handle.y + 3, handleSize - 6, handleSize - 6);
  });
};

export const getResizeCorner = (mouseX, mouseY, imageDataRef) => {
  if (!imageDataRef.current) return null;
  
  const { x, y, width, height } = imageDataRef.current;
  const handleSize = 12;
  
  const corners = [
    { name: "tl", x: x - handleSize/2, y: y - handleSize/2 },
    { name: "tr", x: x + width - handleSize/2, y: y - handleSize/2 },
    { name: "bl", x: x - handleSize/2, y: y + height - handleSize/2 },
    { name: "br", x: x + width - handleSize/2, y: y + height - handleSize/2 }
  ];
  
  for (let corner of corners) {
    if (mouseX >= corner.x && mouseX <= corner.x + handleSize &&
        mouseY >= corner.y && mouseY <= corner.y + handleSize) {
      return corner.name;
    }
  }
  
  return null;
};

// ✅ FIXED: Updated drawTextSection with proper font scaling
export const drawTextSection = (
  ctx, 
  canvasWidth, 
  imageHeight, 
  textHeight, 
  currentItem, 
  editableTitle, 
  cleanTitle, 
  selectedLocation, 
  bgColor, 
  textColor, 
  shadow, 
  isPreview = false, 
  titleFontSize = 24, 
  metaFontSize = 14, 
  textAlignment = 'left', 
  lineHeight = 1.2
) => {
  // ✅ FIX: Use reasonable scaling factors instead of hardcoded 3.375
  const PREVIEW_WIDTH = 320;
  const FINAL_WIDTH = 1080;
  
  // Calculate proper scaling - but limit it to prevent oversized fonts
  const baseScale = canvasWidth / PREVIEW_WIDTH;
  const maxScale = 2.5; // Limit maximum scaling to prevent huge fonts
  const scale = isPreview ? 1 : Math.min(baseScale, maxScale);
  
  const padding = isPreview ? 10 : 40;
  
  // ✅ FIXED: More reasonable font scaling
  const brandFontSize = (metaFontSize * 0.85) * scale;
  const dynamicTitleFontSize = titleFontSize * scale;
  const footerFontSize = (metaFontSize * 0.7) * scale;
  const dynamicLineHeight = titleFontSize * lineHeight * scale;

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, imageHeight, canvasWidth, textHeight);

  // Brand name with dynamic alignment
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${brandFontSize}px 'Arial', sans-serif`;
  ctx.textAlign = textAlignment;
  ctx.textBaseline = "top";
  
  if (shadow) {
    ctx.shadowColor = "#333";
    ctx.shadowOffsetX = scale * 1;
    ctx.shadowOffsetY = scale * 1;
    ctx.shadowBlur = scale * 2;
  } else {
    ctx.shadowColor = "transparent";
  }

  // Position brand text based on alignment
  let brandX = padding;
  if (textAlignment === 'center') {
    brandX = canvasWidth / 2;
  } else if (textAlignment === 'right') {
    brandX = canvasWidth - padding;
  }

  ctx.fillText("Zafaroo News", brandX, imageHeight + (isPreview ? 10 : 30));

  // Main title with dynamic styling
  ctx.fillStyle = textColor;
  ctx.font = `bold ${dynamicTitleFontSize}px 'Arial', sans-serif`;
  ctx.textAlign = textAlignment;
  
  const newsText = editableTitle || cleanTitle(currentItem.title);
  const words = newsText.split(' ');
  const lines = [];
  let currentLine = '';

  // Text wrapping with proper width calculation
  const maxWidth = canvasWidth - (padding * 2);
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);

  const startY = imageHeight + (isPreview ? 40 : 120);
  
  // Draw lines with proper alignment and dynamic line height
  lines.slice(0, 4).forEach((line, i) => {
    let lineX = padding;
    if (textAlignment === 'center') {
      lineX = canvasWidth / 2;
    } else if (textAlignment === 'right') {
      lineX = canvasWidth - padding;
    }
    
    ctx.fillText(line.trim(), lineX, startY + i * dynamicLineHeight);
  });

  // Footer with dynamic alignment
  ctx.font = `${footerFontSize}px 'Arial', sans-serif`;
  ctx.fillStyle = "#CCCCCC";
  ctx.shadowColor = "transparent";
  ctx.textAlign = textAlignment;
  
  const footerText = `${currentItem.location || selectedLocation || ""} | ${new Date(currentItem.date).toLocaleDateString("hi-IN")}`;
  const footerY = imageHeight + textHeight - (isPreview ? 15 : 60);
  
  // Position footer text based on alignment
  let footerX = padding;
  if (textAlignment === 'center') {
    footerX = canvasWidth / 2;
  } else if (textAlignment === 'right') {
    footerX = canvasWidth - padding;
  }
  
  ctx.fillText(footerText, footerX, footerY);
};
