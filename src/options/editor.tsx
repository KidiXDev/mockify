import { useAlert } from '@/components/providers/alert-provider';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { MockRule } from '@/types/rule';
import { Activity, Clock, Code2, FileJson, Link2 } from 'lucide-react';
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
    isRegex: initialData?.isRegex ?? false,
    responseType: initialData?.responseType ?? ('json' as 'json' | 'text'),
    mockResponse: initialData?.mockResponse ?? '',
    statusCode: initialData?.statusCode ?? 200,
    delay: initialData?.delay ?? 0,
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              URL Match
            </label>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/50 border border-border/50">
              <label
                htmlFor="is-regex"
                className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer select-none"
              >
                Regex
              </label>
              <Switch
                id="is-regex"
                className="scale-75 origin-right"
                checked={formData.isRegex}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRegex: checked })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              value={formData.urlMatch}
              onChange={(e) =>
                setFormData({ ...formData, urlMatch: e.target.value })
              }
              placeholder={
                formData.isRegex
                  ? 'e.g. ^https://api\\.example\\.com/.*'
                  : 'e.g. api/v1/users'
              }
              className="bg-background/50 border-border/50 focus:border-primary/50 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              {formData.isRegex
                ? 'The interceptor will use this as a regular expression to match URLs.'
                : 'The interceptor will match any URL containing this string.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Status Code
            </label>
            <div className="relative group">
              <select
                value={formData.statusCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusCode: parseInt(e.target.value) || 200
                  })
                }
                className="w-full h-10 px-3 pr-8 rounded-md bg-background/50 border border-border/50 focus:border-primary/50 text-sm appearance-none outline-none cursor-pointer transition-all hover:bg-background/80"
              >
                <optgroup label="2xx Success">
                  <option value={200}>200 OK</option>
                  <option value={201}>201 Created</option>
                  <option value={204}>204 No Content</option>
                </optgroup>
                <optgroup label="3xx Redirection">
                  <option value={301}>301 Moved Permanently</option>
                  <option value={302}>302 Found</option>
                  <option value={307}>307 Temporary Redirect</option>
                </optgroup>
                <optgroup label="4xx Client Error">
                  <option value={400}>400 Bad Request</option>
                  <option value={401}>401 Unauthorized</option>
                  <option value={403}>403 Forbidden</option>
                  <option value={404}>404 Not Found</option>
                  <option value={409}>409 Conflict</option>
                  <option value={422}>422 Unprocessable Content</option>
                  <option value={429}>429 Too Many Requests</option>
                </optgroup>
                <optgroup label="5xx Server Error">
                  <option value={500}>500 Internal Server Error</option>
                  <option value={502}>502 Bad Gateway</option>
                  <option value={503}>503 Service Unavailable</option>
                  <option value={504}>504 Gateway Timeout</option>
                </optgroup>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Delay (ms)
            </label>
            <Input
              type="number"
              min={0}
              step={100}
              value={formData.delay}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delay: parseInt(e.target.value) || 0
                })
              }
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
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
              className="font-mono text-xs leading-relaxed resize-none min-h-[150px] h-[30vh] bg-background/50 border-border/50 focus:border-primary/50 custom-scrollbar p-4"
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
