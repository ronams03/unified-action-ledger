import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { CreateActionRequest } from '~backend/action/types';

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateActionDialog({ open, onOpenChange, onSuccess }: CreateActionDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateActionRequest>>({
    targetItem: '',
    targetType: '',
    department: '',
    preState: '',
    postState: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch users for department suggestions
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => backend.user.list(),
    enabled: open,
  });

  const departments = usersData 
    ? [...new Set(usersData.users.map(u => u.department))]
    : [];

  const actionTypes = [
    { id: 1, name: 'create', description: 'Created a new item' },
    { id: 2, name: 'edit', description: 'Modified an existing item' },
    { id: 3, name: 'approve', description: 'Approved an item or request' },
    { id: 4, name: 'reject', description: 'Rejected an item or request' },
    { id: 5, name: 'delete', description: 'Deleted an item' },
    { id: 6, name: 'send', description: 'Sent an item' },
    { id: 7, name: 'receive', description: 'Received an item' },
    { id: 8, name: 'assign', description: 'Assigned a task or responsibility' },
    { id: 9, name: 'complete', description: 'Marked an item as complete' },
    { id: 10, name: 'schedule', description: 'Scheduled an event or task' },
    { id: 11, name: 'cancel', description: 'Cancelled an item or event' },
    { id: 12, name: 'review', description: 'Reviewed an item' },
    { id: 13, name: 'submit', description: 'Submitted an item for processing' },
    { id: 14, name: 'escalate', description: 'Escalated an issue or request' },
    { id: 15, name: 'archive', description: 'Archived an item' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.actionTypeId || !formData.targetItem || !formData.targetType || !formData.department) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await backend.action.create({
        actionTypeId: formData.actionTypeId,
        targetItem: formData.targetItem,
        targetType: formData.targetType,
        department: formData.department,
        preState: formData.preState || undefined,
        postState: formData.postState || undefined,
        description: formData.description || undefined,
        contextTags: formData.contextTags || undefined,
        metadata: formData.metadata || undefined,
      });

      setFormData({
        targetItem: '',
        targetType: '',
        department: '',
        preState: '',
        postState: '',
        description: '',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create action:', error);
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Action</DialogTitle>
          <DialogDescription>
            Record a new action in the unified ledger
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type *</Label>
              <Select
                value={formData.actionTypeId?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, actionTypeId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div>
                        <div className="font-medium capitalize">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department || ''}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetItem">Target Item *</Label>
              <Input
                id="targetItem"
                value={formData.targetItem || ''}
                onChange={(e) => setFormData({ ...formData, targetItem: e.target.value })}
                placeholder="e.g., PO-1023, Report-Q2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type *</Label>
              <Input
                id="targetType"
                value={formData.targetType || ''}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                placeholder="e.g., purchase_order, report"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preState">Previous State</Label>
              <Input
                id="preState"
                value={formData.preState || ''}
                onChange={(e) => setFormData({ ...formData, preState: e.target.value })}
                placeholder="e.g., pending, draft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postState">New State</Label>
              <Input
                id="postState"
                value={formData.postState || ''}
                onChange={(e) => setFormData({ ...formData, postState: e.target.value })}
                placeholder="e.g., approved, completed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what happened..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Action'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
