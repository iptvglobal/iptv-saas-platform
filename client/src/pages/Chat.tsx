import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import ChatMessageContent from "@/components/ChatMessageContent";
import { 
  MessageCircle, 
  Send, 
  Plus,
  User,
  Shield,
  ArrowLeft
} from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: conversations, isLoading: conversationsLoading } = trpc.chat.myConversations.useQuery(
    undefined,
    { refetchInterval: 5000 } // Refetch every 5 seconds to check for new messages
  );
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId, refetchInterval: 3000 }
  );

  // Query to get unread counts for each conversation
  const { data: unreadCounts } = trpc.chat.getUnreadCounts.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  
  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      utils.chat.myConversations.invalidate();
      if (data.id) {
        setSelectedConversationId(data.id);
        setShowMobileChat(true);
      }
    }
  });
  
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId: selectedConversationId! });
      utils.chat.myConversations.invalidate();
      utils.chat.getUnreadCounts.invalidate();
      setNewMessage("");
    }
  });
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Select first conversation if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Invalidate unread counts when selecting a conversation (messages will be marked as read)
  useEffect(() => {
    if (selectedConversationId && messages) {
      // Small delay to allow the backend to mark messages as read
      const timer = setTimeout(() => {
        utils.chat.getUnreadCounts.invalidate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedConversationId, messages, utils.chat.getUnreadCounts]);

  // Sort conversations: unread first, then by lastMessageAt
  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    
    return [...conversations].sort((a, b) => {
      const aUnread = unreadCounts?.[a.id] || 0;
      const bUnread = unreadCounts?.[b.id] || 0;
      
      // First sort by unread (conversations with unread messages first)
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      // Then sort by lastMessageAt (most recent first)
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, unreadCounts]);
  
  const handleNewConversation = async () => {
    try {
      await createConversation.mutateAsync({ subject: "Support Request" });
      toast.success("New conversation started");
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;
    
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: newMessage.trim()
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleSelectConversation = (convId: number) => {
    setSelectedConversationId(convId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };
  
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  
  return (
    <UserLayout>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)]">
        <Card className="h-full overflow-hidden">
          <div className="flex h-full overflow-hidden">
            {/* Conversations List */}
            <div 
              className={`
                w-full md:w-80 
                border-r 
                flex flex-col
                flex-shrink-0
                overflow-hidden
                ${showMobileChat ? 'hidden md:flex' : 'flex'}
              `}
            >
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Messages</h2>
                  <Button 
                    size="sm" 
                    onClick={handleNewConversation}
                    disabled={createConversation.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-16 rounded-lg" />
                    ))}
                  </div>
                ) : !conversations || conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={handleNewConversation}
                      className="mt-2"
                    >
                      Start a conversation
                    </Button>
                  </div>
                ) : (
                  <div className="p-2">
                    {sortedConversations.map(conv => {
                      const unreadCount = unreadCounts?.[conv.id] || 0;
                      const hasUnread = unreadCount > 0;
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedConversationId === conv.id 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <MessageCircle className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              {/* Red dot indicator for unread messages */}
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className={`font-medium truncate ${hasUnread ? 'text-foreground' : ''}`}>
                                {conv.subject || `Conversation #${conv.id}`}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {conv.lastMessageAt 
                                  ? format(new Date(conv.lastMessageAt), "MMM d, h:mm a")
                                  : "No messages yet"
                                }
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            {/* Chat Area */}
            <div 
              className={`
                flex-1 
                flex flex-col
                min-w-0
                overflow-hidden
                ${!showMobileChat ? 'hidden md:flex' : 'flex'}
              `}
            >
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {/* Back button - only on mobile */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleBackToList}
                        className="md:hidden flex-shrink-0 -ml-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <MessageCircle className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-medium truncate">
                          {selectedConversation?.subject || `Conversation #${selectedConversationId}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Support Team
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        {messagesLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="skeleton h-16 rounded-lg" />
                            ))}
                          </div>
                        ) : !messages || messages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-muted-foreground py-20">
                            <div className="text-center">
                              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>No messages yet</p>
                              <p className="text-sm">Send a message to start the conversation</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map(msg => {
                              const isOwn = msg.senderId === user?.id;
                              const isStaff = msg.senderRole === "admin" || msg.senderRole === "agent";
                              
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex gap-2 md:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                                >
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className={isStaff ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                      {isStaff ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`max-w-[70%] min-w-0 ${isOwn ? "text-right" : ""}`}>
                                    <div
                                      className={`inline-block p-3 rounded-lg break-words ${
                                        isOwn 
                                          ? "bg-primary text-primary-foreground" 
                                          : "bg-muted"
                                  }`}
                                  style={{ 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
                                  }}
                                >
                                  <ChatMessageContent content={msg.message} isUserMessage={!isAdmin} />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(msg.createdAt), "h:mm a")}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0 bg-background">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 min-w-0 resize-none"
                        rows={1}
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        className="gradient-primary flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Welcome to Support Chat</h3>
                    <p className="text-sm mb-4">Select a conversation or start a new one</p>
                    <Button onClick={handleNewConversation}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </UserLayout>
  );
}
