import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import MotionProvider from "./components/MotionProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PT Inovasi Kerja Digital - Solusi Absensi Digital",
  description: "Solusi Absensi Digital untuk Era Kerja Modern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn("h-full", "antialiased", inter.variable, jakarta.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* Material Symbols — preconnect untuk mengurangi blocking */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var attrs = ['bis_skin_checked', 'cz-shortcut-listen', 'fdprocessedid'];
                function clean(node) {
                  if (!node) return;
                  if (node.nodeType === 1) {
                    for (var i = 0; i < attrs.length; i++) {
                      var attr = attrs[i];
                      if (node.hasAttribute(attr)) node.removeAttribute(attr);
                    }
                  }
                  var children = node.children;
                  if (children) {
                    for (var i = 0; i < children.length; i++) {
                      clean(children[i]);
                    }
                  }
                }
                clean(document.documentElement);
                var observer = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'childList') {
                      for (var j = 0; j < m.addedNodes.length; j++) {
                        clean(m.addedNodes[j]);
                      }
                    } else if (m.type === 'attributes') {
                      var attr = m.attributeName;
                      if (attrs.indexOf(attr) !== -1 && m.target.nodeType === 1 && m.target.hasAttribute(attr)) {
                        m.target.removeAttribute(attr);
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: attrs
                });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
