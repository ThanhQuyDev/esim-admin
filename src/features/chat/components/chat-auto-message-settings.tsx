'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface AutoMessageConfig {
  welcomeMessage: string;
  welcomeEnabled: boolean;
  greetingMessage: string;
  greetingEnabled: boolean;
}

const DEFAULT_CONFIG: AutoMessageConfig = {
  welcomeMessage: 'Xin chào! Chào mừng bạn đến với hỗ trợ trực tuyến của chúng tôi.',
  welcomeEnabled: true,
  greetingMessage: 'Xin chào, tôi có thể giúp gì cho bạn?',
  greetingEnabled: true
};

const STORAGE_KEY = 'chat-auto-messages';

function loadConfig(): AutoMessageConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: AutoMessageConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function ChatAutoMessageSettings() {
  const [config, setConfig] = useState<AutoMessageConfig>(loadConfig);

  const handleSave = () => {
    saveConfig(config);
    toast.success('Cài đặt tin nhắn tự động đã được lưu');
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.send className='h-4 w-4' />
            Tin nhắn chào mừng (Welcome Message)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-muted-foreground text-sm'>
            Tự động gửi khi khách hàng mở cửa sổ chat lần đầu.
          </p>
          <div className='flex items-center gap-2'>
            <Switch
              id='welcome-enabled'
              checked={config.welcomeEnabled}
              onCheckedChange={(checked) => setConfig((c) => ({ ...c, welcomeEnabled: checked }))}
            />
            <Label htmlFor='welcome-enabled'>Bật tin nhắn chào mừng</Label>
          </div>
          <Textarea
            value={config.welcomeMessage}
            onChange={(e) => setConfig((c) => ({ ...c, welcomeMessage: e.target.value }))}
            placeholder='Nhập nội dung tin nhắn chào mừng...'
            rows={3}
            disabled={!config.welcomeEnabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.chat className='h-4 w-4' />
            Tin nhắn thăm hỏi (Greeting Message)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-muted-foreground text-sm'>
            Tự động gửi khi khách hàng truy cập sâu vào luồng chat.
          </p>
          <div className='flex items-center gap-2'>
            <Switch
              id='greeting-enabled'
              checked={config.greetingEnabled}
              onCheckedChange={(checked) => setConfig((c) => ({ ...c, greetingEnabled: checked }))}
            />
            <Label htmlFor='greeting-enabled'>Bật tin nhắn thăm hỏi</Label>
          </div>
          <Textarea
            value={config.greetingMessage}
            onChange={(e) => setConfig((c) => ({ ...c, greetingMessage: e.target.value }))}
            placeholder='Nhập nội dung tin nhắn thăm hỏi...'
            rows={3}
            disabled={!config.greetingEnabled}
          />
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button onClick={handleSave}>
          <Icons.check className='mr-2 h-4 w-4' />
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
