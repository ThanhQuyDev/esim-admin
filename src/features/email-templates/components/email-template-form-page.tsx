'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { emailTemplateKeys, emailTemplatesQueryOptions } from '../api/queries';
import { previewEmailTemplate, updateEmailTemplate } from '../api/service';
import type { EmailTemplate, UpdateEmailTemplatePayload } from '../api/types';
import { EMAIL_TEMPLATE_VARIABLES } from '../api/types';

type Step = 'edit' | 'preview';

/** Labels for the templates the backend seeds; any other name shows as-is. */
const TEMPLATE_LABELS: Record<string, string> = {
  esim_purchase: 'Gửi eSIM cho khách hàng',
  invoice_issued: 'Xác nhận yêu cầu xuất hoá đơn',
  partner_application_approved: 'Duyệt hồ sơ đối tác',
  partner_application_rejected: 'Từ chối hồ sơ đối tác'
};

const PREFERRED_DEFAULT = 'esim_purchase';

/** `{{variables}}` actually used in a template, for templates with no fixed list. */
function detectVariables(...texts: string[]) {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
      found.add(`{{${match[1]}}}`);
    }
  }
  return [...found].map((variable) => ({ variable, description: 'Đang dùng trong mẫu này' }));
}

export function EmailTemplateFormPage() {
  // The page used to load only `esim_purchase`; the partner approval/rejection
  // and invoice templates existed with no screen to edit them (#L020).
  const { data: templates } = useSuspenseQuery(emailTemplatesQueryOptions());
  const [selectedName, setSelectedName] = useState(() =>
    templates.some((t) => t.name === PREFERRED_DEFAULT)
      ? PREFERRED_DEFAULT
      : (templates[0]?.name ?? '')
  );
  const selected = templates.find((t) => t.name === selectedName);

  if (!selected) {
    return <p className='text-muted-foreground text-sm'>Chưa có mẫu email nào.</p>;
  }

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Chọn mẫu email</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedName} onValueChange={setSelectedName}>
            <SelectTrigger className='w-full sm:w-96'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {TEMPLATE_LABELS[t.name] ?? t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Keyed so a draft never carries over from one template to another. */}
      <TemplateEditor key={selected.name} template={selected} />
    </div>
  );
}

function TemplateEditor({ template }: { template: EmailTemplate }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('edit');
  const [subject, setSubject] = useState(template.subject ?? '');
  const [htmlBody, setHtmlBody] = useState(template.htmlBody ?? '');

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const variables = useMemo(
    () =>
      template.name === PREFERRED_DEFAULT
        ? EMAIL_TEMPLATE_VARIABLES
        : detectVariables(template.subject ?? '', template.htmlBody ?? ''),
    [template]
  );

  const updateMut = useMutation({
    mutationFn: (payload: UpdateEmailTemplatePayload) =>
      updateEmailTemplate(template.name, payload),
    onSuccess: () => {
      toast.success('Cập nhật template thành công');
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
    onError: (e) => toast.error(e.message || 'Cập nhật template thất bại')
  });

  function validate(): boolean {
    if (!subject.trim()) {
      toast.error('Tiêu đề email là bắt buộc');
      return false;
    }
    if (!htmlBody.trim()) {
      toast.error('Nội dung HTML là bắt buộc');
      return false;
    }
    return true;
  }

  async function handlePreview() {
    if (!validate()) return;

    setPreviewLoading(true);
    try {
      const res = await previewEmailTemplate(template.name, { htmlBody, subject });
      setPreviewHtml(res.html);
      setPreviewSubject(res.subject);
      setStep('preview');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể tải preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleSave() {
    if (!validate()) return;
    updateMut.mutate({ subject, htmlBody });
  }

  function insertVariable(variable: string) {
    setHtmlBody((prev) => prev + variable);
  }

  return (
    <div className='space-y-6'>
      {/* Stepper indicator */}
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => setStep('edit')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            step === 'edit'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <span className='flex h-6 w-6 items-center justify-center rounded-full border text-xs'>
            1
          </span>
          Chỉnh sửa
        </button>
        <Icons.chevronRight className='text-muted-foreground h-4 w-4' />
        <button
          type='button'
          onClick={handlePreview}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            step === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <span className='flex h-6 w-6 items-center justify-center rounded-full border text-xs'>
            2
          </span>
          Xem trước
        </button>
      </div>

      {step === 'edit' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin template</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Tên template</Label>
                <Input id='name' value={template.name} disabled className='bg-muted' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='subject'>
                  Tiêu đề email <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='subject'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder='vd: Your eSIM is ready'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.code className='h-4 w-4' />
                Biến có thể sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-3 text-sm'>
                Nhấn vào biến để chèn vào nội dung HTML. Các biến sẽ được thay thế bằng dữ liệu thực
                khi gửi email.
              </p>
              {variables.length === 0 ? (
                <p className='text-muted-foreground text-sm'>Mẫu này chưa dùng biến nào.</p>
              ) : (
                <>
                  <div className='flex flex-wrap gap-2'>
                    {variables.map((v) => (
                      <button
                        key={v.variable}
                        type='button'
                        onClick={() => insertVariable(v.variable)}
                        title={v.description}
                      >
                        <Badge
                          variant='outline'
                          className='cursor-pointer font-mono transition-colors hover:bg-primary hover:text-primary-foreground'
                        >
                          {v.variable}
                        </Badge>
                      </button>
                    ))}
                  </div>
                  <div className='mt-3 space-y-1'>
                    {variables.map((v) => (
                      <div
                        key={v.variable}
                        className='text-muted-foreground flex items-baseline gap-2 text-xs'
                      >
                        <code className='bg-muted rounded px-1 font-mono'>{v.variable}</code>
                        <span>— {v.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Nội dung HTML <span className='text-destructive'>*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                className='min-h-[400px] font-mono text-sm'
              />
            </CardContent>
          </Card>

          <div className='flex items-center justify-end gap-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={handlePreview}
              isLoading={previewLoading}
            >
              <Icons.eye className='mr-2 h-4 w-4' />
              Xem trước
            </Button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icons.send className='h-4 w-4' />
                Xem trước email
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>Tiêu đề</Label>
                <p className='text-sm font-medium'>{previewSubject}</p>
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>Nội dung</Label>
                <div className='rounded-lg border'>
                  <iframe
                    srcDoc={previewHtml}
                    title='Email preview'
                    className='h-[500px] w-full rounded-lg'
                    sandbox='allow-same-origin'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='flex items-center justify-end gap-3'>
            <Button type='button' variant='outline' onClick={() => setStep('edit')}>
              <Icons.chevronLeft className='mr-2 h-4 w-4' />
              Quay lại chỉnh sửa
            </Button>
            <Button type='button' onClick={handleSave} isLoading={updateMut.isPending}>
              <Icons.check className='mr-2 h-4 w-4' />
              Lưu template
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
