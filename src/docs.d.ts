/** docs/*.md compiled at build time (scripts/vite-docs.ts). */
declare module "*.md?doc" {
  const doc: {
    id: string;
    title: string;
    titleHtml: string;
    file: string;
    html: string;
    headings: { id: string; text: string; depth: number }[];
  };
  export default doc;
}
