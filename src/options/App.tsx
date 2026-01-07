import { useAlert } from '@/components/providers/alert-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useRuleStore } from '@/store/useRuleStore';
import type { MockRule } from '@/types/rule';
import {
  FileCode2,
  Github,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Trash2,
  Zap
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { RuleEditor } from './editor';

function App() {
  const { confirm } = useAlert();
  const {
    rules,
    enabled,
    loading,
    editingRule,
    isEditorOpen,
    searchQuery,
    initialize,
    setEnabled,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    setEditingRule,
    setIsEditorOpen,
    setSearchQuery
  } = useRuleStore();

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [initialize]);

  const filteredRules = useMemo(() => {
    return rules.filter(
      (rule) =>
        rule.urlMatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.mockResponse.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rules, searchQuery]);

  const handleCreate = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (rule: MockRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: Omit<MockRule, 'id'>) => {
    if (editingRule) {
      await updateRule({
        ...editingRule,
        ...data
      });
    } else {
      await addRule(data);
    }
    setIsEditorOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Intercept Rule',
      description:
        'Are you sure you want to delete this rule? This action cannot be undone and Mockify will stop intercepting requests matching this URL.',
      confirmText: 'Delete Rule',
      cancelText: 'Keep it',
      variant: 'danger'
    });

    if (confirmed) {
      await deleteRule(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-black text-3xl shadow-2xl shadow-primary/30 rotate-3">
              M
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground bg-clip-text">
                Mockify
              </h1>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                Powerful Response Interceptor
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-emerald-500 font-bold">LATEST</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Card className="flex items-center gap-4 px-5 py-2.5 bg-secondary/30 backdrop-blur-md border-border/50 shadow-sm transition-all hover:bg-secondary/40">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
                  System Status
                </span>
                <span
                  className={`text-xs font-bold ${enabled ? 'text-emerald-500' : 'text-muted-foreground text-opacity-50'}`}
                >
                  {enabled ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked)}
              />
            </Card>
          </div>
        </header>

        <div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rules, URLs, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-secondary/20 border-border/50 focus:bg-background transition-all"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full sm:w-auto h-11 px-6 gap-2 shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all font-bold"
            >
              <Plus className="w-5 h-5" />
              Create New Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card className="p-16 text-center bg-secondary/5 border-dashed border-2 border-border/50 rounded-3xl group transition-all hover:border-primary/30">
              <div className="w-24 h-24 mx-auto mb-8 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-4xl transform transition-transform duration-500 shadow-inner">
                <Zap className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">
                No active rules found
              </h3>
              <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
                Start your journey by creating your first interception rule. You
                can mock JSON data or plain text responses with ease.
              </p>
              <Button
                onClick={handleCreate}
                variant="secondary"
                size="lg"
                className="px-10 h-14 rounded-2xl font-bold shadow-xl active:translate-y-1 transition-all"
              >
                Add Your First Rule
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRules.length === 0 && (
                <div className="p-12 text-center text-muted-foreground font-medium italic">
                  No rules match your search criteria...
                </div>
              )}
              {filteredRules.map((rule) => (
                <Card
                  key={rule.id}
                  onClick={() => handleEdit(rule)}
                  className={`group relative overflow-hidden transition-all duration-300 bg-secondary/10 border-border/30 hover:border-primary/50 hover:bg-secondary/20 cursor-pointer ${
                    !rule.enabled ? 'opacity-70' : ''
                  }`}
                >
                  {/* Subtle edge highlight */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1 ${rule.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  />

                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant={
                            rule.responseType === 'json' ? 'amber' : 'blue'
                          }
                          className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                          {rule.responseType}
                        </Badge>
                        <Badge
                          variant={rule.enabled ? 'default' : 'secondary'}
                          className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${
                            rule.enabled
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : ''
                          }`}
                        >
                          {rule.enabled ? 'Live' : 'Paused'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-foreground font-mono truncate tracking-tight py-1 selection:bg-primary/20">
                          {rule.urlMatch}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-sm">
                          <p className="text-xs text-muted-foreground/60 truncate font-mono bg-background/40 px-3 py-1.5 rounded-lg border border-border/20 group-hover:border-border/40 transition-colors">
                            {rule.mockResponse || '(Empty response)'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-border/30 pt-4 md:pt-0">
                      <div className="h-8 w-px bg-border/40 mx-2 hidden md:block" />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRule(rule.id);
                        }}
                        className={`h-10 w-10 rounded-xl transition-all ${
                          rule.enabled
                            ? 'text-primary hover:bg-primary/10'
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                        title={rule.enabled ? 'Pause Rule' : 'Resume Rule'}
                      >
                        {rule.enabled ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(rule);
                        }}
                        className="h-10 w-10 rounded-xl hover:bg-blue-500/10 hover:text-blue-400"
                        title="Edit Rule"
                      >
                        <Settings2 className="w-5 h-5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(rule.id, e)}
                        className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-400"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <footer className="mt-20 py-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between text-muted-foreground/50 gap-4">
          <p className="text-xs font-medium">
            Built for developers who demand full control.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            >
              <FileCode2 className="w-3 h-3" /> Documentation
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            >
              <MessageSquare className="w-3 h-3" /> Support
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            >
              <Github className="w-3 h-3" /> Github
            </a>
          </div>
        </footer>
      </div>

      <Dialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingRule ? 'Modify Interceptor Rule' : 'New Interceptor Rule'}
        description="Configure how Mockify should handle specific network requests."
        className="max-w-3xl"
      >
        <RuleEditor
          key={editingRule?.id ?? 'new'}
          initialData={editingRule}
          onSave={handleSave}
          onCancel={() => setIsEditorOpen(false)}
        />
      </Dialog>
    </div>
  );
}

export default App;
