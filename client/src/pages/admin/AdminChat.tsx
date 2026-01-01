import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Send,
  User,
  Search,
  ArrowLeft
} from "lucide-react";

export default function AdminChat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: conversations, isLoading } = trpc.chat.listConversations.useQuery(
    undefined,
    { refetchInterval: 5000 } // Refetch every 5 seconds to check for new messages
  );
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query to get unread counts for admin (messages from users)
  const { data: unreadCounts } = trpc.chat.getAdminUnreadCounts.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation, refetchInterval: 3000 }
  );
  
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId: selectedConversation! });
      utils.chat.listConversations.invalidate();
      utils.chat.getAdminUnreadCounts.invalidate();
      setNewMessage("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    }
  });
  
  const { data: users } = trpc.users.list.useQuery();
  
  const getUserName = (userId: number) => {
    const u = users?.find(u => u.id === userId);
    return u?.name || u?.email || `User #${userId}`;
  };

  // Invalidate unread counts when selecting a conversation (messages will be marked as read)
  useEffect(() => {
    if (selectedConversation && messages) {
      // Small delay to allow the backend to mark messages as read
      const timer = setTimeout(() => {
        utils.chat.getAdminUnreadCounts.invalidate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation, messages, utils.chat.getAdminUnreadCounts]);

  // Sort and filter conversations: unread first, then by lastMessageAt
  const sortedAndFilteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    // First filter by search query
    let filtered = conversations.filter((c: { userId: number }) => {
      if (!searchQuery) return true;
      const userName = getUserName(c.userId);
      return userName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Then sort: unread first, then by updatedAt
    return filtered.sort((a: { id: number; updatedAt: Date }, b: { id: number; updatedAt: Date }) => {
      const aUnread = unreadCounts?.[a.id] || 0;
      const bUnread = unreadCounts?.[b.id] || 0;
      
      // First sort by unread (conversations with unread messages first)
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      // Then sort by updatedAt (most recent first)
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });
  }, [conversations, unreadCounts, searchQuery, users]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim()
    });
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const selectedConv = conversations?.find((c: { id: number }) => c.id === selectedConversation);
  
  return (
    <AdminLayout>
      <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {/* Header - Hidden on mobile when chat is open */}
        <div className={`mb-4 flex-shrink-0 ${selectedConversation ? 'hidden md:block' : ''}`}>
          <h1 className="text-xl md:text-2xl font-bold">Support Chat</h1>
          <p className="text-sm text-muted-foreground">Manage customer conversations</p>
        </div>
        
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
          {/* Conversations List */}
          <Card 
            className={`
              w-full md:w-80 lg:w-96
              flex flex-col
              flex-shrink-0
              overflow-hidden
              ${selectedConversation ? 'hidden md:flex' : 'flex'}
            `}
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="skeleton h-16 rounded-lg" />
                    ))}
                  </div>
                ) : sortedAndFilteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sortedAndFilteredConversations.map((conv: { id: number; userId: number; lastMessageAt: Date | null; subject: string | null; status: string; updatedAt: Date }) => {
                      const unreadCount = unreadCounts?.[conv.id] || 0;
                      const hasUnread = unreadCount > 0;
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            selectedConversation === conv.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              {/* Red dot indicator for unread messages */}
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between">
                                <span className={`font-medium truncate ${hasUnread ? 'text-foreground font-semibold' : ''}`}>
                                  {getUserName(conv.userId)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.subject || "Support conversation"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(conv.updatedAt), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Chat Area */}
          <Card 
            className={`
              flex-1
              flex flex-col
              min-w-0
              overflow-hidden
              ${!selectedConversation ? 'hidden md:flex' : 'flex'}
            `}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden flex-shrink-0 -ml-2"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <CardTitle className="text-lg truncate">
                        {selectedConv ? getUserName(selectedConv.userId) : "Chat"}
                      </CardTitle>
                      <CardDescription className="truncate">Support conversation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {messagesLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton h-16 rounded-lg" />
                          ))}
                        </div>
                      ) : !messages || messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg: { id: number; senderRole: string; message: string; createdAt: Date }) => {
                            const isAdmin = msg.senderRole === "admin" || msg.senderRole === "agent";
                            return (
                              <div 
                                key={msg.id} 
                                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[75%] rounded-lg p-3 break-words ${
                                    isAdmin 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}
                                  style={{ 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
                                  }}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {format(new Date(msg.createdAt), "h:mm a")}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                
                {/* Message Input */}
                <div className="p-4 border-t flex-shrink-0 bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-w-0"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
