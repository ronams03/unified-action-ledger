import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Workflow, Play, Pause, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { CreateBlueprintDialog } from '../components/CreateBlueprintDialog';
import backend from '~backend/client';
import type { ProcessBlueprint } from '~backend/action/types';

function ProcessCard({ blueprint }: { blueprint: ProcessBlueprint }) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const totalDuration = blueprint.steps.reduce((sum, step) => sum + (step.expectedDuration || 24), 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center">
              <Workflow className="h-5 w-5 mr-2 text-primary" />
              {blueprint.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {blueprint.description || 'No description provided'}
            </CardDescription>
          </div>
          <Badge variant={blueprint.isActive ? "default" : "secondary"}>
            {blueprint.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Steps:</span>
              <span className="font-medium">{blueprint.steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Duration:</span>
              <span className="font-medium">
                {totalDuration < 24 
                  ? `${totalDuration}h` 
                  : `${Math.round(totalDuration / 24)}d`
                }
              </span>
            </div>
            {blueprint.department && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium">{blueprint.department}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDate(blueprint.createdAt)}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Process Steps</h4>
            <div className="space-y-1">
              {blueprint.steps.slice(0, 3).map((step, index) => (
                <div key={step.id} className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                    {index + 1}
                  </div>
                  <span>{step.name}</span>
                  {step.expectedDuration && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {step.expectedDuration}h
                    </Badge>
                  )}
                </div>
              ))}
              {blueprint.steps.length > 3 && (
                <div className="text-xs text-muted-foreground pl-6">
                  +{blueprint.steps.length - 3} more steps
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              <Play className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Processes() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['process-blueprints'],
    queryFn: async () => {
      try {
        return await backend.process.listBlueprints();
      } catch (err) {
        console.error('Failed to fetch process blueprints:', err);
        toast({
          title: "Error",
          description: "Failed to load process blueprints",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const handleBlueprintCreated = () => {
    setCreateDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Process blueprint created successfully",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load processes</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Processes</h1>
          <p className="text-muted-foreground">
            Manage and monitor standardized workflows
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Blueprint
        </Button>
      </div>

      {/* Process Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blueprints</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? data.blueprints.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Process templates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? data.blueprints.filter(b => b.isActive).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Process instances
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Process Blueprints */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data && data.blueprints.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.blueprints.map((blueprint) => (
            <ProcessCard key={blueprint.id} blueprint={blueprint} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No process blueprints</h3>
              <p className="text-muted-foreground mb-4">
                Create your first process blueprint to standardize workflows
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Blueprint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateBlueprintDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleBlueprintCreated}
      />
    </div>
  );
}
