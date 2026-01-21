"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Save } from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import {
  useCreateKitab,
  KITAB_CATEGORIES,
  KITAB_LEVELS,
  KITAB_CATEGORY_LABELS,
  KITAB_CATEGORY_DESCRIPTIONS,
  KITAB_LEVEL_LABELS,
  getCategoryIcon,
  type KitabCategory,
  type KitabLevel,
} from "@/hooks/use-kitab-progress";
import { useUnits } from "@/hooks/use-units";

export default function NewKitabPage() {
  const router = useRouter();
  const createMutation = useCreateKitab();
  const { data: unitsData } = useUnits();
  const units = unitsData || [];

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "" as KitabCategory | "",
    level: "" as KitabLevel | "",
    totalPages: "",
    totalChapters: "",
    description: "",
    unitId: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Judul kitab wajib diisi";
    }
    if (!formData.category) {
      newErrors.category = "Kategori wajib dipilih";
    }
    if (!formData.level) {
      newErrors.level = "Level wajib dipilih";
    }
    if (formData.totalPages && parseInt(formData.totalPages) <= 0) {
      newErrors.totalPages = "Jumlah halaman harus lebih dari 0";
    }
    if (formData.totalChapters && parseInt(formData.totalChapters) <= 0) {
      newErrors.totalChapters = "Jumlah bab harus lebih dari 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi form dengan benar");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: formData.title.trim(),
        author: formData.author.trim() || undefined,
        category: formData.category as KitabCategory,
        level: formData.level as KitabLevel,
        totalPages: formData.totalPages
          ? parseInt(formData.totalPages)
          : undefined,
        totalChapters: formData.totalChapters
          ? parseInt(formData.totalChapters)
          : undefined,
        description: formData.description.trim() || undefined,
        unitId: formData.unitId || undefined,
      });

      toast.success("Kitab berhasil ditambahkan");
      router.push("/kitab-progress");
    } catch {
      toast.error("Gagal menambahkan kitab");
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kitab-progress">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Kitab Kuning</h1>
          <p className="text-muted-foreground">
            Daftarkan kitab kuning baru untuk tracking progress santri
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informasi Kitab
              </CardTitle>
              <CardDescription>
                Masukkan informasi dasar kitab kuning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Judul Kitab <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Jurumiyah, Alfiyah, Fathul Qorib"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="author">Pengarang</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  placeholder="Contoh: Imam Ibnu Malik"
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Kategori <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as KitabCategory })
                  }
                >
                  <SelectTrigger
                    className={errors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Pilih kategori kitab" />
                  </SelectTrigger>
                  <SelectContent>
                    {KITAB_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="flex items-center gap-2">
                          <span>{getCategoryIcon(cat)}</span>
                          <span>{KITAB_CATEGORY_LABELS[cat]}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {
                      KITAB_CATEGORY_DESCRIPTIONS[
                        formData.category as KitabCategory
                      ]
                    }
                  </p>
                )}
                {errors.category && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="level">
                  Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) =>
                    setFormData({ ...formData, level: v as KitabLevel })
                  }
                >
                  <SelectTrigger
                    className={errors.level ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Pilih level kitab" />
                  </SelectTrigger>
                  <SelectContent>
                    {KITAB_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {KITAB_LEVEL_LABELS[lvl]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.level}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
              <CardDescription>
                Detail kitab untuk tracking progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPages">Jumlah Halaman</Label>
                  <Input
                    id="totalPages"
                    type="number"
                    min={1}
                    value={formData.totalPages}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPages: e.target.value })
                    }
                    placeholder="Opsional"
                    className={errors.totalPages ? "border-destructive" : ""}
                  />
                  {errors.totalPages && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.totalPages}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="totalChapters">Jumlah Bab</Label>
                  <Input
                    id="totalChapters"
                    type="number"
                    min={1}
                    value={formData.totalChapters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalChapters: e.target.value,
                      })
                    }
                    placeholder="Opsional"
                    className={errors.totalChapters ? "border-destructive" : ""}
                  />
                  {errors.totalChapters && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.totalChapters}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="unit">Unit Pendidikan</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(v) => setFormData({ ...formData, unitId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Unit</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Kosongkan jika kitab ini digunakan di semua unit
                </p>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi singkat tentang kitab ini..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Kitab aktif (dapat digunakan untuk tracking)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Kitab Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Referensi Kitab Populer</CardTitle>
            <CardDescription>
              Beberapa kitab kuning yang umum dipelajari di pesantren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Jurumiyah",
                  category: "NAHWU",
                  level: "MUBTADI",
                  author: "Imam Sanhaji",
                },
                {
                  title: "Alfiyah Ibnu Malik",
                  category: "NAHWU",
                  level: "MUTAQADDIM",
                  author: "Ibnu Malik",
                },
                {
                  title: "Amtsilati Tashrif",
                  category: "SHOROF",
                  level: "MUBTADI",
                  author: "KH. Taufiqul Hakim",
                },
                {
                  title: "Fathul Qorib",
                  category: "FIQIH",
                  level: "MUBTADI",
                  author: "Ibnu Qosim Al-Ghozi",
                },
                {
                  title: "Ta'limul Muta'allim",
                  category: "AKHLAK",
                  level: "MUBTADI",
                  author: "Az-Zarnuji",
                },
                {
                  title: "Bulughul Maram",
                  category: "HADITS",
                  level: "MUTAWASSITH",
                  author: "Ibnu Hajar Al-Asqolani",
                },
              ].map((kitab, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      title: kitab.title,
                      author: kitab.author,
                      category: kitab.category as KitabCategory,
                      level: kitab.level as KitabLevel,
                    })
                  }
                  className="text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getCategoryIcon(kitab.category as KitabCategory)}
                    </span>
                    <div>
                      <p className="font-medium">{kitab.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {kitab.author}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/kitab-progress">Batal</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Menyimpan..." : "Simpan Kitab"}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
