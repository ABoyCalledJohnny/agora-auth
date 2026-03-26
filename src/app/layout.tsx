import "./globals.css";

export const metadata = {
  title: {
    default: "Agora Auth",
    template: "%s | Agora Auth", // pages just set title: "Login" → renders "Login | Agora Auth"
  },
  description: "Authentication and user management system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
