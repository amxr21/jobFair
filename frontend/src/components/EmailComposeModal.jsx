import { useRef, useState, useEffect } from "react";
import Modal from "./Modal";

// Compose an email to a recipient, then hand off to the user's default mail app
// via a mailto: link. A mailto body can only carry PLAIN TEXT, so the editor
// offers light rich formatting (bold / bullet / numbered list) for comfort while
// writing, but the body is flattened to clean plain text on send — bold becomes
// *emphasis*, lists become "- " / "1." lines — so what lands in the mail client
// is readable and faithful without relying on HTML the client can't accept.

// Turn the contentEditable HTML into tidy plain text suitable for a mailto body.
const htmlToPlainText = (html) => {
    if (!html) return "";
    const root = document.createElement("div");
    root.innerHTML = html;

    const lines = [];
    const walkList = (listEl, ordered) => {
        let i = 1;
        listEl.querySelectorAll(":scope > li").forEach((li) => {
            const marker = ordered ? `${i++}. ` : "- ";
            lines.push(marker + (li.textContent || "").trim());
        });
    };

    root.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent.trim();
            if (t) lines.push(t);
            return;
        }
        const tag = node.tagName?.toLowerCase();
        if (tag === "ul") walkList(node, false);
        else if (tag === "ol") walkList(node, true);
        else if (tag === "br") lines.push("");
        else {
            // Approximate bold with *…* so emphasis survives into plain text
            const clone = node.cloneNode(true);
            clone.querySelectorAll("b,strong").forEach((b) => { b.textContent = `*${b.textContent}*`; });
            const t = (clone.textContent || "").replace(/\s+\n/g, "\n").trim();
            if (t) lines.push(t);
        }
    });

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const ToolbarButton = ({ onClick, title, children }) => (
    <button
        type="button"
        title={title}
        // preventDefault keeps focus in the editor so execCommand applies to the selection
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className="w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors text-sm"
    >
        {children}
    </button>
);

const EmailComposeModal = ({ visible, onClose, to, companyName }) => {
    const [subject, setSubject] = useState("");
    const editorRef = useRef(null);

    // Reset the form each time it opens for a fresh recipient
    useEffect(() => {
        if (visible) {
            setSubject("");
            // Clear the editor content on open
            requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = ""; });
        }
    }, [visible, to]);

    const exec = (cmd, val) => document.execCommand(cmd, false, val);

    const openMailApp = () => {
        const body = htmlToPlainText(editorRef.current?.innerHTML || "");
        const params = new URLSearchParams();
        if (subject) params.set("subject", subject);
        if (body) params.set("body", body);
        const qs = params.toString().replace(/\+/g, "%20"); // spaces as %20 for mail clients
        window.location.href = `mailto:${encodeURIComponent(to || "")}${qs ? `?${qs}` : ""}`;
        onClose?.();
    };

    return (
        <Modal visible={visible} onClose={onClose} maxWidth="max-w-lg" zIndex={100000}>
            <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                    <h2 className="text-base font-bold truncate">Email {companyName || "company"}</h2>
                    <p className="text-xs text-white/80 truncate">Opens in your mail app · {to}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0" aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Subject</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Message</label>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <ToolbarButton title="Bold" onClick={() => exec("bold")}><span className="font-bold">B</span></ToolbarButton>
                        <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" /></svg>
                        </ToolbarButton>
                        <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
                            <span className="text-xs font-semibold">1.</span>
                        </ToolbarButton>
                        <span className="text-[10px] text-gray-400 ml-1">Formatting is simplified to plain text for your mail app.</span>
                    </div>
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Write your message…"
                        className="min-h-[140px] max-h-[40vh] overflow-y-auto border border-gray-200 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-green-500 email-compose-editor"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <button onClick={onClose} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                    <button onClick={openMailApp} className="text-xs font-semibold text-white rounded-lg px-4 py-2 flex items-center gap-1.5" style={{ background: "#0E7F41" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Open in mail app
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EmailComposeModal;
