"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DigitalLibraryViewer } from "@/components/library/DigitalLibraryViewer";
import { useBooks } from "@/hooks/use-library";
import { Library } from "lucide-react";

export default function DigitalLibraryPage() {
  const { data: booksResponse, isLoading } = useBooks({ limit: 100 });
  const books = booksResponse?.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maktabah Cipansor</h1>
          <p className="text-muted-foreground">Koleksi kitab kuning dan e-book digital pesantren.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Library className="w-5 h-5 mr-2" /> Kategori Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Kitab Fiqih", "Hadits", "Tafsir", "Bahasa Arab", "Umum"].map((cat) => (
              <div key={cat} className="flex justify-between items-center p-2 hover:bg-muted rounded-md cursor-pointer group">
                <span className="text-sm font-medium">{cat}</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary">12 Kitab</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Koleksi Terbaru</CardTitle>
            <CardDescription>Kitab dan buku yang baru saja ditambahkan</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-40 bg-muted animate-pulse rounded-md" />
                <div className="h-40 bg-muted animate-pulse rounded-md" />
              </div>
            ) : (
              <DigitalLibraryViewer books={books} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
