import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  Calendar,
  User,
  Building,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreateActionDialog } from '../components/CreateActionDialog';
import backend from '~backend/client';
import type { ActionWithDetails } from '~backend/action/types';

function ActionCard({ action }: { action: ActionWithDetails }) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{action.targetItem}</CardTitle>
            <CardDescription className="mt-1">
              {action.description || 'No description provided'}
            </CardDescription>
          </div>
          <Link 
            to={`/timeline/${encodeURIComponent(action.targetItem)}`}
            className="ml-2"
          >
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{action.user.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Building className="h-3 w-3" />
              <span>{action.department}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(action.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {action.actionType.name}
            </Badge>
            {action.postState && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(action.postState)}`}
              >
                {action.postState.replace('_', ' ')}
              </Badge>
            )}
          </div>
          {action.contextTags && Object.keys(action.contextTags).length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>{Object.keys(action.contextTags).length} tags</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Actions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['actions', searchQuery, departmentFilter, actionTypeFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('keyword', searchQuery);
        if (departmentFilter) params.append('department', departmentFilter);
        if (actionTypeFilter) params.append('actionType', actionTypeFilter);
        params.append('limit', '50');

        return await backend.action.list(params);
      } catch (err) {
        console.error('Failed to fetch actions:', err);
        toast({
          title: "Error",
          description: "Failed to load actions",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const handleActionCreated = () => {
    setCreateDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Action created successfully",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load actions</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground">
            All recorded actions across your organization
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Action
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filter by department..."
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
            <Input
              placeholder="Filter by action type..."
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data && data.actions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.actions.length} of {data.total} actions
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No actions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || departmentFilter || actionTypeFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first action to get started'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateActionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleActionCreated}
      />
    </div>
  );
}
