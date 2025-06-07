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

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    enabled: !!authUser,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!authUser,
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
      if (!response.ok) throw new Error('Failed to add to cart');
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
      if (!response.ok) throw new Error('Failed to update quantity');
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
      if (!response.ok) throw new Error('Failed to remove from cart');
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
      if (!response.ok) throw new Error('Failed to send message');
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
      if (!response.ok) throw new Error('Failed to upload file');
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

  // Update online members when data changes
  useEffect(() => {
    if (onlineMembersData) {
      setOnlineMembers(onlineMembersData);
    }
  }, [onlineMembersData]);

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
    if (onlineMembers.length <= 1) {
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

  if (!authUser) {
    setLocation("/auth");
    return null;
  }

  const filteredProducts = (products as any[])?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const userGroups = (groups as any[]) || [];
  const selectedGroup = selectedGroupId ? userGroups.find((group: any) => group.id === selectedGroupId) : null;
  const cartItems = (groupCart as CartItem[]) || [];
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

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
                onClick={() => setLocation("/")}
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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                  3
                </Badge>
              </Button>
              
              {/* Video Call Toggle */}
              {selectedGroupId && (
                <Button
                  onClick={() => isVideoCallActive ? handleEndVideoCall() : handleStartVideoCall()}
                  disabled={!isVideoCallActive && onlineMembers.length <= 1}
                  className={`gap-2 ${isVideoCallActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : onlineMembers.length <= 1 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'}`}
                  size="sm"
                >
                  {isVideoCallActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  {isVideoCallActive ? 'End Call' : 
                   onlineMembers.length <= 1 ? 'Not enough members online' : 'Start Call'}
                </Button>
              )}

              {/* Group Cart Button - Prominent */}
              <Dialog open={isGroupCartOpen} onOpenChange={setIsGroupCartOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 relative shadow-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Group Cart
                    {cartItems.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs bg-orange-500 text-white rounded-full animate-pulse">
                        {cartItems.length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
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
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          if (item.quantity > 1) {
                                            updateCartQuantityMutation.mutate({
                                              cartItemId: item.id,
                                              quantity: item.quantity - 1
                                            });
                                          }
                                        }}
                                        disabled={item.quantity <= 1}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-sm px-2">{item.quantity}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                        onClick={() => updateCartQuantityMutation.mutate({
                                          cartItemId: item.id,
                                          quantity: item.quantity + 1
                                        })}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => removeFromCartMutation.mutate(item.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    {cartItems.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">₹{cartTotal}</span>
                        </div>
                        <Button className="w-full" size="sm">
                          Proceed to Group Checkout
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Avatar className="h-8 w-8 ring-2 ring-indigo-200 dark:ring-indigo-800">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {(authUser as any)?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
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
                  className={isMicOn ? "bg-green-100" : "bg-red-100"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={isCameraOn ? "bg-green-100" : "bg-red-100"}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndVideoCall}
                >
                  <Phone className="h-4 w-4" />
                  End Call
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg aspect-video flex items-center justify-center relative">
                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                    <VideoOff className="w-8 h-8 mb-2" />
                    <p className="text-sm text-center">Camera not available</p>
                    <p className="text-xs text-center opacity-75">You can still participate in the call</p>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1 text-white text-xs">
                  {(authUser as any)?.username || 'codestudio.solutions@gmail.com'}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Users className="w-8 h-8 mb-2" />
                  <p className="text-sm">Waiting for others to join</p>
                </div>
              </div>
            </div>
            
            {/* Call Info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Group Video Call Active</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {isCameraOn && isMicOn ? "Camera and microphone are on" : 
                 !isCameraOn && !isMicOn ? "Audio-only mode - camera and microphone are off" :
                 !isCameraOn ? "Audio-only mode - camera is off" : "Microphone is off"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Modern Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">

          {/* Groups Content - WhatsApp Style */}
          <div className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-[calc(100vh-200px)]">
              
              {/* Groups List - WhatsApp Style Sidebar */}
              <div className="lg:col-span-1 border-r bg-white dark:bg-gray-900 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">Shopping Groups</h2>
                    <div className="flex gap-2">
                      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-green-600" />
                              Create New Group
                            </DialogTitle>
                            <DialogDescription>
                              Create a new shopping group to collaborate with friends
                            </DialogDescription>
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
                                      <Input placeholder="Enter group name..." {...field} />
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
                                    <FormLabel>Group Description</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="What's this group about?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={createGroupMutation.isPending} className="w-full bg-green-500 hover:bg-green-600">
                                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="rounded-full w-8 h-8 p-0 border-green-300">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <UserPlus className="h-5 w-5 text-blue-600" />
                              Join Group
                            </DialogTitle>
                            <DialogDescription>
                              Enter a group code to join an existing shopping group
                            </DialogDescription>
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
                                      <Input placeholder="Enter group code..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={joinGroupMutation.isPending} className="w-full">
                                {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search groups..."
                      className="pl-10 bg-white dark:bg-gray-700 border-green-300 dark:border-green-700 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Groups List */}
                <ScrollArea className="flex-1">
                  <div className="divide-y">
                    {groupsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : userGroups.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm mb-2">No groups yet</p>
                        <p className="text-xs opacity-75">Create your first group!</p>
                      </div>
                    ) : (
                      userGroups.map((group: any) => (
                        <div
                          key={group.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedGroupId === group.id ? 'bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500' : ''
                          }`}
                          onClick={() => setSelectedGroupId(group.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Group Avatar */}
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {group.name.charAt(0).toUpperCase()}
                              </div>
                              {group.totalCart > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <ShoppingCart className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-sm leading-tight">{group.name}</h3>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  {group.creatorId === (authUser as any)?.id && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  )}
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(group.createdAt).toLocaleDateString('en-GB', { 
                                      day: '2-digit', 
                                      month: '2-digit',
                                      year: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 mr-2 leading-tight">
                                  {group.description || "Shopping together"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                  <Users className="w-3 h-3" />
                                  <span>{group.memberCount}</span>
                                </div>
                              </div>
                              
                              {/* Status and details row */}
                              <div className="flex items-center justify-between mt-2">
                                {group.totalCart > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      ₹{group.totalCart.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    No items in cart
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {group.roomCode && (
                                    <Badge variant="outline" className="text-xs font-mono px-1.5 py-0.5">
                                      {group.roomCode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 flex flex-col bg-gray-50 dark:bg-gray-900 relative">
                {/* Group Header - Only show when group is selected */}
                {selectedGroup && (
                  <div className="p-4 bg-white dark:bg-gray-800 border-b shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedGroup.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{selectedGroup.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedGroup.description || "Group Shopping"}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold text-blue-600">{selectedGroup.memberCount || 0}</span>
                                <span className="text-gray-600">members</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-500">Code:</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {selectedGroup.roomCode}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => isVideoCallActive ? handleEndVideoCall() : handleStartVideoCall()}
                            disabled={!isVideoCallActive && onlineMembers.length <= 1}
                            className={`gap-1 text-xs px-2 ${isVideoCallActive 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : onlineMembers.length <= 1 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-500 hover:bg-green-600'}`}
                          >
                            {isVideoCallActive ? <VideoOff className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {isVideoCallActive ? 'End' : onlineMembers.length <= 1 ? `${onlineMembers.length}` : 'Call'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsGroupCartOpen(true)}
                            className="gap-1 text-xs px-2 border-green-300"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            ({cartItems.length})
                          </Button>
                          
                          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1 text-xs px-2 border-green-300"
                              >
                                <UserPlus className="w-3 h-3" />
                                Invite
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-green-600" />
                                  Invite Members to {selectedGroup?.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Share the group code to invite friends to join your shopping group
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="text-sm text-gray-600">
                                  Share this group code with your friends to invite them:
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                  <code className="flex-1 text-lg font-mono font-bold text-green-600">
                                    {selectedGroup?.roomCode}
                                  </code>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const inviteCode = selectedGroup?.roomCode;
                                      if (inviteCode) {
                                        navigator.clipboard.writeText(inviteCode);
                                        toast({ title: "Code copied!", description: "Share this code with friends to invite them" });
                                      }
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {selectedGroup?.creatorId === (authUser as any)?.id ? (
                                <DropdownMenuItem 
                                  onClick={handleDeleteGroup}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Group
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={handleExitGroup}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Exit Group
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                )}

                {/* Products Section - Always visible */}
                <div className="flex-1 flex flex-col">
                      <div className="p-4 border-b bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-indigo-600" />
                          <h3 className="font-semibold">Browse Products</h3>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              Exclusive Products
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">VyronaSocial exclusive products with group discounts</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="gap-2"
                          >
                            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                            {viewMode === 'grid' ? 'List' : 'Grid'}
                          </Button>
                        </div>

                        {/* Products Grid */}
                        <ScrollArea className="flex-1">
                          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {productsLoading ? (
                              Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                  <div className="animate-pulse">
                                    <div className="aspect-square bg-gray-200"></div>
                                    <div className="p-4 space-y-2">
                                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                  </div>
                                </Card>
                              ))
                            ) : filteredProducts.length === 0 ? (
                              <div className="col-span-full text-center py-8">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-500">No products found</p>
                              </div>
                            ) : (
                              filteredProducts.map((product: any) => (
                                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                  <CardContent className="p-0">
                                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative">
                                      <Package className="w-12 h-12 text-gray-400" />
                                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                        VyronaSocial
                                      </Badge>
                                    </div>
                                    
                                    <div className="p-4 space-y-3">
                                      <div>
                                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                          {product.description}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-green-600">₹{product.price}</span>
                                          <span className="text-xs text-gray-500 line-through">₹{Math.floor(product.price * 1.2)}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          20% OFF
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Button 
                                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
                                          size="sm"
                                          disabled={addToGroupCartMutation.isPending}
                                          onClick={() => handleAddToGroupClick(product.id)}
                                        >
                                          <ShoppingBag className="w-4 h-4 mr-2" />
                                          {selectedGroup ? "Add to Group" : "Add to Group"}
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
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                {/* No Groups Message - Show below products when no group selected */}
                {!selectedGroup && (
                  <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 border-t">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Create or Join a Group</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start collaborating by creating a new group or joining an existing one
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setIsCreateGroupOpen(true)} className="gap-2 bg-green-500 hover:bg-green-600">
                        <Plus className="w-4 h-4" />
                        Create Group
                      </Button>
                      <Button onClick={() => setIsJoinGroupOpen(true)} variant="outline" className="gap-2 border-green-300">
                        <UserPlus className="w-4 h-4" />
                        Join Group
                      </Button>
                    </div>
                  </div>
                )}
              </div>



              {/* Fixed Chat Panel - Right Side */}
              <div className="lg:col-span-1 border-l bg-white dark:bg-gray-900 flex flex-col h-screen">
                {selectedGroup ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-green-50 dark:bg-green-900/20 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800 dark:text-green-200">Group Chat</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedGroup.name}
                      </p>
                    </div>

                    {/* Chat Section - 50% */}
                    <div className="flex flex-col border-b" style={{ height: '50%' }}>
                      {/* Chat Messages Area */}
                      <div className="flex-1 min-h-0">
                        <ScrollArea className="h-full p-4">
                          <div className="space-y-4">
                            {/* Test content to make scroller visible */}
                            {Array.from({length: 10}).map((_, i) => (
                              <div key={`test-${i}`} className="flex justify-start">
                                <div className="flex gap-2 max-w-[70%]">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                      T
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="inline-block p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border">
                                      Test message {i + 1} to demonstrate scrolling functionality
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.messageType === 'system'
                                    ? 'justify-center'
                                    : message.userId === (authUser as any)?.id
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                {message.messageType === 'system' ? (
                                  <div className="inline-block p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-800 dark:text-green-200 text-center">
                                    {message.content}
                                  </div>
                                ) : (
                                  <div className={`flex gap-2 max-w-[70%] ${
                                    message.userId === (authUser as any)?.id ? 'flex-row-reverse' : 'flex-row'
                                  }`}>
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarFallback className={`text-xs ${
                                        message.userId === (authUser as any)?.id 
                                          ? 'bg-green-100 text-green-600' 
                                          : 'bg-blue-100 text-blue-600'
                                      }`}>
                                        {message.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={`${
                                      message.userId === (authUser as any)?.id ? 'text-right' : 'text-left'
                                    }`}>
                                      <div className={`inline-block p-3 rounded-lg ${
                                        message.userId === (authUser as any)?.id
                                          ? 'bg-green-500 text-white rounded-br-sm'
                                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border'
                                      }`}>
                                        {message.content}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2"
                            onClick={() => {
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
                              fileInput.onchange = (event) => {
                                const file = (event.target as HTMLInputElement).files?.[0];
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
                              className="pr-12 border-green-300 focus:border-green-500"
                              disabled={sendMessageMutation.isPending}
                            />
                          </div>
                          
                          <Button 
                            onClick={handleSendMessage}
                            disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || uploadFileMutation.isPending}
                            className="rounded-full p-2 bg-green-500 hover:bg-green-600"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Participants Section - 50% */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden" style={{ height: '50%' }}>
                      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                        <Users className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Participants</h4>
                        <span className="text-xs text-gray-500">({onlineMembers.length} online)</span>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-y-auto">
                          <div className="space-y-2 pr-2">
                            {onlineMembers.length > 0 ? (
                              onlineMembers.map((member) => (
                                <div key={member.userId} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                      {member.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                      {member.username}
                                    </span>
                                    <span className="text-xs text-green-600">online</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <div className="text-xs text-gray-500 italic">No members online</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
          </div>
        </div>
      </div>

      {/* Video Call Overlay - Integrated with Product Browsing */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex">
          {/* Left Side - Participants */}
          <div className="w-1/3 bg-gray-900 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Video Call</h3>
              <div className="text-green-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {callParticipants.length} participant{callParticipants.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 space-y-3">
              {callParticipants.map((participant, index) => {
                const isCurrentUser = participant.userId === ((authUser as any)?.id || 1);
                return (
                  <div
                    key={participant.userId}
                    className="bg-gray-800 rounded-lg relative overflow-hidden aspect-video flex items-center justify-center"
                  >
                    {isCurrentUser && isCameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white p-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-medium mb-2">
                          {participant.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{participant.username}</span>
                      </div>
                    )}
                    
                    {/* Participant Controls */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                      <div className="bg-black/60 rounded px-2 py-1 text-white text-xs">
                        {isCurrentUser ? 'You' : participant.username}
                      </div>
                      {!isMicOn && isCurrentUser && (
                        <div className="bg-red-600 rounded-full p-1">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Call Controls */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMicOn 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isCameraOn 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndVideoCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Side - Collaborative Product Browsing */}
          <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Shopping Together
                </h3>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Browse exclusive products with your group
                </div>
              </div>
            </div>

            {/* Product Grid - Synchronized */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.slice(0, 6).map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
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
                    <CardContent className="p-4">
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

                      <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
                          size="sm"
                          disabled={!selectedGroupId || addToGroupCartMutation.isPending}
                          onClick={() => handleAddToGroupCart(product.id)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Group
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-3"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Call Actions */}
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Shopping with {callParticipants.length} member{callParticipants.length !== 1 ? 's' : ''}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsGroupCartOpen(true)}
                  className="gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View Group Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Invitation Dialog */}
      {videoCallInvite && (
        <Dialog open={true} onOpenChange={() => setVideoCallInvite(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-green-600" />
                Video Call Invitation
              </DialogTitle>
              <DialogDescription>
                {videoCallInvite.initiatorName} has started a video call in this group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Would you like to join the video call?
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinVideoCallInvite}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  disabled={joinVideoCallMutation.isPending}
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
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Group Selection Dialog */}
      <Dialog open={isGroupSelectionOpen} onOpenChange={setIsGroupSelectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Select Group
            </DialogTitle>
            <DialogDescription>
              Choose which group to add this product to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {userGroups?.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleSelectGroupForProduct(group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      Room Code: {group.roomCode}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Select
                </Button>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <Button
                onClick={() => {
                  setIsGroupSelectionOpen(false);
                  setIsCreateGroupOpen(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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