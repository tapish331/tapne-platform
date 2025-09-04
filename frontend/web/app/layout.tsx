export const metadata = {
  title: 'Tapne',
  description: 'Tapne Platform — App Router bootstrap',
};

// Keep this free of JSX to avoid requiring react at runtime for tests
export default function RootLayout(props: { children: any }) {
  return props.children;
}

