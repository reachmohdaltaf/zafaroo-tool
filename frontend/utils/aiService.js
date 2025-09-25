// utils/aiService.js
export const generateAIText = async (currentItem, selectedLocation, cleanTitle) => {
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

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': 'AIzaSyABbhtCpI3qj1m6jMvSAPtynWbuhxs4hFM'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const generatedText = data.candidates[0].content.parts[0].text.trim();
      return generatedText.replace(/^["']|["']$/g, '').trim();
    } else {
      throw new Error('No candidates in Gemini API response');
    }
  } catch (error) {
    // Fallback enhancement
    const originalTitle = cleanTitle(currentItem.title);
    let improvedTitle = originalTitle;
    
    if (originalTitle.toLowerCase().includes('police') || originalTitle.toLowerCase().includes('arrest')) {
      improvedTitle = `🚨 BREAKING: ${originalTitle}`;
    } else if (originalTitle.toLowerCase().includes('accident') || originalTitle.toLowerCase().includes('crash')) {
      improvedTitle = `⚠️ URGENT: ${originalTitle}`;
    } else if (originalTitle.toLowerCase().includes('government') || originalTitle.toLowerCase().includes('minister')) {
      improvedTitle = `🏛️ POLITICAL UPDATE: ${originalTitle}`;
    } else if (originalTitle.toLowerCase().includes('weather') || originalTitle.toLowerCase().includes('rain')) {
      improvedTitle = `🌧️ WEATHER ALERT: ${originalTitle}`;
    } else {
      improvedTitle = `📢 NEWS: ${originalTitle}`;
    }
    
    throw { enhancedTitle: improvedTitle, originalError: error };
  }
};
