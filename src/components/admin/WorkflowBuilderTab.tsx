'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  Save,
  Play,
  Pause,
  Trash2,
  Edit2,
  Mail,
  Clock,
  Filter,
  GitBranch,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Settings,
  Copy,
  Eye,
  Zap,
  Users,
  ShoppingCart,
  Package,
  Star,
  Gift,
  Sparkles,
  Lightbulb,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  config: any;
  position: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  total_runs: number;
  success_rate: number;
}

const TRIGGER_TYPES = [
  { id: 'order_placed', label: 'Order Placed', icon: ShoppingCart, color: 'blue' },
  { id: 'order_shipped', label: 'Order Shipped', icon: Package, color: 'purple' },
  { id: 'order_delivered', label: 'Order Delivered', icon: CheckCircle, color: 'green' },
  { id: 'review_submitted', label: 'Review Submitted', icon: Star, color: 'yellow' },
  { id: 'customer_signup', label: 'Customer Signup', icon: Users, color: 'teal' },
  { id: 'abandoned_cart', label: 'Abandoned Cart', icon: ShoppingCart, color: 'orange' },
  { id: 'birthday', label: 'Customer Birthday', icon: Gift, color: 'pink' },
];

const ACTION_TYPES = [
  { id: 'send_email', label: 'Send Email', icon: Mail, color: 'blue' },
  { id: 'wait', label: 'Wait/Delay', icon: Clock, color: 'gray' },
  { id: 'add_tag', label: 'Add Customer Tag', icon: Filter, color: 'purple' },
  { id: 'send_notification', label: 'Send Notification', icon: AlertCircle, color: 'orange' },
];

