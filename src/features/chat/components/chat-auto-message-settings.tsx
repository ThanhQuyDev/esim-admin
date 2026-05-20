'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { chatAutomationsQueryOptions } from '@/features/chat-automations/api/queries';
import {
  createChatAutomationMutation,
  updateChatAutomationMutation
} from '@/features/chat-automations/api/mutations';
import type { ChatAutomation, ChatAutomationType } from '@/features/chat-automations/api/types';

interface AutomationCardState {
  message: string;
  isActive: boolean;
}

function AutomationCard({
  type,
  title,
  description,
  icon,
  automation,
  onSave
}: {
  type: ChatAutomationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  automation: ChatAutomation | undefined;
  onSave: (type: ChatAutomationType, data: AutomationCardState, exists: boolean) => void;
}) {
  const [state, setState] = useState<AutomationCardState>({
    message: automation?.message ?? '',
    isActive: automation?.isActive ?? true
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (automation) {
      setState({ message: automation.message, isActive: automation.isActive });
      setIsDirty(false);
    }
  }, [automation]);

  const handleChange = (partial: Partial<AutomationCardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-muted-foreground text-sm'>{description}</p>
        <div className='flex items-center gap-2'>
          <Switch
            id={`${type}-enabled`}
            checked={state.isActive}
            onCheckedChange={(checked) => handleChange({ isActive: checked })}
          />
          <Label htmlFor={`${type}-enabled`}>Bật tin nhắn tự động</Label>
        </div>
        <Textarea
          value={state.message}
          onChange={(e) => handleChange({ message: e.target.value })}
          placeholder='Nhập nội dung tin nhắn...'
          rows={3}
          disabled={!state.isActive}
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            disabled={!isDirty || !state.message.trim()}
            onClick={() => {
              onSave(type, state, !!automation);
              setIsDirty(false);
            }}
          >
            <Icons.check className='mr-2 h-4 w-4' />
            Lưu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatAutoMessageSettings() {
  const { data: automations, isLoading } = useQuery(chatAutomationsQueryOptions());

  const createMutation = useMutation({
    ...createChatAutomationMutation,
    onSuccess: () => {
      toast.success('Đã tạo cấu hình tin nhắn tự động');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tạo cấu hình');
    }
  });

  const updateMutation = useMutation({
    ...updateChatAutomationMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật tin nhắn tự động');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi cập nhật');
    }
  });

  const handleSave = (type: ChatAutomationType, state: AutomationCardState, exists: boolean) => {
    if (exists) {
      updateMutation.mutate({ type, data: { message: state.message, isActive: state.isActive } });
    } else {
      createMutation.mutate({ type, message: state.message, isActive: state.isActive });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-48 w-full' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  }

  const welcomeAutomation = automations?.find((a) => a.type === 'WELCOME');
  const firstResponseAutomation = automations?.find((a) => a.type === 'FIRST_RESPONSE');

  return (
    <div className='space-y-4'>
      <AutomationCard
        type='WELCOME'
        title='Tin nhắn chào mừng (Welcome Message)'
        description='Tự động gửi khi khách hàng tham gia phòng chat.'
        icon={<Icons.send className='h-4 w-4' />}
        automation={welcomeAutomation}
        onSave={handleSave}
      />
      <AutomationCard
        type='FIRST_RESPONSE'
        title='Phản hồi đầu tiên (First Response)'
        description='Tự động gửi sau tin nhắn đầu tiên của khách hàng.'
        icon={<Icons.chat className='h-4 w-4' />}
        automation={firstResponseAutomation}
        onSave={handleSave}
      />
    </div>
  );
}
