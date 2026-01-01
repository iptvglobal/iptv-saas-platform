import React from 'react';

interface ChatMessageContentProps {
  content: string;
  isUserMessage: boolean;
}

// Regex to find URLs: http(s)://... or www....
// Updated Regex to include common TLDs and simplify the pattern for better matching
const urlRegex = /(\b(https?:\/\/[^\s]+)|(\bwww\.[^\s]+))/ig;

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content, isUserMessage }) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  content.replace(urlRegex, (match, p1, p2, offset) => {
    // Add the text before the link
    if (offset > lastIndex) {
      parts.push(content.substring(lastIndex, offset));
    }

    // Determine the full URL for the href attribute
    let url = match;
    if (!url.match(/^https?:\/\//i)) {
      url = 'http://' + url;
    }

    // Add the link component
    parts.push(
      <a 
        key={offset} 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        // Use a slightly different color for better contrast on the blue background
className={`underline ${isUserMessage ? 'text-white hover:text-gray-200' : 'text-blue-600 hover:text-blue-500'}`}
      >
        {match}
      </a>
    );

    lastIndex = offset + match.length;
    return match;
  });

  // Add the remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {parts.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </p>
  );
};

export default ChatMessageContent;