export default function WorkflowBuilderTab() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      // TODO: Implement API call to fetch workflows
      setWorkflows([]);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    setIsBuilding(true);
    setSelectedWorkflow({
      id: 'new',
      name: 'New Workflow',
      description: '',
      is_active: false,
      trigger_type: 'order_placed',
      steps: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_runs: 0,
      success_rate: 0
    });
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      // TODO: Implement API call
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, is_active: !isActive } : w
      ));
      setSuccessMessage(`Workflow ${isActive ? 'paused' : 'activated'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to toggle workflow');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (isBuilding && selectedWorkflow) {
    return <WorkflowBuilder workflow={selectedWorkflow} onClose={() => setIsBuilding(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-gray-600 dark:text-gray-400">
            Create automated email sequences triggered by customer actions
          </p>
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </div>
        </div>
        <button
          onClick={handleCreateWorkflow}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No workflows yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first automated workflow to send emails based on customer actions
          </p>
          <button
            onClick={handleCreateWorkflow}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => {
            const trigger = TRIGGER_TYPES.find(t => t.id === workflow.trigger_type);
            const TriggerIcon = trigger?.icon || Zap;
            
            return (
              <div
                key={workflow.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg bg-${trigger?.color}-100 dark:bg-${trigger?.color}-900/30`}>
                      <TriggerIcon className={`h-6 w-6 text-${trigger?.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {workflow.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          workflow.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {workflow.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Play className="h-4 w-4" />
                          <span>{workflow.total_runs} runs</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>{workflow.success_rate}% success</span>
                        </div>
                        {workflow.last_run_at && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>Last run {new Date(workflow.last_run_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        workflow.is_active
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                      title={workflow.is_active ? 'Pause' : 'Activate'}
                    >
                      {workflow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsBuilding(true);
                      }}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsBuilding(true);
                        // Auto-open AI assistant in optimize mode
                        setTimeout(() => {
                          const event = new CustomEvent('workflow-ai-optimize');
                          window.dispatchEvent(event);
                        }, 100);
                      }}
                      className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      title="AI Optimize"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          About Workflows
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• <strong>Triggers:</strong> Events that start the workflow (e.g., order placed, cart abandoned)</li>
          <li>• <strong>Actions:</strong> What happens when triggered (send email, add tag, wait)</li>
          <li>• <strong>Conditions:</strong> Rules that determine if actions should run</li>
          <li>• <strong>Delays:</strong> Wait periods between actions for better timing</li>
        </ul>
      </div>
    </div>
  );
}

// Workflow Builder Component
function WorkflowBuilder({ workflow, onClose }: { workflow: Workflow; onClose: () => void }) {
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow.steps);
  const [selectedTrigger, setSelectedTrigger] = useState(workflow.trigger_type);
  const [workflowName, setWorkflowName] = useState(workflow.name);
  const [workflowDescription, setWorkflowDescription] = useState(workflow.description);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'suggest' | 'optimize' | 'add-step' | 'explain'>('suggest');

  // Listen for optimize event from workflow card
  useEffect(() => {
    const handleOptimizeEvent = () => {
      setShowAiAssistant(true);
      setAiMode('optimize');
      setTimeout(() => handleAiAssist(), 100);
    };

    window.addEventListener('workflow-ai-optimize', handleOptimizeEvent);
    return () => window.removeEventListener('workflow-ai-optimize', handleOptimizeEvent);
  }, []);

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      config: {},
      position: steps.length
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim() && aiMode !== 'optimize') return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const response = await fetch('/api/admin/ai/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: aiMode,
          prompt: aiPrompt,
          currentWorkflow: {
            name: workflowName,
            description: workflowDescription,
            trigger: selectedTrigger,
            steps: steps,
          },
          trigger: selectedTrigger,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.content);

        // If we got a parsed workflow suggestion, offer to apply it
        if (data.parsed && aiMode === 'suggest') {
          // Store the parsed suggestion for potential application
          (window as any).__workflowSuggestion = data.parsed;
        }
      } else {
        const error = await response.json();
        setAiResponse(`Error: ${error.error || 'Failed to get AI assistance'}`);
      }
    } catch (error) {
      console.error('AI assist error:', error);
      setAiResponse('Error: Failed to connect to AI service');
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    const suggestion = (window as any).__workflowSuggestion;
    if (!suggestion) return;

    if (suggestion.name) setWorkflowName(suggestion.name);
    if (suggestion.description) setWorkflowDescription(suggestion.description);
    if (suggestion.trigger) setSelectedTrigger(suggestion.trigger);
    if (suggestion.steps) {
      const newSteps = suggestion.steps.map((step: any, index: number) => ({
        id: `step-${Date.now()}-${index}`,
        type: step.type === 'send_email' ? 'action' : step.type,
        config: step,
        position: index,
      }));
      setSteps(newSteps);
    }

    setAiResponse('✅ Workflow suggestion applied! Review and adjust as needed.');
  };

  return (
    <div className="space-y-6">
      {/* Builder Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full text-gray-900 dark:text-white"
            placeholder="Workflow Name"
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="text-sm bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full text-gray-600 dark:text-gray-400 mt-1"
            placeholder="Add a description..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showAiAssistant
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Workflow
          </button>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAiAssistant && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Workflow Assistant</h3>
          </div>

          {/* AI Mode Selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => { setAiMode('suggest'); setAiResponse(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aiMode === 'suggest'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Lightbulb className="h-4 w-4 inline mr-1" />
              Suggest Workflow
            </button>
            <button
              onClick={() => { setAiMode('optimize'); setAiResponse(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aiMode === 'optimize'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <RefreshCw className="h-4 w-4 inline mr-1" />
              Optimize
            </button>
            <button
              onClick={() => { setAiMode('add-step'); setAiResponse(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aiMode === 'add-step'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-1" />
              Add Step
            </button>
            <button
              onClick={() => { setAiMode('explain'); setAiResponse(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aiMode === 'explain'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Ask Question
            </button>
          </div>

          {/* AI Prompt Input */}
          <div className="mb-4">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                aiMode === 'suggest' ? 'Describe the workflow you want to create (e.g., "Send a welcome series to new customers")' :
                aiMode === 'optimize' ? 'Click "Get Suggestions" to analyze and optimize your current workflow' :
                aiMode === 'add-step' ? 'Describe what you want to add (e.g., "Add a follow-up email after 3 days")' :
                'Ask anything about workflows (e.g., "What\'s the best timing for abandoned cart emails?")'
              }
              rows={3}
              disabled={aiMode === 'optimize'}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          {/* AI Action Button */}
          <button
            onClick={handleAiAssist}
            disabled={isAiLoading || (!aiPrompt.trim() && aiMode !== 'optimize')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {isAiLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {aiMode === 'suggest' ? 'Generate Workflow' :
                 aiMode === 'optimize' ? 'Get Optimization Suggestions' :
                 aiMode === 'add-step' ? 'Suggest Next Step' :
                 'Get Answer'}
              </>
            )}
          </button>

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {aiResponse}
                    </pre>
                  </div>
                  {aiMode === 'suggest' && (window as any).__workflowSuggestion && (
                    <button
                      onClick={applyAiSuggestion}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Apply This Workflow
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Powered by Anthropic Claude AI
          </p>
        </div>
      )}

      {/* Workflow Canvas */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 min-h-[600px]">
        {/* Trigger Selection */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">TRIGGER</h3>
          <select
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
          >
            {TRIGGER_TYPES.map(trigger => (
              <option key={trigger.id} value={trigger.id}>
                {trigger.label}
              </option>
            ))}
          </select>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-semibold">
                {index + 1}
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {step.type === 'action' ? 'Send Email' : step.type === 'delay' ? 'Wait' : 'Condition'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure this step
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Step Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {ACTION_TYPES.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => addStep('action')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
