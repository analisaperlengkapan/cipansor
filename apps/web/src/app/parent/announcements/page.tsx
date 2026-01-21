"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import {
  Bell,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  unit?: {
    name: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [announcementsRes, notificationsRes] = await Promise.all([
          api.get("/parent/announcements"),
          api.get("/parent/notifications"),
        ]);
        setAnnouncements(announcementsRes.data.data || []);
        setNotifications(notificationsRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/parent/notifications/${notificationId}/read`);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId
            ? { ...n, status: "READ", readAt: new Date().toISOString() }
            : n,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" /> Penting
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" /> Sedang
          </Badge>
        );
      default:
        return <Badge variant="secondary">Biasa</Badge>;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case "ACADEMIC":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "FINANCE":
        return <Bell className="h-4 w-4 text-green-500" />;
      case "HEALTH":
        return <Bell className="h-4 w-4 text-pink-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Pengumuman & Notifikasi
        </h1>
        <p className="text-muted-foreground">Informasi penting dari sekolah</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Pengumuman
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Tidak ada pengumuman</h3>
                <p className="text-muted-foreground mt-2">
                  Belum ada pengumuman aktif saat ini
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {announcement.title}
                          {getPriorityBadge(announcement.priority)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {announcement.unit?.name || "Semua Unit"} •{" "}
                          {new Date(announcement.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                    {announcement.endDate && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Berlaku hingga:{" "}
                        {new Date(announcement.endDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Tidak ada notifikasi</h3>
                <p className="text-muted-foreground mt-2">
                  Anda belum memiliki notifikasi
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={
                    notification.status === "UNREAD"
                      ? "border-primary/50 bg-primary/5"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {getNotificationTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{notification.title}</p>
                          {notification.status === "UNREAD" && (
                            <Badge variant="default" className="ml-2">
                              Baru
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {notification.status === "UNREAD" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tandai Dibaca
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
