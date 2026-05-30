import PageContainer from '@/components/layout/page-container';
import { ChatAutoMessageSettings } from '@/features/chat/components/chat-auto-message-settings';

export const metadata = {
  title: 'Dashboard: Cài đặt Chat'
};

export default function ChatSettingsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Cài đặt Chat'
      pageDescription='Quản lý tin nhắn tự động và cấu hình trò chuyện.'
    >
      <ChatAutoMessageSettings />
    </PageContainer>
  );
}
