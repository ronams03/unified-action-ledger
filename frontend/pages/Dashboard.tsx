import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { DashboardStats } from '~backend/action/types';

function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: number; 
  description: string; 
  icon: any; 
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function DepartmentChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions by Department</CardTitle>
        <CardDescription>Today's activity breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([department, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={department} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">{department}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionTypeChart({ data }: { data: Record<string, number> }) {
  const sortedData = Object.entries(data)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Action Types</CardTitle>
        <CardDescription>Most frequent actions today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map(([actionType, count]) => (
            <div key={actionType} className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{actionType}</span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        return await backend.dashboard.getStats();
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Unified Action Ledger - Real-time operational visibility
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Actions"
          value={stats.totalActions}
          description="All recorded actions"
          icon={Activity}
        />
        <StatsCard
          title="Today's Actions"
          value={stats.actionsToday}
          description="Actions logged today"
          icon={TrendingUp}
        />
        <StatsCard
          title="Pending Actions"
          value={stats.pendingActions}
          description="Awaiting completion"
          icon={Clock}
        />
        <StatsCard
          title="Overdue Items"
          value={stats.overdueActions}
          description="Require attention"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <DepartmentChart data={stats.departmentBreakdown} />
        <ActionTypeChart data={stats.actionTypeBreakdown} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <div className="font-medium">Create Action</div>
                <div className="text-sm text-muted-foreground">Log a new action</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="font-medium">View Processes</div>
                <div className="text-sm text-muted-foreground">Monitor workflows</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <div className="font-medium">Audit Log</div>
                <div className="text-sm text-muted-foreground">Review history</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
