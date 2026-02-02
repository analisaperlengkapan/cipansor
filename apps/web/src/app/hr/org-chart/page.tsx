"use client";

import { MainLayout } from "@/components/layout";
import { useDepartments } from "@/hooks";
import { Department } from "@/hooks/use-hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment } from "react";

export default function OrgChartPage() {
  const router = useRouter();
  const { data: departments, isLoading } = useDepartments();

  // Convert flat list to tree
  const buildTree = (
    depts: Department[],
    parentId: string | null = null
  ): DepartmentNode[] => {
    return depts
      .filter((d) => d.parentId === parentId || (parentId === null && !d.parentId))
      .map((d) => ({
        ...d,
        children: buildTree(depts, d.id),
      }));
  };

  const treeData = departments ? buildTree(departments) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Struktur Organisasi
            </h1>
            <p className="text-muted-foreground">
              Hierarki departemen dan unit kerja
            </p>
          </div>
        </div>

        <Card className="overflow-auto bg-slate-50/50">
          <CardContent className="p-8 min-w-[800px] min-h-[600px] flex justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : treeData.length > 0 ? (
              <div className="flex gap-8">
                {treeData.map((node) => (
                  <OrgTreeNode key={node.id} node={node} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground pt-12">
                Belum ada data departemen
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

interface DepartmentNode extends Department {
  children: DepartmentNode[];
}

function OrgTreeNode({ node }: { node: DepartmentNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center p-4">
        {/* Node Card */}
        <div className="z-10 w-64 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2 text-center">
          <div className="font-bold text-lg text-primary">{node.name}</div>
          {node.code && (
            <div className="text-xs text-muted-foreground bg-slate-100 rounded px-2 py-0.5 mx-auto w-fit">
              {node.code}
            </div>
          )}
          {node.head ? (
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{node.head.fullName}</span>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground italic">
              Posisi Kosong
            </div>
          )}
          {node._count?.employees !== undefined && (
            <div className="text-xs text-muted-foreground">
              {node._count.employees} Karyawan
            </div>
          )}
        </div>

        {/* Connector Line to Children */}
        {node.children.length > 0 && (
          <div className="w-px h-8 bg-slate-300" />
        )}
      </div>

      {/* Children Container */}
      {node.children.length > 0 && (
        <div className="relative flex gap-8 pt-4 border-t border-slate-300">
          {/*
             Top horizontal line logic:
             Ideally we want a line connecting all children tops.
             The border-t on this div does it, but we need to hide the excess on left/right ends.

             A simpler CSS hack for tree connectors:
             Use pseudo-elements on children to draw lines up to the parent.
          */}

          {node.children.map((child, index) => (
            <div key={child.id} className="relative flex flex-col items-center">
               {/* Vertical line from parent connector */}
               <div className="absolute -top-4 w-px h-4 bg-slate-300" />

               {/* Horizontal line logic for tree branches */}
               {node.children.length > 1 && (
                 <>
                   {index === 0 && <div className="absolute -top-4 right-0 w-1/2 h-px bg-slate-300 translate-y-[0px]" />}
                   {index === node.children.length - 1 && <div className="absolute -top-4 left-0 w-1/2 h-px bg-slate-300 translate-y-[0px]" />}
                   {index > 0 && index < node.children.length - 1 && <div className="absolute -top-4 w-full h-px bg-slate-300 translate-y-[0px]" />}
                 </>
               )}

               <OrgTreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
