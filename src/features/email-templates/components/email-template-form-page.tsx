'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { updateEsimPurchaseTemplateMutation } from '../api/mutations';
import { esimPurchaseTemplateQueryOptions } from '../api/queries';
import { previewEsimPurchaseTemplate } from '../api/service';
import type { UpdateEmailTemplatePayload } from '../api/types';
import { EMAIL_TEMPLATE_VARIABLES } from '../api/types';

type Step = 'edit' | 'preview';

export function EmailTemplateFormPage() {
  const { data: template } = useSuspenseQuery(esimPurchaseTemplateQueryOptions());

  const [step, setStep] = useState<Step>('edit');
  const [subject, setSubject] = useState(template.subject ?? '');
  const [htmlBody, setHtmlBody] = useState(template.htmlBody ?? '');

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const updateMut = useMutation({
    ...updateEsimPurchaseTemplateMutation,
    onSuccess: () => {
      toast.success('Cập nhật template thành công');
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
      const res = await previewEsimPurchaseTemplate({
        htmlBody,
        subject
      });
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
    const payload: UpdateEmailTemplatePayload = { subject, htmlBody };
    updateMut.mutate(payload);
  }

  function insertVariable(variable: string) {
    setHtmlBody((prev) => prev + variable);
  }

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
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
          {/* Form fields */}
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

          {/* Variables reference */}
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
              <div className='flex flex-wrap gap-2'>
                {EMAIL_TEMPLATE_VARIABLES.map((v) => (
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
                {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                  <div
                    key={v.variable}
                    className='text-muted-foreground flex items-baseline gap-2 text-xs'
                  >
                    <code className='bg-muted rounded px-1 font-mono'>{v.variable}</code>
                    <span>— {v.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* HTML editor */}
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
                placeholder='<html>&#10;  <body>&#10;    <h1>Xin chào!</h1>&#10;    <p>eSIM của bạn đã sẵn sàng: {{planName}}</p>&#10;  </body>&#10;</html>'
                className='min-h-[400px] font-mono text-sm'
              />
            </CardContent>
          </Card>

          {/* Actions */}
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
          {/* Preview */}
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

          {/* Actions */}
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
