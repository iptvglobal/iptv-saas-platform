import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  MessageCircle, 
  Send, 
  Plus,
  User,
  Shield
} from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: conversations, isLoading: conversationsLoading } = trpc.chat.myConversations.useQuery();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId, refetchInterval: 3000 }
  );
  
  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      utils.chat.myConversations.invalidate();
      if (data.id) {
        setSelectedConversationId(data.id);
      }
    }
  });
  
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId: selectedConversationId! });
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
  
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  
  return (
    <UserLayout>
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
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
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedConversationId === conv.id 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <MessageCircle className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {conv.subject || `Conversation #${conv.id}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {conv.lastMessageAt 
                                ? format(new Date(conv.lastMessageAt), "MMM d, h:mm a")
                                : "No messages yet"
                              }
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <MessageCircle className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {selectedConversation?.subject || `Conversation #${selectedConversationId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Support Team
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="skeleton h-16 rounded-lg" />
                        ))}
                      </div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
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
                              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className={isStaff ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                  {isStaff ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                <div
                                  className={`inline-block p-3 rounded-lg ${
                                    isOwn 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
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
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        className="gradient-primary"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
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
