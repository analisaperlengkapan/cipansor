import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TKAspect, TKAchievementLevel, ASPECT_LABELS } from '@/hooks/use-tk-assessment';

interface AspectScore {
  aspect: TKAspect;
  score: number; // 0-4 based on achievement level
  level: TKAchievementLevel | null;
  label: string;
}

interface TKRadarChartProps {
  data: Record<TKAspect, {
    latestLevel: TKAchievementLevel | null;
    assessmentCount: number;
    progressTrend: 'UP' | 'DOWN' | 'STABLE' | 'NONE';
  }>;
  studentName?: string;
  className?: string;
}

// Achievement level to numeric score mapping
const LEVEL_TO_SCORE: Record<TKAchievementLevel, number> = {
  BB: 1,  // Belum Berkembang
  MB: 2,  // Mulai Berkembang
  BSH: 3, // Berkembang Sesuai Harapan
  BSB: 4, // Berkembang Sangat Baik
};

const LEVEL_COLORS: Record<TKAchievementLevel, string> = {
  BB: '#ef4444',  // red
  MB: '#f59e0b',  // yellow/orange
  BSH: '#3b82f6', // blue
  BSB: '#22c55e', // green
};

// Define CustomTooltip outside component to avoid re-creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as AspectScore;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-sm">{data.label}</p>
        <p className="text-sm text-muted-foreground">
          Score: {data.score}/4
        </p>
        {data.level && (
          <p className="text-sm font-medium" style={{ color: LEVEL_COLORS[data.level] }}>
            {data.level}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function TKRadarChart({ data, studentName, className }: TKRadarChartProps) {
  // Transform data for radar chart
  const aspects: TKAspect[] = ['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'];

  const chartData: AspectScore[] = aspects.map((aspect) => {
    const aspectData = data[aspect];
    const level = aspectData.latestLevel;
    const score = level ? LEVEL_TO_SCORE[level] : 0;

    return {
      aspect,
      score,
      level,
      label: ASPECT_LABELS[aspect],
    };
  });

  // Calculate average score
  const avgScore = chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length;
  const avgPercentage = (avgScore / 4) * 100;

  // Determine overall color based on average
  const getOverallColor = () => {
    if (avgScore >= 3.5) return LEVEL_COLORS.BSB;
    if (avgScore >= 2.5) return LEVEL_COLORS.BSH;
    if (avgScore >= 1.5) return LEVEL_COLORS.MB;
    return LEVEL_COLORS.BB;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Perkembangan 6 Aspek</CardTitle>
        <CardDescription>
          {studentName && `Profil perkembangan ${studentName}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Radar Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 4]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Capaian"
                  dataKey="score"
                  stroke={getOverallColor()}
                  fill={getOverallColor()}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Average Score Card */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Rata-rata Capaian
              </p>
              <p className="text-2xl font-bold" style={{ color: getOverallColor() }}>
                {avgScore.toFixed(2)}/4
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                Persentase
              </p>
              <p className="text-2xl font-bold" style={{ color: getOverallColor() }}>
                {avgPercentage.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">
                  {level} - {level === 'BB' ? 'Belum Berkembang' :
                    level === 'MB' ? 'Mulai Berkembang' :
                      level === 'BSH' ? 'Berkembang Sesuai Harapan' :
                        'Berkembang Sangat Baik'}
                </span>
              </div>
            ))}
          </div>

          {/* Aspect Details */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Detail per Aspek:</p>
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((item) => (
                <div
                  key={item.aspect}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-xs font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{item.score}/4</span>
                    {item.level && (
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: LEVEL_COLORS[item.level] }}
                      >
                        {item.level}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for compact version (dashboard widget)
export function TKRadarChartCompact({ data, className }: Omit<TKRadarChartProps, 'studentName'>) {
  const aspects: TKAspect[] = ['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'];

  const chartData = aspects.map((aspect) => {
    const aspectData = data[aspect];
    const level = aspectData.latestLevel;
    const score = level ? LEVEL_TO_SCORE[level] : 0;

    return {
      aspect,
      score,
      label: aspect,
    };
  });

  const avgScore = chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length;

  const getOverallColor = () => {
    if (avgScore >= 3.5) return LEVEL_COLORS.BSB;
    if (avgScore >= 2.5) return LEVEL_COLORS.BSH;
    if (avgScore >= 1.5) return LEVEL_COLORS.MB;
    return LEVEL_COLORS.BB;
  };

  return (
    <div className={className}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 4]}
              tick={false}
            />
            <Radar
              dataKey="score"
              stroke={getOverallColor()}
              fill={getOverallColor()}
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <p className="text-sm font-semibold" style={{ color: getOverallColor() }}>
          {avgScore.toFixed(1)}/4
        </p>
      </div>
    </div>
  );
}
