-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action types lookup
CREATE TABLE action_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL
);

-- Process blueprints
CREATE TABLE process_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  steps JSONB NOT NULL,
  escalation_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main actions ledger
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash VARCHAR(64) UNIQUE NOT NULL, -- For blockchain-like integrity
  prev_hash VARCHAR(64), -- Links to previous action's hash
  user_id UUID NOT NULL REFERENCES users(id),
  action_type_id INTEGER NOT NULL REFERENCES action_types(id),
  target_item VARCHAR(500) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  context_tags JSONB,
  pre_state VARCHAR(255),
  post_state VARCHAR(255),
  description TEXT,
  metadata JSONB,
  process_blueprint_id UUID REFERENCES process_blueprints(id),
  parent_action_id UUID REFERENCES actions(id),
  is_voided BOOLEAN DEFAULT false,
  void_reason TEXT,
  voided_by UUID REFERENCES users(id),
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action dependencies for cross-referencing
CREATE TABLE action_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_action_id UUID NOT NULL REFERENCES actions(id),
  target_action_id UUID NOT NULL REFERENCES actions(id),
  dependency_type VARCHAR(100) NOT NULL, -- blocks, triggers, relates_to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_action_id, target_action_id, dependency_type)
);

-- Escalation rules
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL, -- timeout, department, action_type, etc.
  actions JSONB NOT NULL, -- notification settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation alerts
CREATE TABLE escalation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES escalation_rules(id),
  action_id UUID NOT NULL REFERENCES actions(id),
  alert_type VARCHAR(100) NOT NULL,
  recipients JSONB NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- email, erp, project_tool, etc.
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access logs for audit
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL, -- view, export, search
  target_resource VARCHAR(500),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search subscriptions (follow feature)
CREATE TABLE search_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  query_params JSONB NOT NULL,
  notification_method VARCHAR(50) DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_created_at ON actions(created_at);
CREATE INDEX idx_actions_department ON actions(department);
CREATE INDEX idx_actions_target_item ON actions(target_item);
CREATE INDEX idx_actions_action_type_id ON actions(action_type_id);
CREATE INDEX idx_actions_hash ON actions(hash);
CREATE INDEX idx_actions_prev_hash ON actions(prev_hash);
CREATE INDEX idx_action_dependencies_source ON action_dependencies(source_action_id);
CREATE INDEX idx_action_dependencies_target ON action_dependencies(target_action_id);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);

-- Insert default action types
INSERT INTO action_types (name, description, category) VALUES
('create', 'Created a new item', 'creation'),
('edit', 'Modified an existing item', 'modification'),
('approve', 'Approved an item or request', 'approval'),
('reject', 'Rejected an item or request', 'approval'),
('delete', 'Deleted an item', 'deletion'),
('send', 'Sent an item (email, message, etc.)', 'communication'),
('receive', 'Received an item', 'communication'),
('assign', 'Assigned a task or responsibility', 'assignment'),
('complete', 'Marked an item as complete', 'completion'),
('schedule', 'Scheduled an event or task', 'scheduling'),
('cancel', 'Cancelled an item or event', 'cancellation'),
('review', 'Reviewed an item', 'review'),
('submit', 'Submitted an item for processing', 'submission'),
('escalate', 'Escalated an issue or request', 'escalation'),
('archive', 'Archived an item', 'archival');
