import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useStorage } from '@/hooks/useStorage';

function App() {
  const { storage, loading, setEnabled } = useStorage();

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="min-w-[280px] min-h-[160px] bg-background p-5 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-w-[280px] min-h-[160px] bg-background p-5 text-foreground border border-border shadow-xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
          M
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Mockify
          </h1>
          <p className="text-xs text-muted-foreground">Response Interceptor</p>
        </div>
      </div>

      <Card className="p-4 mb-4 bg-secondary/50 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                storage.enabled
                  ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'bg-muted-foreground/30'
              }`}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {storage.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <Switch checked={storage.enabled} onCheckedChange={handleToggle} />
        </div>
      </Card>

      <Button
        variant="secondary"
        onClick={openOptions}
        className="w-full gap-2 text-sm font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Open Advanced Settings
      </Button>

      <div className="mt-3 text-center">
        <span className="text-xs text-muted-foreground/50">
          {storage.rules.length} rule{storage.rules.length !== 1 ? 's' : ''}{' '}
          configured
        </span>
      </div>
    </div>
  );
}

export default App;
