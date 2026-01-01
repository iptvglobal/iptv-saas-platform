import React from 'react';

interface ChatMessageContentProps {
  content: string;
  isUserMessage: boolean;
}

const urlRegex = /(\b(https?:\/\/[^\s]+)|(\bwww\.[^\s]+))/ig;

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content, isUserMessage }) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const matches = [...content.matchAll(urlRegex)];

  matches.forEach((match) => {
    const offset = match.index!;
    const fullMatch = match[0];

    if (offset > lastIndex) {
      parts.push(content.substring(lastIndex, offset));
    }

    let url = fullMatch;
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    parts.push(
      <a
        key={offset}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline ${
          isUserMessage
            ? 'text-white hover:text-gray-200'
            : 'text-blue-600 hover:text-blue-500'
        }`}
      >
        {fullMatch}
      </a>
    );

    lastIndex = offset + fullMatch.length;
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return (
    <p
      className={`text-sm whitespace-pre-wrap break-words ${
        isUserMessage ? 'text-white' : 'text-gray-900'
      }`}
    >
      {parts.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </p>
  );
};

export default ChatMessageContent;
