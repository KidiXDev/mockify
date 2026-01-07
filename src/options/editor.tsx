import { useAlert } from '@/components/providers/alert-provider';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { MockRule } from '@/types/rule';
import { Code2, FileJson, Link2 } from 'lucide-react';
import { useState } from 'react';

interface RuleEditorProps {
  initialData?: MockRule | null;
  onSave: (data: Omit<MockRule, 'id'>) => void;
  onCancel: () => void;
}

export function RuleEditor({ initialData, onSave, onCancel }: RuleEditorProps) {
  const { confirm } = useAlert();
  const [formData, setFormData] = useState({
    urlMatch: initialData?.urlMatch ?? '',
    responseType: initialData?.responseType ?? ('json' as 'json' | 'text'),
    mockResponse: initialData?.mockResponse ?? '',
    enabled: initialData?.enabled ?? true
  });

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(formData.mockResponse);
      setFormData({
        ...formData,
        mockResponse: JSON.stringify(parsed, null, 2)
      });
    } catch {
      confirm({
        title: 'Format Error',
        description:
          'The response content is not valid JSON and cannot be beautified.',
        variant: 'warning',
        confirmText: 'Got it',
        showCancel: false
      });
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(formData.mockResponse);
      setFormData({
        ...formData,
        mockResponse: JSON.stringify(parsed)
      });
    } catch {
      confirm({
        title: 'Format Error',
        description:
          'The response content is not valid JSON and cannot be minified.',
        variant: 'warning',
        confirmText: 'Got it',
        showCancel: false
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.urlMatch.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            URL Match (substring)
          </label>
          <Input
            type="text"
            value={formData.urlMatch}
            onChange={(e) =>
              setFormData({ ...formData, urlMatch: e.target.value })
            }
            placeholder="e.g. api/v1/users"
            className="bg-background/50 border-border/50 focus:border-primary/50"
          />
          <p className="text-[11px] text-muted-foreground">
            The interceptor will match any URL containing this string.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-primary" />
            Response Type
          </label>
          <Tabs
            value={formData.responseType}
            onValueChange={(val) =>
              setFormData({ ...formData, responseType: val as 'json' | 'text' })
            }
          >
            <TabsList className="w-full bg-background/50 border border-border/50 p-1 h-11">
              <TabsTrigger
                value="json"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                JSON
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Plain Text
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              Mock Response
            </label>
            {formData.responseType === 'json' && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[11px] px-2 gap-1.5"
                  onClick={handleBeautify}
                >
                  Beautify
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[11px] px-2"
                  onClick={handleMinify}
                >
                  Minify
                </Button>
              </div>
            )}
          </div>
          <div className="relative group">
            <Textarea
              value={formData.mockResponse}
              onChange={(e) =>
                setFormData({ ...formData, mockResponse: e.target.value })
              }
              placeholder={
                formData.responseType === 'json'
                  ? '{\n  "success": true,\n  "data": []\n}'
                  : 'Hello World'
              }
              className="font-mono text-xs leading-relaxed resize-none min-h-[200px] h-[30vh] bg-background/50 border-border/50 focus:border-primary/50 custom-scrollbar p-4"
            />
            <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/50 font-mono pointer-events-none">
              {formData.mockResponse.length} chars
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
          <div className="flex items-center gap-3">
            <Switch
              id="rule-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
            <label
              htmlFor="rule-enabled"
              className="text-sm font-medium text-muted-foreground cursor-pointer"
            >
              Status: {formData.enabled ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 border-border/50 hover:bg-secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!formData.urlMatch.trim()}
          className="flex-1 h-11 shadow-lg shadow-primary/20"
        >
          {initialData ? 'Save Changes' : 'Create Rule'}
        </Button>
      </DialogFooter>
    </form>
  );
}
