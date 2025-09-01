export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionType {
  id: number;
  name: string;
  description?: string;
  category: string;
}

export interface ProcessBlueprint {
  id: string;
  name: string;
  description?: string;
  department?: string;
  steps: ProcessStep[];
  escalationRules?: EscalationRule[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  expectedDuration?: number; // in hours
  assignedRole?: string;
  dependencies?: string[];
}

export interface Action {
  id: string;
  hash: string;
  prevHash?: string;
  userId: string;
  actionTypeId: number;
  targetItem: string;
  targetType: string;
  department: string;
  contextTags?: Record<string, any>;
  preState?: string;
  postState?: string;
  description?: string;
  metadata?: Record<string, any>;
  processBlueprintId?: string;
  parentActionId?: string;
  isVoided: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: Date;
  createdAt: Date;
}

export interface ActionDependency {
  id: string;
  sourceActionId: string;
  targetActionId: string;
  dependencyType: 'blocks' | 'triggers' | 'relates_to';
  createdAt: Date;
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    timeout?: number; // hours
    department?: string;
    actionType?: string;
    targetType?: string;
  };
  actions: {
    notifyUsers?: string[];
    notifyRoles?: string[];
    escalateToManager?: boolean;
    methods?: ('email' | 'sms' | 'chat')[];
  };
  isActive: boolean;
  createdAt: Date;
}

export interface EscalationAlert {
  id: string;
  ruleId: string;
  actionId: string;
  alertType: string;
  recipients: string[];
  message?: string;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: 'email' | 'erp' | 'project_tool' | 'document_system' | 'hr_system' | 'custom';
  config: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface AccessLog {
  id: string;
  userId: string;
  actionType: 'view' | 'export' | 'search' | 'create' | 'edit' | 'delete';
  targetResource?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface SearchSubscription {
  id: string;
  userId: string;
  queryParams: {
    keyword?: string;
    department?: string;
    actionType?: string;
    targetItem?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  notificationMethod: 'email' | 'push' | 'sms';
  isActive: boolean;
  createdAt: Date;
}

export interface CreateActionRequest {
  actionTypeId: number;
  targetItem: string;
  targetType: string;
  department: string;
  contextTags?: Record<string, any>;
  preState?: string;
  postState?: string;
  description?: string;
  metadata?: Record<string, any>;
  processBlueprintId?: string;
  parentActionId?: string;
}

export interface ActionWithDetails extends Action {
  user: User;
  actionType: ActionType;
  dependencies?: ActionDependency[];
}

export interface ProcessStatus {
  blueprintId: string;
  blueprintName: string;
  totalSteps: number;
  completedSteps: number;
  currentStep?: string;
  isOverdue: boolean;
  estimatedCompletion?: Date;
  actions: ActionWithDetails[];
}

export interface DashboardStats {
  totalActions: number;
  actionsToday: number;
  pendingActions: number;
  overdueActions: number;
  departmentBreakdown: Record<string, number>;
  actionTypeBreakdown: Record<string, number>;
}

export interface SearchQuery {
  keyword?: string;
  userId?: string;
  department?: string;
  actionType?: string;
  targetItem?: string;
  targetType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeVoided?: boolean;
  limit?: number;
  offset?: number;
}

export interface TimelineEvent {
  action: ActionWithDetails;
  dependencies: ActionWithDetails[];
  relatedActions: ActionWithDetails[];
}
