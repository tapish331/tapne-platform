export const metadata = {
  title: 'Sign Up — Tapne',
  description: 'Create your Tapne account',
};

export default function SignupPage(props?: { children?: any }) {
  return { kind: 'page', page: 'signup', children: props?.children };
}

