import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '아덴힐 현장 스마트 통합 관리',
  description: '차량, 장비, 공구 및 주요자재 모바일 현장 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        />
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}