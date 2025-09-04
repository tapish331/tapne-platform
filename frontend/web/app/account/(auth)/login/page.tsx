export const metadata = {
  title: 'Login — Tapne',
  description: 'Login to your Tapne account',
};

// Keep free of JSX to avoid bringing in React for tests
export default function LoginPage(props?: { children?: any }) {
  // Return a simple marker object that tests can assert against
  return { kind: 'page', page: 'login', children: props?.children };
}

