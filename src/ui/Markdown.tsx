import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

/**
 * Renders imported answer markdown. react-markdown does not emit raw HTML, so untrusted
 * source content is safe; rehype-highlight adds `hljs-*` classes that styles.css colours.
 *
 * NOTE: rehype-highlight statically bundles highlight.js's common-language set (~35
 * grammars), which dominates the bundle. Trimming it (a custom lowlight instance or
 * lazy-loading the highlighter) is a deliberate follow-up, not part of this first screen.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{children}</ReactMarkdown>
    </div>
  )
}
