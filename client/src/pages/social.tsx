import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  ShoppingCart,
  ArrowLeft,
  ShoppingBag,
  Search,
  Package,
  Crown,
  UserPlus,
  Trash2,
  Minus,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Heart,
  Filter,
  LogOut,
  Grid3X3,
  List,
  Bell,
  Sparkles,
  Send,
  Smile,
  Paperclip,
  Copy,
  MoreVertical,
  MessageCircle,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Form schemas
const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const joinGroupSchema = z.object({
  code: z.string().min(6, "Group code must be at least 6 characters"),
});

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;
type JoinGroupForm = z.infer<typeof joinGroupSchema>;
type MessageForm = z.infer<typeof messageSchema>;

// Chat message interface
interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  username: string;
  groupId: number;
  messageType: 'text' | 'system' | 'product_share' | 'cart_update' | 'file';
  metadata?: any;
  sentAt: string;
}

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  userId: number;
  roomId: number | null;
  addedAt: Date | null;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string;
}

export default function VyronaSocial() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State Management
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGroupCartOpen, setIsGroupCartOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("groups");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
  const [videoCallInvite, setVideoCallInvite] = useState<any>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [callParticipants, setCallParticipants] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Queries
  const { data: authUser } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    enabled: !!authUser,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: groupCart = [] } = useQuery({
    queryKey: ['/api/group-cart', selectedGroupId],
    enabled: !!selectedGroupId,
  });

  // Get selected group
  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);

  // Filter products based on search
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupForm) => apiRequest('/api/groups', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setIsCreateGroupOpen(false);
      toast({ title: "Group created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create group", description: error.message, variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (data: JoinGroupForm) => apiRequest('/api/groups/join', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setIsJoinGroupOpen(false);
      toast({ title: "Joined group successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to join group", description: error.message, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; groupId: number; messageType?: string; metadata?: any }) => 
      apiRequest('/api/groups/messages', { method: 'POST', body: data }),
    onSuccess: () => {
      setNewMessage("");
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const addToGroupCartMutation = useMutation({
    mutationFn: (data: { productId: number; groupId: number; quantity?: number }) => 
      apiRequest('/api/group-cart', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-cart', selectedGroupId] });
      toast({ title: "Added to group cart!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add to cart", description: error.message, variant: "destructive" });
    },
  });

  const startVideoCallMutation = useMutation({
    mutationFn: (groupId: number) => apiRequest('/api/video-call/start', { method: 'POST', body: { groupId } }),
    onSuccess: (data) => {
      setIsVideoCallActive(true);
      setCurrentCallId(data.callId);
      toast({ title: "Video call started!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start video call", description: error.message, variant: "destructive" });
    },
  });

  const joinVideoCallMutation = useMutation({
    mutationFn: (data: { groupId: number; callId: string }) => 
      apiRequest('/api/video-call/join', { method: 'POST', body: data }),
    onSuccess: () => {
      setIsVideoCallActive(true);
      setVideoCallInvite(null);
      toast({ title: "Joined video call!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to join video call", description: error.message, variant: "destructive" });
    },
  });

  const endVideoCallMutation = useMutation({
    mutationFn: (groupId: number) => apiRequest('/api/video-call/end', { method: 'POST', body: { groupId } }),
    onSuccess: () => {
      setIsVideoCallActive(false);
      setCurrentCallId(null);
      setCallParticipants([]);
      toast({ title: "Video call ended" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to end video call", description: error.message, variant: "destructive" });
    },
  });

  // Forms
  const createGroupForm = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const joinGroupForm = useForm<JoinGroupForm>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { code: "" },
  });

  // Handlers
  const handleSendMessage = () => {
    if (!selectedGroupId || (!newMessage.trim() && !selectedFile)) return;

    if (selectedFile) {
      // Handle file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('groupId', selectedGroupId.toString());
      formData.append('messageType', 'file');
      
      // Use file upload mutation here
      toast({ title: "File upload not implemented yet" });
      return;
    }

    sendMessageMutation.mutate({
      content: newMessage,
      groupId: selectedGroupId,
      messageType: 'text'
    });
  };

  const handleAddToGroupCart = (productId: number) => {
    if (!selectedGroupId) return;
    addToGroupCartMutation.mutate({ productId, groupId: selectedGroupId });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartVideoCall = async () => {
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }

    if (onlineMembers.length <= 1) {
      toast({ 
        title: "Not enough online members", 
        description: "At least 2 members must be online to start a video call",
        variant: "destructive" 
      });
      return;
    }
    
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setIsMicOn(true);
      }
      
      startVideoCallMutation.mutate(selectedGroupId);
      
    } catch (error: any) {
      toast({ 
        title: "Camera/Microphone access denied", 
        description: "Please allow camera and microphone access in your browser settings.",
        variant: "destructive" 
      });
      
      setIsCameraOn(false);
      setIsMicOn(false);
      startVideoCallMutation.mutate(selectedGroupId);
    }
  };

  const handleJoinVideoCallInvite = async () => {
    if (!videoCallInvite || !selectedGroupId) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setIsMicOn(true);
      }
    } catch (error) {
      setIsCameraOn(false);
      setIsMicOn(false);
    }

    joinVideoCallMutation.mutate({
      groupId: selectedGroupId,
      callId: videoCallInvite.callId
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20">
      {/* Modern Header with Group Cart */}
      <div className="border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and Logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Vyrona Social
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shop together, chat together</p>
                </div>
              </div>
            </div>

            {/* Center - Group Cart */}
            {selectedGroup && (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGroupCartOpen(true)}
                  className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Group Cart ({groupCart.length})
                </Button>
                
                {onlineMembers.length > 1 && (
                  <Button
                    onClick={handleStartVideoCall}
                    disabled={isVideoCallActive || startVideoCallMutation.isPending}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {startVideoCallMutation.isPending ? "Starting..." : "Start Video Call"}
                  </Button>
                )}
              </div>
            )}

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-3">
              {authUser && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                      {((authUser as any).username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{(authUser as any).username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{(authUser as any).email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="social">Social Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-6">
            {/* Groups Management */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Shopping Groups</h2>
                <p className="text-gray-600 dark:text-gray-400">Create or join groups to shop together</p>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                      <DialogDescription>Start a new shopping group and invite friends</DialogDescription>
                    </DialogHeader>
                    <Form {...createGroupForm}>
                      <form onSubmit={createGroupForm.handleSubmit((data) => createGroupMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={createGroupForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter group name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createGroupForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="What's this group about?" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createGroupMutation.isPending}>
                          {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join Group</DialogTitle>
                      <DialogDescription>Enter the group code to join</DialogDescription>
                    </DialogHeader>
                    <Form {...joinGroupForm}>
                      <form onSubmit={joinGroupForm.handleSubmit((data) => joinGroupMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={joinGroupForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter group code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={joinGroupMutation.isPending}>
                          {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any) => (
                <Card key={group.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-indigo-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {group.memberCount || 1} members
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{group.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Code: {group.roomCode}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setActiveTab("social");
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                      >
                        Join Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first group to start shopping together</p>
                <Button onClick={() => setIsCreateGroupOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
              {/* Groups Sidebar */}
              <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Your Groups</h3>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {groups.map((group: any) => (
                      <Button
                        key={group.id}
                        variant={selectedGroupId === group.id ? "default" : "ghost"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{group.name}</div>
                            <div className="text-xs text-gray-500 truncate">{group.memberCount || 1} members</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border flex flex-col">
                {selectedGroup ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedGroup.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedGroup.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {onlineMembers.length > 1 && !isVideoCallActive && (
                          <Button
                            size="sm"
                            onClick={handleStartVideoCall}
                            disabled={startVideoCallMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Start Call
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length > 0 ? (
                          messages.map((message) => (
                            <div key={message.id} className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                                  {message.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{message.username}</span>
                                  <span className="text-xs text-gray-500">{new Date(message.sentAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">{message.content}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <div className="text-sm text-gray-500">No messages yet. Start the conversation!</div>
                          </div>
                        )}
                      </div>
                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*,video/*,.pdf,.doc,.docx';
                            fileInput.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                toast({
                                  title: "File Selected",
                                  description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
                                });
                              }
                            };
                            fileInput.click();
                          }}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pr-12"
                            disabled={sendMessageMutation.isPending}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending}
                          className="rounded-full p-2"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Online Members */}
                    {onlineMembers.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Online ({onlineMembers.length})</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {onlineMembers.map((member) => (
                            <div key={member.userId} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-green-100 text-green-600">
                                  {member.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a Group</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Choose a group to start chatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Call Overlay */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Group Video Call - {selectedGroup?.name}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={isMicOn ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={isCameraOn ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => endVideoCallMutation.mutate(selectedGroupId!)}
                  disabled={endVideoCallMutation.isPending}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video flex items-center justify-center">
                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-xl font-medium mb-2">
                      {((authUser as any)?.username || 'You').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">You</span>
                  </div>
                )}
              </div>
              
              {callParticipants.filter(p => p.userId !== ((authUser as any)?.id || 1)).slice(0, 3).map((participant) => (
                <div
                  key={participant.userId}
                  className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video flex items-center justify-center"
                >
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-xl font-medium mb-2">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{participant.username}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {callParticipants.length} participant{callParticipants.length !== 1 ? 's' : ''} in call
            </div>
          </div>
        </div>
      )}

      {/* Video Call Invitation Dialog */}
      {videoCallInvite && (
        <Dialog open={!!videoCallInvite} onOpenChange={() => setVideoCallInvite(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Video Call Invitation</DialogTitle>
              <DialogDescription>
                {videoCallInvite.initiatorName} started a video call in {videoCallInvite.groupName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleJoinVideoCallInvite}
                disabled={joinVideoCallMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Video className="w-4 h-4 mr-2" />
                {joinVideoCallMutation.isPending ? "Joining..." : "Join Call"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setVideoCallInvite(null)}
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Online Members Indicator */}
      {selectedGroupId && onlineMembers.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-300">
              {onlineMembers.length} member{onlineMembers.length !== 1 ? 's' : ''} online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}