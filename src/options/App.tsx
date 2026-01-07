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
  Activity,
  Copy,
  Download,
  Github,
  Layers,
  Pause,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { RuleEditor } from './editor';

function App() {
  const { confirm } = useAlert();
  const {
    profiles,
    activeProfileId,
    viewingProfileId,
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
    duplicateRule,
    addProfile,
    deleteProfile,
    switchProfile,
    setEditingRule,
    setIsEditorOpen,
    setSearchQuery,
    setViewingProfile
  } = useRuleStore();

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [initialize]);

  const viewingProfile = useMemo(() => {
    return profiles.find((p) => p.id === viewingProfileId) || profiles[0];
  }, [profiles, viewingProfileId]);

  const rules = useMemo(() => viewingProfile?.rules || [], [viewingProfile]);

  const filteredRules = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.urlMatch.toLowerCase().includes(query) ||
        rule.mockResponse.toLowerCase().includes(query) ||
        (rule.name && rule.name.toLowerCase().includes(query)) ||
        (rule.description && rule.description.toLowerCase().includes(query))
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

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;
    const newId = await addProfile(newProfileName.trim());
    setViewingProfile(newId);
    setNewProfileName('');
    setIsProfileDialogOpen(false);
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return;

    const profile = profiles.find((p) => p.id === id);
    const confirmed = await confirm({
      title: 'Delete Profile',
      description: `Are you sure you want to delete profile "${profile?.name}"? All rules within this profile will be permanently removed.`,
      confirmText: 'Delete Profile',
      variant: 'danger'
    });

    if (confirmed) {
      await deleteProfile(id);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateRule(id);
  };

  const handleExportRule = (rule: MockRule, e: React.MouseEvent) => {
    e.stopPropagation();
    const data = JSON.stringify(rule, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockify-rule-${rule.urlMatch.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRule = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const rule = JSON.parse(re.target?.result as string);
          if (rule.urlMatch && rule.mockResponse !== undefined) {
            // Remove ID to force new one
            const ruleData = {
              ...rule,
              isRegex: rule.isRegex ?? false,
              statusCode: rule.statusCode ?? 200,
              delay: rule.delay ?? 0
            };
            delete ruleData.id;
            await addRule(ruleData);
          }
        } catch {
          confirm({
            title: 'Import Error',
            description: 'Invalid Rule JSON file.',
            showCancel: false
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    const data = JSON.stringify(profile, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockify-profile-${profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const profile = JSON.parse(re.target?.result as string);
          if (profile.name && profile.rules) {
            // Generate new ID and normalize rules
            const newProfile = {
              ...profile,
              id: crypto.randomUUID(),
              rules: (profile.rules as MockRule[]).map((r) => ({
                ...r,
                isRegex: r.isRegex ?? false,
                statusCode: r.statusCode ?? 200,
                delay: r.delay ?? 0
              }))
            };
            const currentProfiles = [...profiles, newProfile];
            await chrome.storage.local.set({ profiles: currentProfiles });
          }
        } catch {
          confirm({
            title: 'Import Error',
            description: 'Invalid Profile JSON file.',
            showCancel: false
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/50 bg-[#060b1d] flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Mockify" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Mockify
              </h1>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Profiles
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsProfileDialogOpen(true)}
                  className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                  title="Add Profile"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleImportProfile}
                  className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                  title="Import Profile"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-2 -mr-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setViewingProfile(profile.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative overflow-hidden cursor-pointer group ${
                    viewingProfileId === profile.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`}
                >
                  {viewingProfileId === profile.id && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />
                  )}
                  {activeProfileId === profile.id && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500/50"
                      title="Globally Active"
                    />
                  )}
                  <Layers
                    className={`w-4 h-4 ${viewingProfileId === profile.id ? 'text-primary' : 'text-muted-foreground/50'}`}
                  />
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {profile.name}
                    </span>
                    {activeProfileId === profile.id && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter -mt-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold bg-background/40 px-1.5 py-0.5 rounded-md border border-border/20 group-hover:border-border/40 transition-colors">
                    {profile.rules.length}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={(e) => handleExportProfile(profile.id, e)}
                      className="p-1 hover:bg-primary hover:text-primary-foreground rounded-lg transition-all"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteProfile(profile.id, e)}
                        className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <Card className="p-4 bg-secondary/20 border-border/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground">
                Enable Mockify
              </span>
              <Badge
                variant={enabled ? 'emerald' : 'secondary'}
                className="text-[9px] px-1.5"
              >
                {enabled ? 'READY' : 'OFF'}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                Mockify is {enabled ? 'intercepting' : 'ignoring'} requests
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked)}
              />
            </div>
          </Card>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/kidixdev/mockify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </a>
            </div>
            <span className="text-[10px] font-black text-muted-foreground/20 italic tracking-tighter">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-3xl overflow-hidden relative">
        {/* Top Header Blur effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        <header className="h-20 border-b border-border/30 flex items-center justify-between px-8 bg-background/30 backdrop-blur-md shrink-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {viewingProfile?.name}
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5"
              >
                {rules.length} Rules
              </Badge>
              {activeProfileId === viewingProfileId ? (
                <Badge
                  variant="emerald"
                  className="text-[9px] font-black uppercase"
                >
                  Active
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchProfile(viewingProfileId)}
                  className="h-6 px-2 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all rounded-md"
                >
                  Set as Active
                </Button>
              )}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              {activeProfileId === viewingProfileId
                ? 'Globally active profile'
                : 'Viewing profile (Inactive)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Find in this profile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-secondary/20 border-border/30 focus:border-primary/50 focus:bg-secondary/40 transition-all rounded-xl text-sm"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="h-10 px-5 gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleImportRule}
              className="h-10 w-10 border-border/30 hover:border-primary/30 rounded-xl"
              title="Import Rule"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            {rules.length === 0 ? (
              <Card className="p-16 text-center bg-secondary/5 border-dashed border-2 border-border/30 rounded-[2.5rem] group transition-all hover:border-primary/20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/5 flex items-center justify-center transform transition-transform duration-500">
                  <Zap className="w-10 h-10 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No Interception Rules
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8 font-medium">
                  This profile is currently empty. Add your first rule to start
                  intercepting and mocking requests.
                </p>
                <Button
                  onClick={handleCreate}
                  variant="secondary"
                  className="px-8 h-12 rounded-xl font-bold bg-secondary/80 hover:bg-secondary transition-all"
                >
                  Create Your First Rule
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredRules.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground font-semibold italic opacity-50">
                    No matching rules in this profile...
                  </div>
                )}
                {filteredRules.map((rule) => (
                  <Card
                    key={rule.id}
                    onClick={() => handleEdit(rule)}
                    className={`group relative overflow-hidden transition-all duration-300 border-border/30 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer rounded-2xl ${
                      !rule.enabled
                        ? 'bg-secondary/5 opacity-60'
                        : 'bg-card/40 hover:bg-card/60'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-6">
                      <div className="flex items-center gap-4 shrink-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRule(rule.id);
                          }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            rule.enabled
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/10 text-muted-foreground'
                          } hover:scale-105 active:scale-95`}
                        >
                          {rule.enabled ? (
                            <Activity className="w-6 h-6" />
                          ) : (
                            <Pause className="w-6 h-6" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-foreground truncate tracking-tight">
                            {rule.name || rule.urlMatch}
                          </h4>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {rule.name && (
                            <p className="text-[11px] text-muted-foreground/80 truncate font-mono max-w-md">
                              {rule.urlMatch}
                            </p>
                          )}
                          {rule.description ? (
                            <p className="text-[11px] text-muted-foreground/60 truncate max-w-md">
                              {rule.description}
                            </p>
                          ) : (
                            !rule.name && (
                              <p className="text-[11px] text-muted-foreground/60 truncate font-mono max-w-md">
                                ↳ {rule.mockResponse || '(Empty response)'}
                              </p>
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden lg:flex items-center gap-1.5 mr-4 border-r border-border/50 pr-4">
                          <Badge
                            variant={
                              rule.responseType === 'json' ? 'amber' : 'blue'
                            }
                            className="px-1.5 py-0 text-[9px] font-black uppercase tracking-tighter"
                          >
                            {rule.responseType}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[9px] font-black bg-background/50 border-border/30"
                          >
                            {rule.statusCode || 200}
                          </Badge>
                          {rule.delay > 0 && (
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[9px] font-black bg-background/50 border-border/30"
                            >
                              {rule.delay}ms
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDuplicate(rule.id, e)}
                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleExportRule(rule, e)}
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Export"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(rule.id, e)}
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

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

      <Dialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        title="Create New Profile"
        description="Profiles help you organize your rules for different environments or testing scenarios."
        className="max-w-md"
      >
        <div className="p-6 space-y-4">
          <Input
            placeholder="Profile Name (e.g. Staging, Production Debug)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            className="h-11 rounded-xl"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setIsProfileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
            >
              Create Profile
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
