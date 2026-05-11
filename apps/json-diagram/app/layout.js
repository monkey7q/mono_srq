import "./globals.css";

export const metadata = {
  title: "JSON Diagram Workbench",
  description: "Pure workbench for turning architecture requirements into JSON diagrams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
