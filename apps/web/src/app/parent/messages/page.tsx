'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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

// Demo data
const DEMO_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        teacherId: 't1',
        teacherName: 'Ustadz Ahmad',
        teacherRole: 'Wali Kelas 7A',
        childName: 'Muhammad Farhan',
        lastMessage: 'Terima kasih atas informasinya, Bu/Pak',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 2,
    },
    {
        id: '2',
        teacherId: 't2',
        teacherName: 'Ustadzah Fatimah',
        teacherRole: 'Guru Tahfidz',
        childName: 'Muhammad Farhan',
        lastMessage: 'Alhamdulillah progres tahfidz minggu ini bagus',
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        unreadCount: 0,
    },
    {
        id: '3',
        teacherId: 't3',
        teacherName: 'Ustadz Mahmud',
        teacherRole: 'Guru Matematika',
        childName: 'Aisyah Zahra',
        lastMessage: 'Nilai ulangan sudah keluar',
        lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
        unreadCount: 1,
    },
];

const DEMO_MESSAGES: Message[] = [
    {
        id: '1',
        senderId: 't1',
        senderName: 'Ustadz Ahmad',
        senderRole: 'teacher',
        content: 'Assalamualaikum, Bu/Pak. Farhan hari ini aktif sekali di kelas. Alhamdulillah.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: true,
    },
    {
        id: '2',
        senderId: 'p1',
        senderName: 'Orang Tua',
        senderRole: 'parent',
        content: 'Waalaikumsalam, Ustadz. Syukurlah. Bagaimana dengan tugas PR nya?',
        createdAt: new Date(Date.now() - 3000000).toISOString(),
        read: true,
    },
    {
        id: '3',
        senderId: 't1',
        senderName: 'Ustadz Ahmad',
        senderRole: 'teacher',
        content: 'PR sudah dikerjakan dengan baik. Nilainya 85.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        read: true,
    },
    {
        id: '4',
        senderId: 't1',
        senderName: 'Ustadz Ahmad',
        senderRole: 'teacher',
        content: 'Minggu depan ada ulangan Matematika, mohon dibimbing belajar di rumah ya.',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        read: false,
    },
];

export default function ParentMessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Load conversations
    const { data: conversations = DEMO_CONVERSATIONS, isLoading: loadingConversations } = useQuery({
        queryKey: ['parent-conversations'],
        queryFn: async () => {
            // In production, fetch from API
            return DEMO_CONVERSATIONS;
        },
    });

    // Load messages when conversation selected
    // Note: Setting state in effect is okay here as it's triggered by user selection change
    // and we're loading mock data. In real app, this would be a useQuery.
    useEffect(() => {
        if (selectedConversation) {
            setMessages(DEMO_MESSAGES);
        }
    }, [selectedConversation]);

    // Scroll to bottom when new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            await new Promise((r) => setTimeout(r, 500));
            return {
                id: String(Date.now()),
                senderId: 'p1',
                senderName: 'Orang Tua',
                senderRole: 'parent' as const,
                content,
                createdAt: new Date().toISOString(),
                read: false,
            };
        },
        onSuccess: (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            setNewMessage('');
            toast.success('Pesan terkirim');
        },
        onError: () => {
            toast.error('Gagal mengirim pesan');
        },
    });

    const handleSend = () => {
        if (!newMessage.trim() || !selectedConversation) return;
        sendMutation.mutate(newMessage);
    };

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
