'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    MessageSquare,
    Send,
    ArrowLeft,
    User,
    Users,
    Clock,
    Check,
    CheckCheck,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
    useParentPortalMessages, 
    useParentMessage, 
    useSendParentPortalMessage,
    useMarkParentMessageAsRead,
    ParentPortalMessage 
} from '@/hooks/use-parent-portal';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'parent' | 'teacher' | 'admin';
    content: string;
    createdAt: string;
    read: boolean;
}

interface Conversation {
    id: string;
    teacherId: string;
    teacherName: string;
    teacherRole: string;
    childName: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

export default function ParentMessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Load messages from API
    const { data: messagesData, isLoading: loadingMessages } = useParentPortalMessages({
        limit: 100
    });
    
    // Get single message with replies when selected
    const { data: selectedMessageDetail } = useParentMessage(selectedConversation?.id || '');
    
    // Send message mutation
    const sendMutation = useSendParentPortalMessage();
    
    // Mark as read mutation
    const markAsReadMutation = useMarkParentMessageAsRead();
    
    // Convert API messages to conversations format
    const conversations = useMemo((): Conversation[] => {
        if (!messagesData?.data) return [];
        
        // Group messages by sender to create conversations
        const convMap = new Map<string, Conversation>();
        
        messagesData.data.forEach((msg: ParentPortalMessage) => {
            const key = msg.senderId;
            const existing = convMap.get(key);
            
            if (!existing) {
                convMap.set(key, {
                    id: msg.id,
                    teacherId: msg.senderId,
                    teacherName: msg.sender?.name || 'Unknown',
                    teacherRole: msg.sender?.role || 'Teacher',
                    childName: '-',
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unreadCount: msg.isRead ? 0 : 1,
                });
            } else if (new Date(msg.createdAt) > new Date(existing.lastMessageAt)) {
                existing.lastMessage = msg.content;
                existing.lastMessageAt = msg.createdAt;
                if (!msg.isRead) existing.unreadCount++;
            }
        });
        
        return Array.from(convMap.values()).sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
    }, [messagesData]);
    
    // Get messages for selected conversation
    const messages = useMemo((): Message[] => {
        if (!selectedMessageDetail) return [];
        
        const allMessages: Message[] = [{
            id: selectedMessageDetail.id,
            senderId: selectedMessageDetail.senderId,
            senderName: selectedMessageDetail.sender?.name || 'Unknown',
            senderRole: selectedMessageDetail.sender?.role?.toLowerCase() === 'parent' ? 'parent' : 'teacher',
            content: selectedMessageDetail.content,
            createdAt: selectedMessageDetail.createdAt,
            read: selectedMessageDetail.isRead
        }];
        
        // Add replies if any
        if (selectedMessageDetail.replies) {
            selectedMessageDetail.replies.forEach(reply => {
                allMessages.push({
                    id: reply.id,
                    senderId: reply.senderId,
                    senderName: reply.sender?.name || 'Unknown',
                    senderRole: reply.sender?.role?.toLowerCase() === 'parent' ? 'parent' : 'teacher',
                    content: reply.content,
                    createdAt: reply.createdAt,
                    read: reply.isRead
                });
            });
        }
        
        return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [selectedMessageDetail]);
    
    // Mark conversation as read when selected
    useEffect(() => {
        if (selectedConversation && selectedConversation.unreadCount > 0) {
            markAsReadMutation.mutate(selectedConversation.id);
        }
    }, [selectedConversation]);

    // Scroll to bottom when new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        
        try {
            await sendMutation.mutateAsync({
                receiverId: selectedConversation.teacherId,
                subject: 'Re: ' + selectedConversation.teacherName,
                content: newMessage,
                replyToId: selectedConversation.id,
            });
            setNewMessage('');
            toast.success('Pesan terkirim');
        } catch (error) {
            toast.error('Gagal mengirim pesan');
        }
    };

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Loading state
    if (loadingMessages) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)]">
                    <Skeleton className="h-full" />
                    <Skeleton className="lg:col-span-2 h-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/parent">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Pesan</h1>
                    <p className="text-muted-foreground">Komunikasi dengan guru dan wali kelas</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)]">
                {/* Conversation List */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Percakapan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`flex items-start gap-3 p-4 cursor-pointer border-b transition-colors hover:bg-muted/50 ${selectedConversation?.id === conv.id ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(conv.teacherName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium truncate">{conv.teacherName}</p>
                                            {conv.unreadCount > 0 && (
                                                <Badge className="ml-2">{conv.unreadCount}</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{conv.teacherRole}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            <Users className="inline h-3 w-3 mr-1" />
                                            {conv.childName}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(selectedConversation.teacherName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{selectedConversation.teacherName}</CardTitle>
                                        <CardDescription>
                                            {selectedConversation.teacherRole} • {selectedConversation.childName}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 p-4 overflow-hidden">
                                <ScrollArea className="h-[350px] pr-4">
                                    <div className="space-y-4">
                                        {messages.map((msg) => {
                                            const isMe = msg.senderRole === 'parent';
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                            }`}>
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: id })}
                                                            {isMe && (
                                                                msg.read
                                                                    ? <CheckCheck className="h-3 w-3 ml-1" />
                                                                    : <Check className="h-3 w-3 ml-1" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            {/* Message Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Ketik pesan..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="min-h-[60px] resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sendMutation.isPending}
                                        className="px-4"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Pilih percakapan untuk mulai chat</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
