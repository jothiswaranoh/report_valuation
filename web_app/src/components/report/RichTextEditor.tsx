import { useMemo, useRef, useEffect, useState } from 'react';
import JoditEditor from 'jodit-react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
    initialContent: string;
    onChange: (content: string) => void;
    readOnly?: boolean;
}

export default function RichTextEditor({ initialContent, onChange, readOnly = false }: RichTextEditorProps) {
    const editor = useRef(null);
    const [htmlContent, setHtmlContent] = useState('');
    const turndownService = useMemo(() => new TurndownService({ headingStyle: 'atx' }), []);

    useEffect(() => {
        // If the initial string is markdown (doesn't start with a clean HTML block), parse to HTML so Jodit reads it as formatting
        if (initialContent && !initialContent.trim().startsWith('<')) {
            try {
                // Parse markdown string to HTML for Jodit UI
                const parsedHTML = marked.parse(initialContent) as string;
                setHtmlContent(DOMPurify.sanitize(parsedHTML));
            } catch (e) {
                setHtmlContent(initialContent);
            }
        } else {
            setHtmlContent(initialContent || '');
        }
    }, [initialContent]);

    const handleBlur = (newHtmlContent: string) => {
        // Serialize edited HTML back to raw Markdown string for the backend
        const markdownFromHtml = turndownService.turndown(newHtmlContent);
        onChange(markdownFromHtml);
    };

    // useMemo prevents the editor from re-rendering unnecessarilly, which is a key optimization for Jodit Editor.
    const config = useMemo(() => ({
        readonly: readOnly,
        // The default toolbar has lots of nice features, but we can customize if needed.
        toolbar: !readOnly,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        minHeight: 400,
        height: '100%',
        placeholder: 'Start writing your summary...'
    }), [readOnly]);

    return (
        <div className="w-full h-full min-h-[400px] flex-1 border border-secondary-300 rounded-lg overflow-hidden bg-white flex flex-col">
            <style>{`
                .jodit-container {
                    flex-grow: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    height: 100% !important;
                }
                .jodit-workplace {
                    flex-grow: 1 !important;
                }
            `}</style>
            <JoditEditor
                ref={editor}
                value={htmlContent}
                config={config}
                onBlur={handleBlur} // Performant way to save with turndown serialization
                onChange={() => { }} // We use onBlur for better performance
            />
        </div>
    );
}
