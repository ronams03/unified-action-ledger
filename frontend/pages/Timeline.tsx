import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User, Building, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { TimelineEvent } from '~backend/action/types';

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const { action, dependencies, relatedActions } = event;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (postState?: string) => {
    switch (postState) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="relative">
      {/* Timeline connector */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
      
      <CardHeader className="pl-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{action.actionType.name}</CardTitle>
            <CardDescription>
              {action.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(action.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pl-6">
        <div className="space-y-4">
          {/* Action Details */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{action.user.name}</span>
              <Badge variant="outline" className="text-xs">
                {action.user.role}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{action.department}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{action.hash.substring(0, 8)}...</span>
            </div>
            {action.postState && (
              <div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(action.postState)}`}
                >
                  {action.postState.replace('_', ' ')}
                </Badge>
              </div>
            )}
          </div>

          {/* State Change */}
          {action.preState && action.postState && (
            <div className="flex items-center space-x-2 text-sm bg-muted rounded-lg p-3">
              <span className="text-muted-foreground">State:</span>
              <Badge variant="outline">{action.preState}</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline">{action.postState}</Badge>
            </div>
          )}

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Dependencies</h4>
              <div className="space-y-1">
                {dependencies.map((dep) => (
                  <div key={dep.id} className="text-xs bg-muted rounded p-2">
                    {dep.dependencyType}: {dep.targetItem}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Actions */}
          {relatedActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Actions</h4>
              <div className="grid gap-1">
                {relatedActions.slice(0, 3).map((related) => (
                  <div key={related.id} className="text-xs text-muted-foreground">
                    {related.actionType.name} by {related.user.name}
                  </div>
                ))}
                {relatedActions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{relatedActions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context Tags */}
          {action.contextTags && Object.keys(action.contextTags).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(action.contextTags).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Timeline() {
  const { targetItem } = useParams<{ targetItem: string }>();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['timeline', targetItem],
    queryFn: async () => {
      if (!targetItem) throw new Error('Target item is required');
      
      try {
        return await backend.action.getTimeline({ targetItem: decodeURIComponent(targetItem) });
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
        toast({
          title: "Error",
          description: "Failed to load timeline",
          variant: "destructive",
        });
        throw err;
      }
    },
    enabled: !!targetItem,
  });

  if (!targetItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Invalid timeline request</h2>
          <p className="text-muted-foreground">Target item not specified</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load timeline</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/actions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Timeline</h1>
          <p className="text-muted-foreground">
            Action history for: <span className="font-medium">{decodeURIComponent(targetItem)}</span>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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
      ) : data && data.events.length > 0 ? (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Showing {data.events.length} events in chronological order
          </div>
          <div className="space-y-4">
            {data.events.map((event, index) => (
              <TimelineEventCard key={`${event.action.id}-${index}`} event={event} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No timeline events found</h3>
              <p className="text-muted-foreground">
                No actions have been recorded for this item yet
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
