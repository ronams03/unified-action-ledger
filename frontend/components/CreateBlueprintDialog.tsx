import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { ProcessStep } from '~backend/action/types';

interface CreateBlueprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  department: string;
  steps: ProcessStep[];
}

export function CreateBlueprintDialog({ open, onOpenChange, onSuccess }: CreateBlueprintDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    department: '',
    steps: [
      {
        id: '1',
        name: '',
        description: '',
        expectedDuration: 24,
        assignedRole: '',
        dependencies: [],
      }
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const addStep = () => {
    const newStep: ProcessStep = {
      id: (formData.steps.length + 1).toString(),
      name: '',
      description: '',
      expectedDuration: 24,
      assignedRole: '',
      dependencies: [],
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData({
        ...formData,
        steps: formData.steps.filter((_, i) => i !== index),
      });
    }
  };

  const updateStep = (index: number, field: keyof ProcessStep, value: any) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      steps: updatedSteps,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.department || formData.steps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate steps
    for (const step of formData.steps) {
      if (!step.name) {
        toast({
          title: "Validation Error",
          description: "All steps must have a name",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await backend.process.createBlueprint({
        name: formData.name,
        description: formData.description || undefined,
        department: formData.department || undefined,
        steps: formData.steps,
      });

      setFormData({
        name: '',
        description: '',
        department: '',
        steps: [
          {
            id: '1',
            name: '',
            description: '',
            expectedDuration: 24,
            assignedRole: '',
            dependencies: [],
          }
        ],
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create blueprint:', error);
      toast({
        title: "Error",
        description: "Failed to create process blueprint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Process Blueprint</DialogTitle>
          <DialogDescription>
            Define a standardized workflow template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Blueprint Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hiring Process, Expense Approval"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., HR, Finance, Operations"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this process..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Process Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Process Steps</h3>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <Card key={step.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center">
                        <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                        Step {index + 1}
                      </CardTitle>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Step Name *</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        placeholder="e.g., Review Application, Send Approval"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={step.description || ''}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        placeholder="Describe what happens in this step..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Expected Duration (hours)</Label>
                        <Input
                          type="number"
                          value={step.expectedDuration || 24}
                          onChange={(e) => updateStep(index, 'expectedDuration', parseInt(e.target.value) || 24)}
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Assigned Role</Label>
                        <Input
                          value={step.assignedRole || ''}
                          onChange={(e) => updateStep(index, 'assignedRole', e.target.value)}
                          placeholder="e.g., Manager, HR Specialist"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Blueprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
