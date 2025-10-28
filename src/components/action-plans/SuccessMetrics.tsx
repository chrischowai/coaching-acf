import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Target, CheckCircle2, Award } from 'lucide-react';

interface SuccessMetricsProps {
  metrics: string;
}

export function SuccessMetrics({ metrics }: SuccessMetricsProps) {
  // Parse metrics from text (bullet points)
  const metricsList = metrics
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[*•-]\s*/, '').trim())
    .filter(Boolean);

  // Icon options for variety
  const icons = [CheckCircle2, Target, Award, TrendingUp];

  return (
    <Card className="border-2 border-cyan-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <CardHeader className="border-b border-cyan-100">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-md">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <div>Success Metrics</div>
            <p className="text-sm font-normal text-cyan-600 mt-0.5">How progress will be measured</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {metricsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricsList.map((metric, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-cyan-100 hover:border-cyan-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
                    <Icon className="h-5 w-5 text-cyan-600" />
                  </div>
                  <p className="text-slate-700 text-sm font-medium leading-relaxed flex-1">
                    {metric}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p>No success metrics defined for this session</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
