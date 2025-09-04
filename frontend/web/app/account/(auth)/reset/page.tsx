export const metadata = {
  title: 'Reset Password — Tapne',
  description: 'Request or set a new password',
};

export default function ResetPage(props?: { children?: any }) {
  return { kind: 'page', page: 'reset', children: props?.children };
}

