export const metadata = {
  title: 'Verify Email — Tapne',
  description: 'Verify your email address',
};

export default function VerifyPage(props?: { children?: any }) {
  return { kind: 'page', page: 'verify', children: props?.children };
}

