import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
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
  const { data: conversations, isLoading } = trpc.chat.listConversations.useQuery();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation, refetchInterval: 3000 }
  );
  
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId: selectedConversation! });
      utils.chat.listConversations.invalidate();
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
  
  const filteredConversations = conversations?.filter((c: { userId: number }) => {
    if (!searchQuery) return true;
    const userName = getUserName(c.userId);
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim()
    });
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const selectedConv = conversations?.find((c: { id: number }) => c.id === selectedConversation);
  
  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Support Chat</h1>
            <p className="text-muted-foreground">Manage customer conversations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-4rem)]">
          {/* Conversations List */}
          <Card className={`md:col-span-1 ${selectedConversation ? 'hidden md:block' : ''}`}>
            <CardHeader className="pb-3">
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
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="skeleton h-16 rounded-lg" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv: { id: number; userId: number; lastMessageAt: Date | null; subject: string | null; status: string; updatedAt: Date }) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversation === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">
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
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Chat Area */}
          <Card className={`md:col-span-2 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConv ? getUserName(selectedConv.userId) : "Chat"}
                      </CardTitle>
                      <CardDescription>Support conversation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-24rem)] p-4">
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
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  isAdmin 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
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
                  </ScrollArea>
                </CardContent>
                
                {/* Message Input */}
                <div className="p-4 border-t">
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
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
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
