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
  Share2,
  Settings,
  X,
  ChevronDown,
  Star,
  Zap,
  Camera,
  Image,
  FileText,
  Download,
  Eye,
  ShoppingCartIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Bookmark,
  Tag,
  TrendingUp,
  Gift,
  Percent
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
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: authUser } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/shopping-rooms'],
    enabled: !!authUser,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: groupCart = [] } = useQuery({
    queryKey: ['/api/group-cart', selectedGroupId],
    enabled: !!selectedGroupId,
  });

  const { data: groupMessages = [] } = useQuery({
    queryKey: ['/api/groups/messages', selectedGroupId],
    enabled: !!selectedGroupId,
    refetchInterval: 2000,
  });

  // Get selected group
  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);

  // Filter products based on search and category
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default: // featured
        return 0;
    }
  });

  // Get unique categories
  const categories = ['all', ...new Set(products.map((p: any) => p.category).filter(Boolean))];

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupForm) => apiRequest('/api/shopping-rooms', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-rooms'] });
      setIsCreateGroupOpen(false);
      toast({ title: "Group created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create group", description: error.message, variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (data: JoinGroupForm) => apiRequest('/api/shopping-rooms/join', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-rooms'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/groups/messages', selectedGroupId] });
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
      
      // Send cart update message
      if (selectedGroupId) {
        sendMessageMutation.mutate({
          content: "Added item to group cart",
          groupId: selectedGroupId,
          messageType: 'cart_update'
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to add to cart", description: error.message, variant: "destructive" });
    },
  });

  const shareProductMutation = useMutation({
    mutationFn: (data: { productId: number; groupId: number }) => 
      apiRequest('/api/share-product', { method: 'POST', body: data }),
    onSuccess: (data) => {
      toast({ title: "Product shared with group!" });
      
      // Send product share message
      if (selectedGroupId) {
        sendMessageMutation.mutate({
          content: `Shared: ${data.productName}`,
          groupId: selectedGroupId,
          messageType: 'product_share',
          metadata: { productId: data.productId }
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to share product", description: error.message, variant: "destructive" });
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

  const uploadFileMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest('/api/upload/file', { method: 'POST', body: formData }),
    onSuccess: (data) => {
      if (selectedGroupId) {
        sendMessageMutation.mutate({
          content: data.fileName,
          groupId: selectedGroupId,
          messageType: 'file',
          metadata: { fileUrl: data.fileUrl, fileType: data.fileType }
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to upload file", description: error.message, variant: "destructive" });
    },
  });

  const exitGroupMutation = useMutation({
    mutationFn: (groupId: number) => apiRequest(`/api/shopping-rooms/${groupId}/leave`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-rooms'] });
      setSelectedGroupId(null);
      toast({ title: "Left group successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to leave group", description: error.message, variant: "destructive" });
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

  // Update messages when groupMessages changes
  useEffect(() => {
    if (groupMessages) {
      setMessages(groupMessages);
    }
  }, [groupMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select first group if available
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      const firstGroup = groups.find((g: any) => g.id);
      if (firstGroup) {
        setSelectedGroupId(firstGroup.id);
      }
    } else if (selectedGroupId && !groups.find((g: any) => g.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [groups, selectedGroupId]);

  // WebSocket connection management
  useEffect(() => {
    if (!authUser || !selectedGroupId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 1000;

    const createConnection = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'user-online',
              userId: (authUser as any).id || 1,
              username: (authUser as any).username || 'User',
              groupId: selectedGroupId
            }));
          }
          
          const heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'ping',
                userId: (authUser as any).id || 1,
                groupId: selectedGroupId
              }));
            } else {
              clearInterval(heartbeatInterval);
            }
          }, 30000);
          
          (ws as any).heartbeatInterval = heartbeatInterval;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'video-call-invite') {
              setVideoCallInvite(data);
              toast({
                title: "Video call invitation",
                description: `${data.initiatorName} started a video call`,
              });
            }
            
            if (data.type === 'user-joined-call') {
              setCallParticipants(prev => [...prev, { 
                userId: data.userId, 
                username: data.username,
                joinedAt: new Date()
              }]);
              toast({
                title: "User joined call",
                description: `${data.username} joined the video call`,
              });
            }
            
            if (data.type === 'call-participants-updated') {
              setCallParticipants(data.participants);
              if (data.newJoiner) {
                toast({
                  title: "User joined call",
                  description: `${data.newJoiner.username} joined the video call`,
                });
              }
            }
            
            if (data.type === 'video-call-ended') {
              setIsVideoCallActive(false);
              setCurrentCallId(null);
              setVideoCallInvite(null);
              setCallParticipants([]);
              toast({
                title: "Video call ended",
                description: "The video call has been ended",
              });
            }
            
            if (data.type === 'online-users-updated') {
              setOnlineMembers(data.users.filter((user: any) => user.groupId === selectedGroupId));
            }
            
            if (data.type === 'new-message') {
              queryClient.invalidateQueries({ queryKey: ['/api/groups/messages', selectedGroupId] });
            }
            
            if (data.type === 'cart-updated') {
              queryClient.invalidateQueries({ queryKey: ['/api/group-cart', selectedGroupId] });
            }
            
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if ((ws as any).heartbeatInterval) {
            clearInterval((ws as any).heartbeatInterval);
          }
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(createConnection, reconnectDelay * reconnectAttempts);
          }
        };

        ws.onerror = (error) => {
          console.log('WebSocket error:', error);
        };

      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    createConnection();

    return () => {
      if (wsRef.current) {
        if ((wsRef.current as any).heartbeatInterval) {
          clearInterval((wsRef.current as any).heartbeatInterval);
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [authUser, selectedGroupId, queryClient]);

  // Handlers
  const handleSendMessage = () => {
    if (!selectedGroupId || (!newMessage.trim() && !selectedFile)) return;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('groupId', selectedGroupId.toString());
      formData.append('messageType', 'file');
      
      uploadFileMutation.mutate(formData);
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

  const handleShareProduct = (productId: number) => {
    if (!selectedGroupId) return;
    shareProductMutation.mutate({ productId, groupId: selectedGroupId });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      });
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
      let errorMessage = "Unable to access camera/microphone";
      let description = "";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera/Microphone access denied";
        description = "Please allow camera and microphone access in your browser settings and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera/microphone found";
        description = "Make sure your camera and microphone are connected and try again.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Video calls not supported";
        description = "Your browser or device doesn't support video calls. Try using HTTPS or a different browser.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera/Microphone in use";
        description = "Your camera or microphone is being used by another application.";
      }
      
      toast({ 
        title: errorMessage, 
        description: description,
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

  const handleEndVideoCall = () => {
    if (!selectedGroupId) return;
    endVideoCallMutation.mutate(selectedGroupId);
  };

  const handleExitGroup = () => {
    if (selectedGroup) {
      exitGroupMutation.mutate(selectedGroup.id);
    }
  };

  const toggleShoppingMode = () => {
    setIsShoppingMode(!isShoppingMode);
    console.log('Calling onTabChange with:', isShoppingMode ? 'social' : 'space');
    console.log('Tab clicked:', isShoppingMode ? 'social' : 'space');
    console.log('onTabChange called');
  };

  const handleTabChange = (value: string) => {
    console.log('Calling onTabChange with:', value);
    console.log('Tab clicked:', value);
    console.log('onTabChange called');
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />

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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="social">Social Chat</TabsTrigger>
            <TabsTrigger value="space">Shopping Space</TabsTrigger>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setIsInviteDialogOpen(true)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Invite Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExitGroup}>
                              <LogOut className="w-4 h-4 mr-2" />
                              Leave Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                                  {message.messageType !== 'text' && (
                                    <Badge variant="outline" className="text-xs">
                                      {message.messageType === 'cart_update' && 'Cart Update'}
                                      {message.messageType === 'product_share' && 'Product Share'}
                                      {message.messageType === 'file' && 'File'}
                                      {message.messageType === 'system' && 'System'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {message.messageType === 'file' ? (
                                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                      <span>{message.content}</span>
                                      {message.metadata?.fileUrl && (
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={message.metadata.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4" />
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    message.content
                                  )}
                                </div>
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
                          onClick={handleFileSelect}
                          disabled={uploadFileMutation.isPending}
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
                          {selectedFile && (
                            <div className="absolute -top-10 left-0 right-0 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                              📎 {selectedFile.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-auto p-0 text-blue-700"
                                onClick={() => setSelectedFile(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || uploadFileMutation.isPending}
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

          <TabsContent value="space" className="space-y-6">
            {/* Shopping Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                    <option value="newest">Newest First</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Grid/List */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {sortedProducts.map((product: any) => (
                <Card key={product.id} className={`group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-300 ${
                  viewMode === 'list' ? 'flex flex-row items-center' : ''
                }`}>
                  <div className={`${
                    viewMode === 'list' 
                      ? 'w-32 h-32 flex-shrink-0' 
                      : 'aspect-video'
                  } relative overflow-hidden ${viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'} bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900`}>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-gray-800 shadow-sm">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Exclusive
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className={`${viewMode === 'list' ? 'flex-1' : ''} p-4`}>
                    <div className={viewMode === 'list' ? 'flex justify-between items-start' : ''}>
                      <div className={viewMode === 'list' ? 'flex-1 mr-4' : ''}>
                        <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-indigo-600">₹{product.price}</span>
                            <span className="text-sm text-gray-500 line-through">₹{Math.floor(product.price * 1.2)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            20% OFF
                          </Badge>
                        </div>
                      </div>

                      <div className={`flex ${viewMode === 'list' ? 'flex-col' : ''} items-center gap-2`}>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
                          size="sm"
                          disabled={!selectedGroupId || addToGroupCartMutation.isPending}
                          onClick={() => handleAddToGroupCart(product.id)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          {viewMode === 'list' ? 'Add' : 'Add to Group'}
                        </Button>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-3"
                            disabled={!selectedGroupId || shareProductMutation.isPending}
                            onClick={() => handleShareProduct(product.id)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-3"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or filters</p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory('all');
                  setSortBy('featured');
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
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
                  onClick={handleEndVideoCall}
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

      {/* Group Cart Dialog */}
      {isGroupCartOpen && (
        <Dialog open={isGroupCartOpen} onOpenChange={setIsGroupCartOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Group Cart - {selectedGroup?.name}</DialogTitle>
              <DialogDescription>
                Items added by group members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {groupCart.length > 0 ? (
                groupCart.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
                      <p className="text-xs text-gray-500">Added by {item.username || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{item.price * item.quantity}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-500">No items in group cart yet</div>
                </div>
              )}
            </div>
            {groupCart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total: ₹{groupCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)}</span>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Dialog */}
      {isInviteDialogOpen && (
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Members</DialogTitle>
              <DialogDescription>
                Share this code with friends to join {selectedGroup?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-2xl font-mono font-bold mb-2">{selectedGroup?.roomCode}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGroup?.roomCode || '');
                    toast({ title: "Code copied to clipboard!" });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Share this code with friends so they can join your shopping group and chat together.
              </div>
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