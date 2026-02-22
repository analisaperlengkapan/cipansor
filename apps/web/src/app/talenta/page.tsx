"use client";

import { useTalentProfiles, useTrainings, useSuccessions } from "@/hooks/use-talenta";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categoryColor: Record<string, string> = {
  HIGH_POTENTIAL: "bg-purple-100 text-purple-700",
  KEY_TALENT: "bg-blue-100 text-blue-700",
  EMERGING: "bg-green-100 text-green-700",
  SOLID_PERFORMER: "bg-gray-100 text-gray-700",
  NEEDS_DEVELOPMENT: "bg-red-100 text-red-700",
};

const categoryLabel: Record<string, string> = {
  HIGH_POTENTIAL: "Potensi Tinggi",
  KEY_TALENT: "Talenta Kunci",
  EMERGING: "Berkembang",
  SOLID_PERFORMER: "Stabil",
  NEEDS_DEVELOPMENT: "Perlu Pengembangan",
};

export default function TalentaPage() {
  const { data: profiles, isLoading: loadingProfiles } = useTalentProfiles();
  const { data: trainings, isLoading: loadingTrainings } = useTrainings();
  const { data: successions } = useSuccessions();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Manajemen Talenta"
        description="Kelola profil talenta, penilaian kinerja, pelatihan, dan suksesi."
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Talenta</CardDescription>
            <CardTitle className="text-3xl">{loadingProfiles ? <Skeleton className="h-9 w-12" /> : profiles?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Potential</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{loadingProfiles ? <Skeleton className="h-9 w-12" /> : profiles?.filter((p: any) => p.category === "HIGH_POTENTIAL").length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Program Pelatihan</CardDescription>
            <CardTitle className="text-3xl">{loadingTrainings ? <Skeleton className="h-9 w-12" /> : trainings?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rencana Suksesi</CardDescription>
            <CardTitle className="text-3xl">{successions?.length ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profiles">Profil Talenta</TabsTrigger>
          <TabsTrigger value="trainings">Pelatihan</TabsTrigger>
          <TabsTrigger value="successions">Suksesi</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          {loadingProfiles ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : profiles?.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada profil talenta.</CardContent></Card>
          ) : (
            profiles?.map((profile: any) => (
              <Card key={profile.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{profile.user?.name}</CardTitle>
                      <CardDescription>{profile.currentRole} • {profile.unitRel?.name}</CardDescription>
                    </div>
                    <Badge className={categoryColor[profile.category]}>
                      {categoryLabel[profile.category] || profile.category}
                    </Badge>
                  </div>
                </CardHeader>
                {profile.assessments?.[0] && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Penilaian terakhir: Skor {profile.assessments[0].overallScore} •
                      Kinerja: {profile.assessments[0].performanceRating} •
                      Potensi: {profile.assessments[0].potentialRating}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="trainings" className="space-y-4">
          {loadingTrainings ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : trainings?.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada program pelatihan.</CardContent></Card>
          ) : (
            trainings?.map((training: any) => (
              <Card key={training.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{training.title}</CardTitle>
                      <CardDescription>{training.category} {training.trainer ? `• ${training.trainer}` : ""}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{training.enrollments?.length || 0} peserta</span>
                      <Badge variant="outline">{training.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="successions" className="space-y-4">
          {successions?.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada rencana suksesi.</CardContent></Card>
          ) : (
            successions?.map((succ: any) => (
              <Card key={succ.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{succ.positionTitle}</CardTitle>
                  <CardDescription>
                    Saat ini: {succ.currentHolder?.name || "-"} → Suksesor: {succ.successor?.user?.name || "-"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
