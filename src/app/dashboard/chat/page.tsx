import { Suspense } from 'react';
import ChatViewPage from '@/features/chat/components/chat-view-page';

export const metadata = {
  title: 'Dashboard: Chat'
};

export default function Page() {
  // ChatViewPage reads ?userId= (vande-2011 #021).
  return (
    <Suspense>
      <ChatViewPage />
    </Suspense>
  );
}
