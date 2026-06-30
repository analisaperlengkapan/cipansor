"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AudioRecorder } from "@/components/tahfidz/AudioRecorder";
import { useCreateTahfidz } from "@/hooks/use-tahfidz";
import { useStudents } from "@/hooks/use-students";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SURAH_LIST } from "@/hooks/use-tahfidz";
import { toast } from "sonner";
import { BookOpen, Headset } from "lucide-react";

export default function ESimaanPage() {
  const createTahfidz = useCreateTahfidz();
  const { data: studentsResponse } = useStudents({ limit: 100 });
  const students = studentsResponse?.data || [];

  const [formData, setFormData] = useState({
    studentId: "",
    surahName: "Al-Fatihah",
    ayahStart: 1,
    ayahEnd: 7,
    juz: 30,
    activityType: "ZIYADAH" as any,
  });

  const handleUpload = async (blob: Blob) => {
    if (!formData.studentId) {
      toast.error("Pilih santri terlebih dahulu");
      return;
    }

    try {
      // In a real app, we would upload to S3/Storage first and get URL
      // For this demo, we'll simulate the URL
      const mockAudioUrl = `https://storage.cipansor.com/audio/simaan-${Date.now()}.webm`;

      await createTahfidz.mutateAsync({
        ...formData,
        surahNumber: SURAH_LIST.indexOf(formData.surahName) + 1,
        audioUrl: mockAudioUrl,
        notes: "Setoran via E-Simaan (Asinkron)",
      });

      toast.success("Setoran berhasil dikirim! Menunggu review dari Muhafidz.");
    } catch (error) {
      // toast.error("Gagal mengunggah setoran");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Simaan</h1>
        <p className="text-muted-foreground">Setoran Hafalan Mandiri via Audio Recording</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="w-5 h-5 mr-2" /> Detail Setoran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Santri</Label>
                <Select onValueChange={(v) => setFormData({...formData, studentId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih santri..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name || s.nis}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Surah</Label>
                  <Select
                    defaultValue={formData.surahName}
                    onValueChange={(v) => setFormData({...formData, surahName: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SURAH_LIST.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Juz</Label>
                  <Input
                    type="number"
                    value={formData.juz}
                    onChange={(e) => setFormData({...formData, juz: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ayat Mulai</Label>
                  <Input
                    type="number"
                    value={formData.ayahStart}
                    onChange={(e) => setFormData({...formData, ayahStart: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ayat Akhir</Label>
                  <Input
                    type="number"
                    value={formData.ayahEnd}
                    onChange={(e) => setFormData({...formData, ayahEnd: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-none">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2 flex items-center">
                <Headset className="w-4 h-4 mr-2" /> Tips Rekaman
              </h4>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc list-inside">
                <li>Pastikan berada di ruangan yang tenang</li>
                <li>Gunakan headset/microphone jika tersedia</li>
                <li>Awali dengan Ta'awudz dan Basmalah</li>
                <li>Ucapkan ayat dengan makhraj dan tajwid yang jelas</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <AudioRecorder onUpload={handleUpload} isUploading={createTahfidz.isPending} />
        </div>
      </div>
    </div>
  );
}
