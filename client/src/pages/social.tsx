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
import { useAuthGuard } from "@/hooks/useAuthGuard";

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
  const { requireAuth } = useAuthGuard();
  
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

  const [videoCallInvite, setVideoCallInvite] = useState<any>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [callParticipants, setCallParticipants] = useState<any[]>([]);
  const [isGroupSelectionOpen, setIsGroupSelectionOpen] = useState(false);
  const [selectedProductForGroup, setSelectedProductForGroup] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Authentication check
  const { data: authUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Authentication check (no redirect, allow browsing)

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
  });

  // Fetch products (VyronaSocial specific - group buy enabled products only)
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/social/products"],
  });

  // Group cart data
  const { data: groupCart, refetch: refetchCart } = useQuery({
    queryKey: ["/api/room-cart", selectedGroupId],
    queryFn: () => fetch(`/api/room-cart/${selectedGroupId}`).then(res => res.json()),
    enabled: !!selectedGroupId,
  });

  // Fetch messages for selected group
  const { data: fetchedMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/group-messages", selectedGroupId],
    queryFn: () => fetch(`/api/group-messages/${selectedGroupId}`).then(res => res.json()),
    enabled: !!selectedGroupId,
  });

  // Fetch online members for selected group
  const { data: onlineMembersData, refetch: refetchOnlineMembers } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "online-members"],
    queryFn: () => fetch(`/api/groups/${selectedGroupId}/online-members`).then(res => res.json()),
    enabled: !!selectedGroupId,
    refetchInterval: 5000, // Refresh every 5 seconds
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

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await fetch("/api/shopping-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: (response) => {
      toast({ title: "Group created successfully!" });
      setIsCreateGroupOpen(false);
      createGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      
      // If there's a selected product, add it to the newly created group
      if (selectedProductForGroup && response?.room?.id) {
        setSelectedGroupId(response.room.id);
        // Small delay to ensure group selection is set
        setTimeout(() => {
          handleAddToGroupCart(selectedProductForGroup);
          setSelectedProductForGroup(null);
        }, 100);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (data: JoinGroupForm) => {
      const response = await fetch("/api/shopping-rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to join group');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Joined group successfully!" });
      setIsJoinGroupOpen(false);
      joinGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error joining group", description: error.message, variant: "destructive" });
    },
  });

  const addToGroupCartMutation = useMutation({
    mutationFn: async ({ productId, groupId }: { productId: number; groupId: number }) => {
      const response = await fetch("/api/room-cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, roomId: groupId, quantity: 1 }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add to cart');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Added to group cart!" });
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error adding to cart", description: error.message, variant: "destructive" });
    },
  });

  const updateCartQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const response = await fetch("/api/room-cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update quantity');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating quantity", description: error.message, variant: "destructive" });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await fetch("/api/room-cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to remove from cart');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Removed from cart" });
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error removing from cart", description: error.message, variant: "destructive" });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; groupId: number }) => {
      const response = await fetch("/api/group-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          groupId: data.groupId,
          messageType: 'text'
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear the input field - message will be added via WebSocket broadcast
      setNewMessage("");
      toast({ title: "Message sent!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, groupId }: { file: File; groupId: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId.toString());
      formData.append('messageType', 'file');
      
      const response = await fetch("/api/group-messages/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload file');
      }
      return response.json();
    },
    onSuccess: () => {
      setSelectedFile(null);
      toast({ title: "File sent successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send file", description: error.message, variant: "destructive" });
    },
  });

  // Video call mutations
  const startVideoCallMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}/start-video-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Failed to start video call');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentCallId(data.callId);
      setIsVideoCallActive(true);
      // Add current user as first participant
      setCallParticipants([{
        userId: (authUser as any)?.id || 1,
        username: (authUser as any)?.username || 'You',
        joinedAt: new Date()
      }]);
      toast({ title: "Video call started", description: "Invitations sent to online members" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start video call", description: error.message, variant: "destructive" });
    },
  });

  const joinVideoCallMutation = useMutation({
    mutationFn: async ({ groupId, callId }: { groupId: number; callId: string }) => {
      const response = await fetch(`/api/groups/${groupId}/join-video-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId })
      });
      if (!response.ok) throw new Error('Failed to join video call');
      return response.json();
    },
    onSuccess: () => {
      setIsVideoCallActive(true);
      setVideoCallInvite(null);
      // Add current user to participants if not already there
      setCallParticipants(prev => {
        const currentUserId = (authUser as any)?.id || 1;
        const userExists = prev.some(p => p.userId === currentUserId);
        if (!userExists) {
          return [...prev, {
            userId: currentUserId,
            username: (authUser as any)?.username || 'You',
            joinedAt: new Date()
          }];
        }
        return prev;
      });
      toast({ title: "Joined video call successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to join video call", description: error.message, variant: "destructive" });
    },
  });

  const endVideoCallMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}/end-video-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Failed to end video call');
      return response.json();
    },
    onSuccess: () => {
      setIsVideoCallActive(false);
      setCurrentCallId(null);
      toast({ title: "Video call ended" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to end video call", description: error.message, variant: "destructive" });
    },
  });

  // WebSocket connection management
  useEffect(() => {
    if (!authUser || !selectedGroupId) {
      // Clean up existing connection if no user or group
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Prevent multiple connections
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
          reconnectAttempts = 0; // Reset on successful connection
          
          // Register as online user
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'user-online',
              userId: (authUser as any).id || 1,
              username: (authUser as any).username || 'User',
              groupId: selectedGroupId
            }));
          }
          
          // Start heartbeat to keep connection alive
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
          }, 30000); // Send ping every 30 seconds
          
          // Store interval reference for cleanup
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
            
            if (data.type === 'user-status-changed') {
              refetchOnlineMembers().catch(err => console.error('Failed to refetch online members:', err));
            }
            
            if (data.type === 'new-message') {
              // Add new message to the messages list in real-time
              setMessages(prev => [...prev, data.message]);
              // Scroll to bottom to show new message
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
            
            if (data.type === 'cart-update') {
              // Refresh cart when other group members add/remove items
              if (data.roomId === selectedGroupId) {
                refetchCart();
                toast({
                  title: "Cart updated",
                  description: "A group member added an item to the cart",
                });
              }
            }
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected');
          // Clear heartbeat interval when connection closes
          if ((ws as any).heartbeatInterval) {
            clearInterval((ws as any).heartbeatInterval);
          }
          
          // Attempt to reconnect if it wasn't a manual close
          if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(() => {
              if (authUser && selectedGroupId) {
                createConnection();
              }
            }, reconnectDelay * reconnectAttempts);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't attempt reconnection on error, let onclose handle it
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => {
            if (authUser && selectedGroupId) {
              createConnection();
            }
          }, reconnectDelay * reconnectAttempts);
        }
      }
    };

    // Create initial connection
    createConnection();

    return () => {
      // Clean up connection and intervals
      if (wsRef.current) {
        if ((wsRef.current as any).heartbeatInterval) {
          clearInterval((wsRef.current as any).heartbeatInterval);
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [authUser, selectedGroupId]);



  // Auto-select first group when groups load
  useEffect(() => {
    if (groups && Array.isArray(groups) && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups]);

  // Reset selectedGroupId when groups list changes or selected group no longer exists
  useEffect(() => {
    if (groups && Array.isArray(groups)) {
      // If no groups exist, reset selectedGroupId
      if (groups.length === 0 && selectedGroupId !== null) {
        setSelectedGroupId(null);
      }
      // If selectedGroupId is set but the group doesn't exist in the list, reset it
      else if (selectedGroupId && !groups.find(g => g.id === selectedGroupId)) {
        setSelectedGroupId(null);
      }
    }
  }, [groups]);

  // Video call functions
  const handleStartVideoCall = async () => {
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }

    // Check online members count
    if (deduplicatedOnlineMembers.length <= 1) {
      toast({ 
        title: "Not enough online members", 
        description: "At least 2 members must be online to start a video call",
        variant: "destructive" 
      });
      return;
    }
    
    try {
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ 
          title: "Camera/Microphone not supported", 
          description: "Your browser doesn't support video calls. Try using Chrome, Firefox, or Safari.",
          variant: "destructive" 
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setIsMicOn(true);
      
      // Start the video call via API
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
      
      // Still start the call without media for chat purposes
      setIsCameraOn(false);
      setIsMicOn(false);
      startVideoCallMutation.mutate(selectedGroupId);
    }
  };

  const handleJoinVideoCallInvite = async () => {
    if (!videoCallInvite || !selectedGroupId) return;

    try {
      // Try to get media access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setIsMicOn(true);
      }
    } catch (error) {
      // Continue without media
      setIsCameraOn(false);
      setIsMicOn(false);
    }

    // Join the call via API
    joinVideoCallMutation.mutate({
      groupId: selectedGroupId,
      callId: videoCallInvite.callId
    });
  };

  const handleEndVideoCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoCallActive(false);
    setIsCameraOn(false);
    setIsMicOn(false);
    toast({ title: "Left video call" });
  };

  const handleAddToGroupCart = (productId: number) => {
    if (!requireAuth("add items to group cart")) return;
    
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }
    addToGroupCartMutation.mutate({ productId, groupId: selectedGroupId });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaSocial...</p>
        </div>
      </div>
    );
  }

  // Remove authentication requirement for browsing - users can view products without login

  const filteredProducts = (products as any[])?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Deduplicate groups by ID to prevent React key conflicts - only for authenticated users
  const userGroups = React.useMemo(() => {
    if (!groups || !authUser) return [];
    const seen = new Set();
    return (groups as any[]).filter((group: any) => {
      if (seen.has(group.id)) {
        return false;
      }
      seen.add(group.id);
      return true;
    });
  }, [groups, authUser]);
  
  const selectedGroup = selectedGroupId && authUser ? userGroups.find((group: any) => group.id === selectedGroupId) : null;
  const cartItems = authUser ? ((groupCart as CartItem[]) || []) : [];
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Deduplicate online members to prevent React key conflicts
  const deduplicatedOnlineMembers = React.useMemo(() => {
    if (!onlineMembersData) return [];
    const seen = new Set();
    return onlineMembersData.filter((member: any) => {
      const key = `${member.userId}-${member.username}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [onlineMembersData]);

  // Send message function
  const handleSendMessage = () => {
    if (!selectedGroupId) return;
    
    // If there's a selected file, upload it
    if (selectedFile) {
      uploadFileMutation.mutate({
        file: selectedFile,
        groupId: selectedGroupId
      });
      return;
    }
    
    // If there's a text message, send it
    if (newMessage.trim()) {
      sendMessageMutation.mutate({
        content: newMessage.trim(),
        groupId: selectedGroupId
      });
    }
  };

  // Handle enter key in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize messages from API when group is selected
  React.useEffect(() => {
    if (selectedGroupId && fetchedMessages) {
      setMessages(fetchedMessages);
      // Scroll to bottom when messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedGroupId, fetchedMessages]);

  // Clear messages when switching groups or deselecting
  React.useEffect(() => {
    setMessages([]);
    setNewMessage("");
  }, [selectedGroupId]);

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/social/groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete group");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Group deleted",
        description: "The group has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      setSelectedGroupId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  // Exit group mutation
  const exitGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/social/groups/${groupId}/exit`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to exit group");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exited group",
        description: "You have successfully left the group",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      setSelectedGroupId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to exit group",
        variant: "destructive",
      });
    },
  });

  // Handle delete group
  const handleDeleteGroup = () => {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.id);
    }
  };

  // Handle exit group
  const handleExitGroup = () => {
    if (selectedGroup) {
      exitGroupMutation.mutate(selectedGroup.id);
    }
  };

  // Handle add to group button click
  const handleAddToGroupClick = (productId: number) => {
    setSelectedProductForGroup(productId);
    
    // If there are existing groups, show selection dialog
    if (userGroups && userGroups.length > 0) {
      setIsGroupSelectionOpen(true);
    } else {
      // No groups exist, open create group modal
      setIsCreateGroupOpen(true);
    }
  };

  // Handle group selection for adding product
  const handleSelectGroupForProduct = (groupId: number) => {
    if (selectedProductForGroup) {
      setSelectedGroupId(groupId);
      handleAddToGroupCart(selectedProductForGroup);
      setIsGroupSelectionOpen(false);
      setSelectedProductForGroup(null);
    }
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
                onClick={() => setLocation("/home")}
                className="flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    VyronaSocial
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Group Shopping Experience</p>
                </div>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exclusive products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Right side - Actions and Group Cart */}
            <div className="flex items-center gap-4">
              {authUser ? (
                <>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Wishlist</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full">
                      3
                    </Badge>
                  </Button>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2 shadow-lg hover:shadow-xl transition-all">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Group Cart</span>
                    {cartItems.length > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        {cartItems.length}
                      </Badge>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => requireAuth("access VyronaSocial features")}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2"
                >
                  <Users className="h-4 w-4" />
                  Login to Join Groups
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Groups (Only for authenticated users) */}
            {authUser ? (
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-white text-lg">Your Groups</h2>
                      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => requireAuth("create a group")}
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            New Group
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Group</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input placeholder="Group name" />
                            <Input placeholder="Description" />
                            <Button className="w-full">Create Group</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Main Product Grid */}
            <div className={`${authUser ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <div className="space-y-6">
                {/* Products Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Shopping Products</h2>
                  {!authUser && (
                    <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <p className="text-sm text-indigo-700 mb-2">Join groups to shop together and save more!</p>
                      <Button 
                        onClick={() => requireAuth("join groups")}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      >
                        Login to Start Group Shopping
                      </Button>
                    </div>
                  )}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product: any) => (
                    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                      <div className="relative overflow-hidden rounded-t-xl">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <Package className="w-16 h-16 text-indigo-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/90 hover:bg-white shadow-lg"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {product.description || "Premium quality product for social shopping"}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-indigo-600">
                                ₹{product.price?.toLocaleString() || '0'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Best with groups
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button
                                onClick={() => handleAddToGroupCart(product.id)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2"
                                size="sm"
                              >
                                <Users className="h-4 w-4" />
                                Add to Group
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or check back later for new products.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Cart Dialog - For authenticated users only */}
      {authUser && (
        <Dialog open={isGroupCartOpen} onOpenChange={setIsGroupCartOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Group Cart {selectedGroup && `- ${selectedGroup.name}`}
              </DialogTitle>
              <DialogDescription>
                View and manage items in your group shopping cart
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cart is empty</p>
                      <p className="text-xs opacity-75">Add products to start shopping!</p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">₹{item.price}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <Button size="sm" variant="destructive">Remove</Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {cartItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                    Proceed to Group Checkout
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
